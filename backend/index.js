const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya berkas PDF atau Excel (.xlsx/.xls) yang diperbolehkan!'));
    }
  }
});

// Middleware Autentikasi JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token tidak valid atau kedaluwarsa" });
    req.user = user;
    next();
  });
};

// Rute Dasar (Cek Status Server)
app.get('/', (req, res) => {
  res.send('Server Backend VTS Panjang sudah berjalan!');
});

// ==========================================
// RUTE API AUTENTIKASI (LOGIN & REGISTER)
// ==========================================

// 1. API REGISTER (Untuk mendaftarkan Admin dan Operator VTS)
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, shift } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
        role: role || 'OPERATOR',
        shift: shift || null
      }
    });
    res.status(201).json({ message: "Akun berhasil didaftarkan!", data: { username: newUser.username, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ error: "Gagal mendaftar, username mungkin sudah digunakan." });
  }
});

// 2. API LOGIN (Untuk masuk ke sistem)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Password salah" });

    const token = jwt.sign(
      { userId: user.id, role: user.role, shift: user.shift },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: "Login Berhasil!", token, role: user.role, shift: user.shift });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// ==========================================
// RUTE API LAPORAN (UPLOAD, GET, VALIDATE, MERGE)
// ==========================================

// 1. API UPLOAD PDF LAPORAN (Untuk Operator)
app.post('/api/reports/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'OPERATOR') {
    return res.status(403).json({ error: "Hanya Operator VTS yang dapat mengunggah laporan harian." });
  }

  const { date, shift } = req.body;
  if (!date || !shift) {
    return res.status(400).json({ error: "Tanggal dan shift harus ditentukan." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Berkas laporan (PDF/Excel) harus disertakan." });
  }

  try {
    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Cek apakah laporan dengan shift dan tanggal yang sama sudah pernah diunggah
    const existingReport = await prisma.report.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        shift: shift
      }
    });

    const fileUrl = `/uploads/${req.file.filename}`;

    if (existingReport) {
      // Hapus file lama dari server lokal
      const oldPath = path.join(__dirname, existingReport.fileUrl);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (unlinkError) {
          console.error("Gagal menghapus file lama:", unlinkError);
        }
      }

      // Update isi laporan yang ada dan kembalikan statusnya ke PENDING
      const updatedReport = await prisma.report.update({
        where: { id: existingReport.id },
        data: {
          fileUrl,
          status: 'PENDING',
          operatorId: req.user.userId
        }
      });
      return res.json({ message: "Laporan shift berhasil diperbarui!", data: updatedReport });
    } else {
      // Simpan laporan baru ke database
      const newReport = await prisma.report.create({
        data: {
          date: new Date(date),
          shift,
          fileUrl,
          status: 'PENDING',
          operatorId: req.user.userId
        }
      });
      return res.status(201).json({ message: "Laporan shift berhasil diunggah!", data: newReport });
    }
  } catch (error) {
    console.error("Gagal menyimpan laporan:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengunggah laporan ke server." });
  }
});

// 2. API GET DAFTAR LAPORAN (Admin melihat semua, Operator melihat milik sendiri)
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    let reports;
    if (req.user.role === 'ADMIN') {
      reports = await prisma.report.findMany({
        include: {
          operator: {
            select: { username: true }
          }
        },
        orderBy: { date: 'desc' }
      });
    } else {
      reports = await prisma.report.findMany({
        where: { operatorId: req.user.userId },
        orderBy: { date: 'desc' }
      });
    }
    res.json(reports);
  } catch (error) {
    console.error("Gagal mengambil laporan:", error);
    res.status(500).json({ error: "Gagal mengambil data laporan dari server." });
  }
});

// 3. API VALIDASI STATUS LAPORAN (Untuk Admin)
app.patch('/api/reports/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Akses ditolak. Hanya Admin Pelayanan yang dapat melakukan validasi." });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!['PENDING', 'VALIDATED'].includes(status)) {
    return res.status(400).json({ error: "Status validasi tidak sah." });
  }

  try {
    const updatedReport = await prisma.report.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json({ message: `Status laporan berhasil diubah ke ${status}`, data: updatedReport });
  } catch (error) {
    console.error("Gagal mengubah status laporan:", error);
    res.status(500).json({ error: "Gagal memperbarui status validasi laporan." });
  }
});

