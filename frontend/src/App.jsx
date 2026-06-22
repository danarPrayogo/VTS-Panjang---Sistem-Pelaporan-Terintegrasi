import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

// Helper Formulasi Tanggal Indonesia
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// ==========================================
// 🔔 KOMPONEN TOAST NOTIFICATION (KUSTOM)
// ==========================================
function ToastNotification({ show, message, type, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, message, type, onClose]);

  if (!show) return null;

  const bgStyles = {
    success: 'bg-emerald-55 bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100/40',
    error: 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100/40',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-indigo-100/40'
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-emerald-650 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    )
  };

  return (
    <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full p-4 border rounded-2xl shadow-xl flex items-center space-x-3 animate-in slide-in-from-top-5 duration-300 ${bgStyles[type]}`}>
      {icons[type]}
      <div className="flex-1 text-sm font-semibold leading-snug">{message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-655 p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
}

// ==========================================
// ❓ KOMPONEN CONFIRMATION MODAL (KUSTOM)
// ==========================================
function ConfirmationModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl w-full max-w-sm relative text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">

        {/* Help Circle Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>

        {/* Text content */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Tindakan</h3>
          <p className="text-slate-500 text-xs leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shadow-indigo-150"
          >
            Ya, Setujui
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🔑 MODAL AUTENTIKASI (LOGIN & REGISTER OVERLAY)
// ==========================================
function LoginModal({ isOpen, onClose, onLoginSuccess, initialRole = 'OPERATOR', initialType = 'LOGIN', showToast }) {
  const [isLogin, setIsLogin] = useState(initialType === 'LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [shift, setShift] = useState('PAGI');

  useEffect(() => {
    setIsLogin(initialType === 'LOGIN');
  }, [initialType, isOpen]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    const url = `${API_BASE}/api/auth/${endpoint}`;

    const payload = isLogin
      ? { username, password }
      : { username, password, role, shift: role === 'OPERATOR' ? shift : null };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onLoginSuccess(data.token, data.role, data.shift);
          onClose();
          showToast('Login berhasil! Selamat bekerja.', 'success');
        } else {
          showToast('Registrasi akun berhasil! Silakan masuk.', 'success');
          setIsLogin(true);
        }
      } else {
        showToast(data.error || 'Terjadi masalah pada server', 'error');
      }
    } catch (error) {
      showToast('Gagal menghubungkan ke server backend.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-655 transition-colors p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/85 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">VTS Panjang</h1>
          <p className="text-slate-500 text-xs mt-1">Sistem Pelaporan Harian Kapal Terintegrasi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-955 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Peran (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                >
                  <option value="OPERATOR">Operator VTS</option>
                  <option value="ADMIN">Admin Pelayanan</option>
                </select>
              </div>

              {role === 'OPERATOR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Shift Kerja</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                  >
                    <option value="PAGI">Pagi (08:00 - 16:00)</option>
                    <option value="MALAM">Malam (18-30 - 08:00)</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer mt-3"
          >
            {isLogin ? 'Masuk Sistem' : 'Daftar Akun'}
          </button>
        </form>

        <div className="mt-5 text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-indigo-650 hover:text-indigo-700 font-semibold focus:outline-none transition-colors cursor-pointer"
          >
            {isLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk sistem'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🏠 KOMPONEN LANDING PAGE (BERANDA UTAMA)
// ==========================================
function LandingPage({ onLoginClick, onRegisterClick }) {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm shadow-slate-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">VTS Panjang</span>
            </div>

            {/* Tombol Akses */}
            <div className="flex space-x-3">
              <button
                onClick={() => onRegisterClick('OPERATOR')}
                className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-750 font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Cara Daftar
              </button>
              <button
                onClick={() => onLoginClick('OPERATOR')}
                className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm shadow-indigo-950/20"
              >
                Masuk Sistem
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center py-20 md:py-28 text-center"
        style={{ backgroundImage: `url('/vts_harbor_bg.png')` }}
      >
        {/* Dark Tint overlay */}
        <div className="absolute inset-0 bg-slate-950/70"></div>

        <div className="relative max-w-4xl mx-auto px-4 space-y-6 z-10 text-white">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase leading-tight max-w-3xl mx-auto">
            Kelola Laporan Kapal<br />Lebih Cepat & Terstruktur
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Sistem Pelaporan Harian Kapal Terintegrasi untuk efisiensi dan tata kelola yang lebih baik.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => onLoginClick('ADMIN')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl shadow-md transition-all cursor-pointer text-sm"
            >
              <svg className="w-4 h-4 mr-2 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Masuk sebagai Admin
            </button>
            <button
              onClick={() => onLoginClick('OPERATOR')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-white/30 hover:border-white/50 hover:bg-white/10 text-white font-bold rounded-xl transition-all cursor-pointer backdrop-blur-sm text-sm"
            >
              <svg className="w-4 h-4 mr-2 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Masuk sebagai Operator
            </button>
          </div>
        </div>
      </div>

      {/* Stats Container */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-20">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-7 grid grid-cols-2 md:grid-cols-5 gap-6 divide-y-0 divide-x-0 md:divide-x divide-slate-100 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900">2</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Per Hari</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900">4</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Dokumen</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900 flex justify-center items-baseline gap-1">
              <span>1</span> <span className="text-base font-bold text-slate-500">PDF</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format PDF</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900">1</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ekspor Gabungan</div>
          </div>
          <div className="space-y-1 col-span-2 md:col-span-1">
            <div className="text-3xl font-extrabold text-slate-900">2</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Pengguna</div>
          </div>
        </div>
      </div>

      {/* Info Section Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column: Hak Akses */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-indigo-655 uppercase tracking-wider">Hak Akses</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Dua peran, satu sistem terpadu</h2>
            <p className="text-slate-505 text-xs mt-2">
              Hak akses dalam sistem didasarkan pada peran masing-masing pengguna, memberikan wewenang yang sesuai untuk pemenuhan tugas operasional VTS secara terpadu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Card */}
            <div className="border border-slate-100 rounded-xl p-5 space-y-4 hover:border-indigo-150 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Operator VTS</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-extrabold rounded-full">
                    Shift Pagi & Malam
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Melakukan perekapan dan pengunggahan berkas laporan harian operasional kapal sesuai shift kerja.
              </p>
              <div className="border-t border-slate-50 pt-3 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Hak Akses:</div>
                <div className="flex items-center text-xs text-slate-655 font-medium">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Akses Operator VTS
                </div>
                <div className="flex items-center text-xs text-slate-655 font-medium">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Upload Laporan Shift
                </div>
                <div className="flex items-center text-xs text-slate-655 font-medium">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Riwayat Laporan Shift
                </div>
              </div>
            </div>

            {/* Admin Card */}
            <div className="border border-slate-100 rounded-xl p-5 space-y-4 hover:border-indigo-150 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Admin Pelayanan</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full">
                    Lantai 1 — Akses Penuh
                  </span>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Memiliki wewenang penuh untuk meninjau seluruh laporan, melakukan validasi, serta mengekspor berkas gabungan.
              </p>
              <div className="border-t border-slate-50 pt-3 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Hak Akses:</div>
                <div className="flex items-center text-xs text-slate-655 font-medium">
                  <svg className="w-4 h-4 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Akses Dashboard Admin
                </div>
                <div className="flex items-center text-xs text-slate-655 font-medium">
                  <svg className="w-4 h-4 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Validasi Status Laporan
                </div>
                <div className="flex items-center text-xs text-slate-655 font-medium">
                  <svg className="w-4 h-4 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Penggabungan PDF Harian
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Alur Kerja */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-indigo-650 uppercase tracking-wider">Alur Kerja</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Dari upload hingga dokumen final</h2>
            <p className="text-slate-500 text-xs mt-2">
              Proses pengumpulan laporan harian VTS dirancang secara berurutan dan transparan untuk memudahkan pelacakan:
            </p>
          </div>

          <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-9 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold ring-4 ring-white">
                1
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                  Admin
                </span>
                <span className="font-bold text-slate-900 text-sm">Unggah Form Laporan Shift</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold rounded">
                  PENDING
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Unggah berkas laporan harian per shift kerja oleh Operator VTS untuk ditinjau.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-9 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-655 text-white text-[10px] font-bold ring-4 ring-white">
                2
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] font-bold rounded">
                  Opera.
                </span>
                <span className="font-bold text-slate-900 text-sm">Unggah Form Laporan Shift</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold rounded">
                  PENDING
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Laporan masuk ke sistem dengan status PENDING menunggu verifikasi dari Admin Pelayanan.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-9 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-750 text-white text-[10px] font-bold ring-4 ring-white">
                3
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                  Admin
                </span>
                <span className="font-bold text-slate-900 text-sm">Unggah Form Laporan Shift</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold rounded">
                  VALIDATED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Admin menyetujui dan memvalidasi berkas laporan shift harian setelah proses verifikasi.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-9 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-855 text-white text-[10px] font-bold ring-4 ring-white">
                4
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                  Admin
                </span>
                <span className="font-bold text-slate-900 text-sm">Unggah Form Laporan Shift</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold rounded">
                  VALIDATED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sistem menggabungkan laporan shift pagi & malam menjadi satu file PDF laporan harian gabungan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 📊 DASHBOARD UTAMA (TEMA TERANG)
// ==========================================
function Dashboard({ onLogout, showToast }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userShift = localStorage.getItem('shift');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trashReports, setTrashReports] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileType = file.type;
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (allowedTypes.includes(fileType) || file.name.endsWith('.pdf') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setPdfFile(file);
      } else {
        showToast('Hanya berkas PDF atau Excel (.xlsx/.xls) yang diperbolehkan!', 'error');
      }
    }
  };

  const handleBoxClick = (e) => {
    if (e.target.id !== 'report-file') {
      document.getElementById('report-file').click();
    }
  };

  // Perhitungan statistik dokumen dinamis
  const totalDocs = reports.length;
  const validatedDocs = reports.filter(r => r.status === 'VALIDATED').length;
  const pendingDocs = reports.filter(r => r.status === 'PENDING').length;

  // Form Operator
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().substring(0, 10));
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Filter Admin / Merge PDF
  const [mergeDate, setMergeDate] = useState(new Date().toISOString().substring(0, 10));
  const [mergedPdfUrl, setMergedPdfUrl] = useState('');
  const [merging, setMerging] = useState(false);

  // State Modal Konfirmasi Kustom
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data);
      } else {
        console.error("Gagal mengambil data:", data.error);
      }
    } catch (error) {
      console.error("Kesalahan jaringan:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashReports = async () => {
    setTrashLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/trash`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTrashReports(data);
      } else {
        console.error("Gagal mengambil data trash:", data.error);
      }
    } catch (error) {
      console.error("Kesalahan jaringan:", error);
    } finally {
      setTrashLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (activeTab === 'trash') {
      fetchTrashReports();
    }
  }, [activeTab]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) return showToast('Silakan pilih berkas laporan terlebih dahulu!', 'error');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('date', uploadDate);
    formData.append('shift', userShift);

    try {
      const res = await fetch(`${API_BASE}/api/reports/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Laporan berhasil diunggah!', 'success');
        setPdfFile(null);
        document.getElementById('report-file').value = '';
        fetchReports();
      } else {
        showToast('Gagal mengunggah: ' + (data.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = (id, currentStatus) => {
    const nextStatus = currentStatus === 'PENDING' ? 'VALIDATED' : 'PENDING';
    const confirmMsg = nextStatus === 'VALIDATED'
      ? 'Setujui dan nyatakan laporan ini valid?'
      : 'Ubah kembali status laporan ini menjadi PENDING?';

    setConfirmModal({
      show: true,
      message: confirmMsg,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`${API_BASE}/api/reports/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: nextStatus })
          });

          const data = await res.json();
          if (res.ok) {
            showToast(data.message, 'success');
            fetchReports();
          } else {
            showToast('Gagal memvalidasi: ' + (data.error || 'Terjadi kesalahan'), 'error');
          }
        } catch (err) {
          showToast('Kesalahan jaringan.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      message: 'Apakah Anda yakin ingin menghapus laporan ini? Laporan akan dipindahkan ke tempat sampah dan dapat dipulihkan dalam waktu 30 hari.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`${API_BASE}/api/reports/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message, 'success');
            fetchReports();
          } else {
            showToast('Gagal menghapus: ' + (data.error || 'Terjadi kesalahan'), 'error');
          }
        } catch (err) {
          showToast('Kesalahan jaringan.', 'error');
        }
      }
    });
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        fetchTrashReports();
        fetchReports();
      } else {
        showToast('Gagal memulihkan: ' + (data.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan.', 'error');
    }
  };

  const handleOpenFile = (e, fileUrl) => {
    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      e.preventDefault();
      setPreviewUrl(`${API_BASE}${fileUrl}`);
    } else {
      // Excel files cannot be previewed in iframe, they will download naturally.
      showToast('Berkas Excel tidak dapat dipratinjau secara langsung, mengunduh berkas...', 'info');
    }
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    setMerging(true);
    setMergedPdfUrl('');

    try {
      const res = await fetch(`${API_BASE}/api/reports/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: mergeDate })
      });

      const data = await res.json();

      if (res.ok) {
        setMergedPdfUrl(data.mergedFileUrl);
        showToast(data.message || 'Laporan pagi dan malam berhasil digabungkan!', 'success');
      } else {
        showToast('Gagal menggabungkan: ' + (data.error || 'Pastikan laporan Pagi & Malam di tanggal ini sudah disetujui'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan saat proses penggabungan.', 'error');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-700 font-sans pb-12">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm shadow-slate-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">VTS Panjang</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peran Pengguna</span>
                <span className="text-sm text-indigo-650 font-bold tracking-tight">
                  {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin Pelayanan' : `Operator Shift ${userShift}`}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* Welcome Section */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm shadow-slate-100/40 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Selamat Datang di Portal VTS</h2>
            <p className="text-slate-505 text-xs mt-1">Gunakan dashboard ini untuk mengelola, meninjau, dan mengekspor rekap laporan harian.</p>
          </div>
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Peran: {role}
            </span>
            {role !== 'ADMIN' && role !== 'SUPER_ADMIN' && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${userShift === 'PAGI' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-violet-50 text-violet-750 border border-violet-200'}`}>
                Shift: {userShift}
              </span>
            )}
          </div>
        </div>

        {/* Stats Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Dokumen */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center space-x-4">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{totalDocs}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dokumen Laporan</div>
            </div>
          </div>

          {/* Card 2: Sudah Divalidasi */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center space-x-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{validatedDocs}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sudah Divalidasi</div>
            </div>
          </div>

          {/* Card 3: Belum Divalidasi */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center space-x-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{pendingDocs}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Divalidasi</div>
            </div>
          </div>
        </div>

        {/* Dashboards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Operator Panel */}
          {role === 'OPERATOR' && (
            <div className="lg:col-span-1 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Upload Laporan Shift
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Unggah berkas PDF atau Excel laporan operasional harian Anda.</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Tanggal Laporan</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-slate-955 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Shift Kerja (Otomatis)</label>
                  <input
                    type="text"
                    value={userShift === 'PAGI' ? 'SHIFT PAGI (08:00 - 16:00)' : 'SHIFT MALAM (18-30 - 08:00)'}
                    className="mt-1 block w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium text-sm select-none"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Berkas Laporan</label>
                  <div
                    onClick={handleBoxClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all cursor-pointer relative ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50/30 scale-[0.99] shadow-inner' 
                        : 'border-slate-200 bg-slate-55/50 hover:bg-slate-50 hover:border-indigo-500/55'
                    }`}
                  >
                    <div className="space-y-1 text-center pointer-events-none">
                      <svg className="mx-auto h-10 w-10 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-slate-500 justify-center">
                        <span className="font-semibold text-indigo-600 hover:text-indigo-700">
                          Pilih berkas PDF atau Excel
                        </span>
                        <input
                          id="report-file"
                          type="file"
                          accept="application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          onChange={(e) => setPdfFile(e.target.files[0])}
                          onClick={(e) => e.stopPropagation()}
                          className="sr-only"
                        />
                      </div>
                      <p className="text-xs text-slate-455">Format PDF, XLSX, atau XLS (Max 10MB)</p>
                    </div>
                  </div>
                  {pdfFile && (
                    <p className="mt-2 text-xs text-emerald-700 font-semibold flex items-center bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      File terpilih: {pdfFile.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
                >
                  {uploading ? 'Mengunggah...' : 'Kirim Laporan'}
                </button>
              </form>
            </div>
          )}

          {/* Admin Panel */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
            <div className="lg:col-span-1 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                  Penggabung PDF (Merge)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Gabungkan berkas PDF pagi & malam pada tanggal tertentu.</p>
              </div>

              <form onSubmit={handleMerge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Tanggal Laporan Harian</label>
                  <input
                    type="date"
                    value={mergeDate}
                    onChange={(e) => setMergeDate(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-slate-955 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={merging}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
                >
                  {merging ? 'Menggabungkan...' : 'Gabungkan PDF'}
                </button>
              </form>

              {mergedPdfUrl && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                  <p className="text-xs text-emerald-700 font-bold flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {mergedPdfUrl.toLowerCase().endsWith('.xlsx') || mergedPdfUrl.toLowerCase().endsWith('.xls')
                      ? 'Excel Berhasil Digabungkan!'
                      : 'PDF Berhasil Digabungkan!'}
                  </p>
                  <a
                    href={`${API_BASE}${mergedPdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex justify-center items-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {mergedPdfUrl.toLowerCase().endsWith('.xlsx') || mergedPdfUrl.toLowerCase().endsWith('.xls')
                      ? 'Unduh Excel Hasil Gabungan'
                      : 'Unduh PDF Hasil Gabungan'}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tabel Riwayat */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`text-base font-bold pb-2 flex items-center transition-all cursor-pointer ${activeTab === 'reports' ? 'text-indigo-650 border-b-2 border-indigo-650' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'Antrean Tinjauan Laporan VTS' : 'Riwayat Pengiriman Laporan'}
                </button>
                {role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => setActiveTab('trash')}
                    className={`text-base font-bold pb-2 flex items-center transition-all cursor-pointer ${activeTab === 'trash' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Tempat Sampah
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'reports') {
                    setLoading(true);
                    fetchReports();
                  } else {
                    fetchTrashReports();
                  }
                }}
                className="p-2 bg-white hover:bg-slate-50 text-slate-655 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                title="Perbarui Tabel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.27 15M21 12h-5"></path>
                </svg>
              </button>
            </div>

            {activeTab === 'trash' ? (
              trashLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <div className="w-8 h-8 border-4 border-rose-650 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-405">Memuat tempat sampah...</p>
                </div>
              ) : trashReports.length === 0 ? (
                <div className="text-center py-16 border border-slate-100 rounded-xl bg-slate-50/20">
                  <svg className="mx-auto h-10 w-10 text-slate-350" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <p className="mt-3 text-sm font-semibold text-slate-600">Tempat Sampah Kosong</p>
                  <p className="text-xs text-slate-450 mt-0.5">Tidak ada laporan yang dihapus baru-baru ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Shift</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Nama Berkas</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Operator</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Sisa Waktu</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-555 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {trashReports.map((report) => {
                        const daysLeft = Math.max(0, 30 - Math.floor((new Date() - new Date(report.deletedAt)) / (1000 * 60 * 60 * 24)));
                        return (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                              {formatDate(report.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${report.shift === 'PAGI' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                {report.shift}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-655 font-medium max-w-[200px] truncate" title={report.fileName || report.fileUrl.split('/').pop()}>
                              {report.fileName || report.fileUrl.split('/').pop()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-655 font-medium">
                              {report.operator?.username || 'Tidak Diketahui'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-655 font-medium">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${daysLeft > 7 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {daysLeft} Hari Tersisa
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleRestore(report.id)}
                                className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.27 15M21 12h-5"></path>
                                </svg>
                                Pulihkan
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-405">Menghubungkan ke database...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 border border-slate-100 rounded-xl bg-slate-50/20">
                <svg className="mx-auto h-10 w-10 text-slate-350" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p className="mt-3 text-sm font-semibold text-slate-600">Tidak Ada Laporan</p>
                <p className="text-xs text-slate-450 mt-0.5">Belum ada dokumen yang diunggah untuk saat ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-550 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Shift</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Nama Berkas</th>
                      {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Operator</th>
                      )}
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-555 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-555 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {formatDate(report.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${report.shift === 'PAGI' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                            {report.shift}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-655 font-medium max-w-[200px] truncate" title={report.fileName || report.fileUrl.split('/').pop()}>
                          {report.fileName || report.fileUrl.split('/').pop()}
                        </td>
                        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-655 font-medium">
                            {report.operator?.username || 'Tidak Diketahui'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${report.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <a
                            href={`${API_BASE}${report.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => handleOpenFile(e, report.fileUrl)}
                            className="inline-flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all hover:text-indigo-650 hover:border-indigo-100"
                          >
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            Buka File
                          </a>
                          {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                            <button
                              onClick={() => handleValidate(report.id, report.status)}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${report.status === 'VALIDATED' ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-750 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-755 border-emerald-200'}`}
                            >
                              {report.status === 'VALIDATED' ? 'Batalkan Validasi' : 'Setujui (Validasi)'}
                            </button>
                          )}
                          {((role === 'ADMIN' || role === 'SUPER_ADMIN') || (role === 'OPERATOR' && report.status === 'PENDING')) && (
                            <button
                              onClick={() => handleDelete(report.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Hapus Laporan"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.show}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
      />

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">Pratinjau Laporan (PDF)</h3>
                <p className="text-xs text-slate-400">Menampilkan dokumen PDF secara langsung dari server.</p>
              </div>
              <button
                onClick={() => setPreviewUrl('')}
                className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-4 bg-slate-100 rounded-b-3xl">
              <iframe
                src={previewUrl}
                title="Pratinjau Dokumen PDF"
                className="w-full h-full rounded-2xl border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🛡️ ROUTER & NAVIGASI UTAMA
// ==========================================
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // State Modal Autentikasi
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [modalRole, setModalRole] = useState('OPERATOR');

  // State Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setToast({ show: true, message, type });
    const id = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
    setToastTimeoutId(id);
  };

  const handleLoginSuccess = (newToken, role, shift) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
    if (shift) localStorage.setItem('shift', shift);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('shift');
    setToken(null);
  };

  const openLogin = (role = 'OPERATOR') => {
    setModalRole(role);
    setModalType('LOGIN');
    setModalOpen(true);
  };

  const openRegister = (role = 'OPERATOR') => {
    setModalRole(role);
    setModalType('REGISTER');
    setModalOpen(true);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !token ? (
              <>
                <LandingPage
                  onLoginClick={openLogin}
                  onRegisterClick={openRegister}
                />
                <LoginModal
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  onLoginSuccess={handleLoginSuccess}
                  initialRole={modalRole}
                  initialType={modalType}
                  showToast={showToast}
                />
              </>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard onLogout={handleLogout} showToast={showToast} /> : <Navigate to="/" />}
        />
      </Routes>

      {/* Render Toast Notification globally */}
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </Router>
  );
}