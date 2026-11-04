'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Building2,
  Clock,
  PhoneCall,
  Zap,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function MusyrifLoginPage() {
  const router = useRouter();
  const { login } = useStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Mohon masukkan nama panggilan (nickname) atau email Musyrif Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Mohon masukkan kata sandi akun Musyrif Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(cleanId, password, 'musyrif');

      if (result.success) {
        setSuccessMessage(result.message || 'Login berhasil! Mengalihkan ke panel musyrif...');
        setTimeout(() => {
          router.push('/musyrif');
        }, 500);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kendala saat menghubungkan ke server autentikasi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden py-10">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F1EB] via-[#E8F0EC] to-[#F4F1EB] dark:from-[#050C09] dark:via-[#081A13] dark:to-[#050C09]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[420px] h-[420px] rounded-full bg-[#D4A24C]/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-[#0D7B5F]/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md px-5 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#082F23] p-[2px] mx-auto shadow-xl shadow-emerald-900/20 transform group-hover:scale-105 transition-transform">
              <img
                src="/logo.jpg"
                alt="Logo PP Nurul Falah"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
          </Link>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A24C]/15 dark:bg-[#D4A24C]/20 text-amber-800 dark:text-[#F5D78E] text-xs font-bold border border-[#D4A24C]/30 mb-2">
              <Shield className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span>Portal Pembina &amp; Musyrif</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Masuk Akun Musyrif
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Panel Pengawasan &amp; Administrasi Santri
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white/90 dark:bg-[#0F1E18]/95 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-[#1C3A2E] shadow-2xl shadow-emerald-950/10 dark:shadow-black/40 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#D4A24C] via-[#E8C36E] to-[#0D7B5F]" />

          <div className="p-6 sm:p-7 space-y-5">
            {/* Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fade-up">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-up">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Nickname / Email Musyrif */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>Nama Panggilan (Nickname) / Email</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Cukup nama pendek</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Shield className="w-4 h-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: mansur, abdullah, fauzan, dll."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-[#162B22] border border-stone-200 dark:border-[#1C3A2E] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]/50 focus:border-[#D4A24C] text-xs font-medium text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  Gunakan nama panggilan musyrif (atau alamat email dinas).
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] font-semibold text-amber-700 dark:text-[#D4A24C] hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-stone-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi musyrif"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-stone-50 dark:bg-[#162B22] border border-stone-200 dark:border-[#1C3A2E] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]/50 focus:border-[#D4A24C] text-xs font-medium text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-500 dark:text-stone-400 select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-stone-300 text-[#0D7B5F] focus:ring-[#0D7B5F] w-4 h-4"
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#082F23] via-[#0D4433] to-[#082F23] hover:brightness-110 text-[#F5D78E] text-sm font-bold shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-[#D4A24C]/40 btn-press mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#D4A24C]/30 border-t-[#D4A24C] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Dashboard Musyrif</span>
                    <ArrowRight className="w-4 h-4 text-[#D4A24C]" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Santri Login */}
            <div className="pt-4 border-t border-stone-100 dark:border-[#1C3A2E] text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Santri pondok?{' '}
                <Link
                  href="/login/santri"
                  className="font-bold text-[#0D7B5F] dark:text-[#D4A24C] hover:underline inline-flex items-center gap-1"
                >
                  <GraduationCap className="w-3.5 h-3.5 inline" />
                  <span>Login sebagai Santri →</span>
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-stone-50 dark:bg-[#0A1A14] px-6 py-3 border-t border-stone-200/60 dark:border-[#1C3A2E] flex items-center justify-between gap-3 text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
              <span className="truncate">PP. Nurul Falah Surabaya</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="font-semibold text-amber-700 dark:text-[#D4A24C] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan Akun</span>
            </button>
          </div>
        </div>

        {/* Back Links */}
        <div className="flex items-center justify-between px-2 text-xs">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-stone-500 hover:text-[#0D7B5F] dark:hover:text-[#D4A24C] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Pilih Portal Lain</span>
          </Link>
          <Link
            href="/"
            className="font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            Halaman Utama
          </Link>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-sm w-full shadow-2xl border border-stone-200 dark:border-[#1C3A2E] overflow-hidden animate-fade-up">
            <div className="bg-gradient-to-r from-[#082F23] to-[#0D4433] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#D4A24C]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Bantuan Akun Musyrif</h3>
                  <p className="text-[10px] text-amber-200/70">Pondok Pesantren Nurul Falah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-stone-600 dark:text-stone-300">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1.5">
                <p className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#D4A24C]" />
                  Cara Login Praktis
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  Cukup ketik <strong className="text-stone-800 dark:text-stone-200">Nama Panggilan</strong> musyrif (contoh:{' '}
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    mansur
                  </span>
                  , <span className="font-bold text-amber-800 dark:text-amber-300">abdullah</span>, dll) serta kata sandi akun Anda, atau tetap bisa menggunakan alamat email dinas lengkap.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-[#1C3A2E] text-[11px] text-stone-500 dark:text-stone-400">
                <p className="font-semibold text-stone-700 dark:text-stone-200">
                  Kendala login atau reset kata sandi?
                </p>
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                  <span>Hubungi Administrator Sistem IT Pesantren</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                  <span>Gedung Kantor Pusat PP. Nurul Falah</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-[#0A1A14] p-4 border-t border-stone-200 dark:border-[#1C3A2E]">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-[#0D7B5F] hover:bg-[#096B52] text-white rounded-xl text-xs font-bold transition cursor-pointer btn-press"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

