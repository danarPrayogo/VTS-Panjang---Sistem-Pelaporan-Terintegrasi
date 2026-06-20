# VTS Panjang - Sistem Pelaporan Terintegrasi 🚢

[![Tech Stack](https://img.shields.io/badge/Stack-PERN%20%2B%20Prisma-blue?style=for-the-badge)](https://prisma.io)
[![Framework](https://img.shields.io/badge/Frontend-React%20%28Vite%29-indigo?style=for-the-badge)](https://vite.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%28Neon%29-emerald?style=for-the-badge)](https://neon.tech)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-dimgray?style=for-the-badge)](https://nodejs.org)

Sistem informasi berbasis web yang dirancang untuk mendigitalisasi proses perekapan laporan operasional kapal harian di UPT Vessel Traffic Services (VTS) Panjang. Sistem ini dibangun untuk menggantikan proses pertukaran data antar shift yang sebelumnya mengandalkan berkas fisik atau dokumen excel via WhatsApp/Email, menjadi sebuah platform terpusat di mana laporan dapat diunggah, ditinjau, dan digabungkan secara otomatis.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

Proyek ini dibangun menggunakan arsitektur monorepo dengan teknologi modern berikut:

### **Frontend (Sisi Klien)**
* **Framework:** React.js (via Vite)
* **Styling:** Tailwind CSS (v3) & Tailwind-based CSS animations
* **Routing:** React Router Dom (v7) untuk navigasi halaman dinamis

### **Backend (Sisi Server)**
* **Runtime:** Node.js
* **Framework:** Express.js (dengan `multer` untuk penanganan *upload* berkas PDF)
* **Pengolahan PDF:** `pdf-lib` untuk memproses penggabungan dokumen PDF secara terprogram
* **Keamanan:** JSON Web Token (JWT) untuk autentikasi sesi, BcryptJS untuk enkripsi kata sandi pengguna

### **Database & ORM**
* **Database:** PostgreSQL (di-hosting via Neon Database)
* **ORM (Object-Relational Mapping):** Prisma (v6)

---

## ✨ Fitur Utama

### 1. Autentikasi & Manajemen Pengguna (Role-Based Access Control)
Sistem memiliki dua tingkat akses (role) untuk pengguna:
* **Operator VTS (Shift Pagi & Shift Malam):** Memiliki akses untuk mengunggah berkas laporan harian operasional kapal (hanya format PDF) sesuai dengan shift kerja mereka (Pagi/Malam).
* **Admin Pelayanan:** Memiliki akses penuh untuk memantau semua aktivitas laporan harian, meninjau isi laporan, menyetujui (validasi) laporan dari Operator, serta menggabungkan laporan Pagi & Malam menjadi laporan harian gabungan.

### 2. Unggah Dokumen Laporan (File Upload)
Operator VTS dapat mengunggah berkas laporan harian kapal dalam format PDF sesuai dengan tanggal laporan dan shift kerja mereka. Jika laporan di tanggal & shift yang sama diunggah ulang, sistem akan memperbarui berkas lama di server lokal secara otomatis dan menyetel ulang statusnya ke `PENDING`.

### 3. Tinjauan & Validasi Laporan (Review & Approve)
Setiap laporan yang baru diunggah oleh Operator akan berstatus `PENDING`. Admin Pelayanan dapat melihat daftar seluruh laporan, mengunduh/membuka berkas tersebut, dan menyetujuinya sehingga status berubah menjadi `VALIDATED`.

### 4. Penggabungan PDF Otomatis (Merge PDF)
Apabila kedua laporan shift (Pagi dan Malam) pada tanggal tertentu telah diunggah dan disetujui (`VALIDATED`), Admin Pelayanan dapat memicu proses penggabungan berkas. Sistem akan secara otomatis menggabungkan dokumen PDF dari kedua shift tersebut menjadi satu berkas PDF final harian yang siap diarsipkan atau diserahkan ke pimpinan.

---

## 📂 Struktur Proyek

```text
vts-panjang-web/
├── backend/                   # Kode Backend (Express, Prisma, File Uploads)
│   ├── prisma/
│   │   └── schema.prisma      # Definisi Skema Database PostgreSQL
│   ├── uploads/               # Direktori Penyimpanan Berkas PDF Terunggah (diabaikan oleh git)
│   ├── .env                   # Variabel Lingkungan Backend (DATABASE_URL, JWT_SECRET, dll)
│   ├── index.js               # Entry Point & Router API Express
│   ├── package.json           # Dependensi Backend
│   └── make_pdf.js            # Script Pembuat Dummy PDF untuk testing
├── frontend/                  # Kode Frontend (Vite + React)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.css            # Styling Kustom Dashboard & Animasi
│   │   ├── App.jsx            # Semua Halaman, Login, & Dashboard Logic
│   │   ├── index.css          # Inisialisasi Tailwind CSS
│   │   └── main.jsx           # Entry Point React
│   ├── package.json           # Dependensi Frontend
│   ├── tailwind.config.js     # Konfigurasi Tailwind CSS
│   └── vite.config.js         # Konfigurasi Vite
└── make_pdf.js                # Script Pembuat Dummy PDF di root (opsional)
```

---

## 🗄️ Skema Database (Prisma Schema)

Struktur tabel di PostgreSQL dikelola secara efisien menggunakan model Prisma berikut:

```prisma
// Pengguna sistem
model User {
  id       Int      @id @default(autoincrement())
  username String   @unique
  password String   // Password terenkripsi dengan Bcrypt
  role     Role     @default(OPERATOR)
  shift    Shift?   // PAGI atau MALAM (kosong untuk Admin)
  reports  Report[] 
}

// Berkas Laporan Harian
model Report {
  id         Int      @id @default(autoincrement())
  date       DateTime @default(now())
  shift      Shift    // PAGI atau MALAM
  status     Status   @default(PENDING) // PENDING atau VALIDATED
  fileUrl    String   // Jalur berkas PDF di server
  operatorId Int
  operator   User     @relation(fields: [operatorId], references: [id])
}

enum Role {
  OPERATOR
  ADMIN
}

enum Shift {
  PAGI
  MALAM
}

enum Status {
  PENDING
  VALIDATED
}
```

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

Ikuti langkah-langkah di bawah ini secara berurutan untuk menjalankan proyek VTS Panjang di komputer lokal Anda.

### 📋 Prasyarat (Prerequisites)
Pastikan Anda telah menginstal software berikut pada sistem Anda:
1. **Node.js** (Rekomendasi versi LTS terbaru, minimal v18)
2. **NPM** (Bawaan dari Node.js)
3. **Akses Database PostgreSQL** (Bisa menggunakan server lokal PostgreSQL atau database cloud seperti [Neon Database](https://neon.tech))

---

### Langkah 1: Pengaturan Database & Server (Backend)

1. **Buka Terminal** dan masuk ke folder backend:
   ```bash
   cd backend
   ```

2. **Instal Dependensi Backend:**
   ```bash
   npm install
   ```

3. **Konfigurasi Variabel Lingkungan (`.env`):**
   Buat berkas bernama `.env` di dalam direktori `backend/` (jika belum ada) dan isi dengan konfigurasi berikut:
   ```env
   # Ganti URL PostgreSQL dengan string koneksi database Anda
  DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/vts-panjang-web?sslmode=require"
   PORT=5000
   JWT_SECRET="rahasia_vts_panjang_123"
   ```
   > [!NOTE]
   > Ganti `DATABASE_URL` dengan database PostgreSQL Anda sendiri jika database default di atas tidak dapat diakses atau ingin menggunakan lingkungan database yang terpisah.

4. **Sinkronisasi Skema Database & Generate Prisma Client:**
   Jalankan perintah berikut agar struktur tabel terbuat secara otomatis di database PostgreSQL Anda:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Jalankan Server Backend:**
   Mulai server dengan perintah:
   ```bash
   node index.js
   ```
   Server backend akan aktif dan siap menerima request di `http://localhost:5000`.

---

### Langkah 2: Pengaturan Aplikasi Web (Frontend)

1. **Buka Terminal Baru** (jangan matikan terminal backend), lalu masuk ke folder frontend:
   ```bash
   cd ../frontend
   ```

2. **Instal Dependensi Frontend:**
   ```bash
   npm install
   ```

3. **Jalankan Server Development Frontend:**
   ```bash
   npm run dev
   ```
   Vite akan memulai server lokal yang dapat diakses di `http://localhost:5173`.

4. **Buka Aplikasi di Browser:**
   Arahkan browser Anda ke `http://localhost:5173` untuk mengakses sistem.

---

## 🔑 Autentikasi Pengguna & Registrasi Akun

Untuk mencoba fitur secara lengkap, Anda memerlukan setidaknya 1 akun **Admin** dan 2 akun **Operator** (Shift Pagi & Shift Malam).

### Cara Registrasi Pengguna Baru via Web UI
Anda dapat mendaftarkan akun baru secara langsung melalui antarmuka web:
1. Di halaman beranda `http://localhost:5173`, klik tombol **"Masuk Sistem"** di pojok kanan atas atau klik tombol akses peran di bagian tengah *hero section*.
2. Pada modal masuk yang muncul, klik tautan **"Belum punya akun? Daftar di sini"** di bagian paling bawah.
3. Masukkan **Username**, **Password**, dan pilih **Peran (Role)**:
   * Jika memilih **Operator VTS**, tentukan **Shift Kerja** (Pagi / Malam).
   * Jika memilih **Admin Pelayanan**, field shift akan disembunyikan secara otomatis.
4. Klik **"Daftar Akun"**. Akun berhasil disimpan ke database dan Anda akan diarahkan kembali ke form Login untuk masuk.

---

## 📝 Pembuatan Berkas PDF Dummy untuk Pengujian

Apabila Anda tidak memiliki berkas laporan PDF asli untuk diunggah saat uji coba:
1. Masuk ke folder root proyek atau folder backend.
2. Jalankan perintah pembuat PDF tiruan:
   ```bash
   node make_pdf.js
   ```
   Perintah ini akan secara instan menghasilkan berkas `dummy.pdf` kosong yang siap digunakan sebagai berkas uji coba unggahan Operator.