// 4. API GABUNG LAPORAN PAGI & MALAM (Untuk Admin)
app.post('/api/reports/merge', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Akses ditolak. Hanya Admin Pelayanan yang dapat menggabungkan laporan." });
  }

  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: "Tanggal laporan harus dispesifikasikan." });
  }

  try {
    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Cari laporan Pagi dan Malam yang sudah divalidasi pada tanggal tersebut
    const reports = await prisma.report.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'VALIDATED'
      }
    });

    const pagiReport = reports.find(r => r.shift === 'PAGI');
    const malamReport = reports.find(r => r.shift === 'MALAM');

    if (!pagiReport || !malamReport) {
      return res.status(400).json({
        error: "Laporan Pagi dan Malam untuk tanggal tersebut harus tersedia dan sudah disetujui (VALIDATED) sebelum digabungkan."
      });
    }

    const pagiPath = path.join(__dirname, pagiReport.fileUrl);
    const malamPath = path.join(__dirname, malamReport.fileUrl);

    // Cek apakah ada berkas yang bukan PDF (misal Excel)
    const pagiExt = path.extname(pagiReport.fileUrl).toLowerCase();
    const malamExt = path.extname(malamReport.fileUrl).toLowerCase();

    if (pagiExt !== malamExt) {
      return res.status(400).json({
        error: "Format berkas tidak cocok. Kedua berkas laporan harus memiliki format yang sama (keduanya PDF atau keduanya Excel)."
      });
    }

    if (pagiExt !== '.pdf' && pagiExt !== '.xlsx' && pagiExt !== '.xls') {
      return res.status(400).json({
        error: "Format berkas tidak didukung untuk penggabungan."
      });
    }

    if (!fs.existsSync(pagiPath) || !fs.existsSync(malamPath)) {
      return res.status(404).json({ error: "Berkas fisik laporan tidak ditemukan di server. Pastikan berkas belum dihapus." });
    }

    if (pagiExt === '.pdf') {
      // Proses penggabungan dengan pdf-lib
      const pagiBytes = fs.readFileSync(pagiPath);
      const malamBytes = fs.readFileSync(malamPath);

      const mergedPdf = await PDFDocument.create();

      const pagiPdfDoc = await PDFDocument.load(pagiBytes);
      const malamPdfDoc = await PDFDocument.load(malamBytes);

      const pagiPages = await mergedPdf.copyPages(pagiPdfDoc, pagiPdfDoc.getPageIndices());
      pagiPages.forEach(page => mergedPdf.addPage(page));

      const malamPages = await mergedPdf.copyPages(malamPdfDoc, malamPdfDoc.getPageIndices());
      malamPages.forEach(page => mergedPdf.addPage(page));

      const mergedPdfBytes = await mergedPdf.save();

      // Simpan file hasil gabungan
      const mergedFilename = `merged-${date}-${Date.now()}.pdf`;
      const mergedPath = path.join(__dirname, 'uploads', mergedFilename);

      fs.writeFileSync(mergedPath, mergedPdfBytes);

      return res.json({
        message: "Laporan pagi & malam berhasil digabungkan!",
        mergedFileUrl: `/uploads/${mergedFilename}`
      });
    } else {
      // Logic penggabungan Excel (.xlsx / .xls) menggunakan exceljs
      const workbookPagi = new ExcelJS.Workbook();
      await workbookPagi.xlsx.readFile(pagiPath);
      const worksheetPagi = workbookPagi.getWorksheet(1);

      const workbookMalam = new ExcelJS.Workbook();
      await workbookMalam.xlsx.readFile(malamPath);
      const worksheetMalam = workbookMalam.getWorksheet(1);

      // Cari baris akhir data pagi
      let pagiEndRow = 19;
      while (true) {
        const row = worksheetPagi.getRow(pagiEndRow);
        const timeCell = row.getCell(1).value;
        const nameCell = row.getCell(2).value;
        if (!timeCell && !nameCell) {
          break;
        }
        pagiEndRow++;
      }
      pagiEndRow--;

      // Cari baris akhir data malam
      let malamEndRow = 19;
      while (true) {
        const row = worksheetMalam.getRow(malamEndRow);
        const timeCell = row.getCell(1).value;
        const nameCell = row.getCell(2).value;
        if (!timeCell && !nameCell) {
          break;
        }
        malamEndRow++;
      }
      malamEndRow--;

      const malamRowCount = malamEndRow - 19 + 1;
      
      // Sisipkan baris kosong di bawah data pagi agar tanda tangan/signature bergeser ke bawah
      worksheetPagi.spliceRows(pagiEndRow + 1, 0, ...Array(malamRowCount).fill([]));

      // Salin sel dari malam ke pagi
      for (let i = 0; i < malamRowCount; i++) {
        const targetRowNum = pagiEndRow + 1 + i;
        const sourceRowNum = 19 + i;

        const sourceRow = worksheetMalam.getRow(sourceRowNum);
        const targetRow = worksheetPagi.getRow(targetRowNum);

        targetRow.height = sourceRow.height;

        for (let col = 1; col <= 15; col++) {
          const sourceCell = sourceRow.getCell(col);
          const targetCell = targetRow.getCell(col);

          targetCell.value = sourceCell.value;
          targetCell.style = sourceCell.style;
        }
      }

      // Re-numbering kolom No (kolom 15) dari baris 19 sampai akhir penggabungan
      let currentNo = 1;
      for (let r = 19; r <= pagiEndRow + malamRowCount; r++) {
        const row = worksheetPagi.getRow(r);
        const noCell = row.getCell(15);
        noCell.value = currentNo++;
      }

      const mergedFilename = `merged-${date}-${Date.now()}.xlsx`;
      const mergedPath = path.join(__dirname, 'uploads', mergedFilename);

      await workbookPagi.xlsx.writeFile(mergedPath);

      return res.json({
        message: "Laporan pagi & malam berhasil digabungkan!",
        mergedFileUrl: `/uploads/${mergedFilename}`
      });
    }
  } catch (error) {
    console.error("Gagal menggabungkan berkas:", error);
    res.status(500).json({ error: "Terjadi kesalahan server saat menggabungkan berkas." });
  }
});

// Menyalakan server
app.listen(PORT, () => {
  console.log(`Server Backend VTS berjalan di http://localhost:${PORT}`);
});