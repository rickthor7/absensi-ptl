'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Shield,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Building2,
  Clock,
  PhoneCall,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();

  // Role portal toggle: 'santri' | 'musyrif'
  const [selectedRole, setSelectedRole] = useState<'santri' | 'musyrif'>('santri');

  // Real credentials form state (empty by default for real authentication)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Handle Real Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage(
        selectedRole === 'santri'
          ? 'Mohon masukkan Nomor Induk Santri (NIS) atau Email Anda.'
          : 'Mohon masukkan alamat Email Musyrif Anda.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Mohon masukkan kata sandi akun Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(cleanId, password, selectedRole);

      if (result.success) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          if (result.role === 'musyrif' || result.role === 'admin') {
            router.push('/musyrif');
          } else {
            router.push('/santri');
          }
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
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F1EB] via-[#E8F0EC] to-[#F4F1EB] dark:from-[#050C09] dark:via-[#081A13] dark:to-[#050C09]" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, #0D7B5F 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />
      
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#0D7B5F]/8 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-[#D4A24C]/6 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md px-5 py-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#082F23] p-[2px] mx-auto shadow-xl shadow-emerald-900/20 transform group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#051A13] flex items-center justify-center text-[#D4A24C] font-serif text-2xl font-bold">
                ن
              </div>
            </div>
          </Link>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0D7B5F]/8 dark:bg-[#0D7B5F]/15 text-[#0D7B5F] dark:text-[#D4A24C] text-[10px] font-bold border border-[#0D7B5F]/15 dark:border-[#0D7B5F]/25 mb-2">
              <Zap className="w-3 h-3" />
              <span>Presensi Terpadu</span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              Nurul Falah
            </h1>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Ketintang, Surabaya • Masuk ke Akun
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white/90 dark:bg-[#0F1E18]/95 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-[#1C3A2E] shadow-2xl shadow-emerald-950/5 dark:shadow-black/30 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-5">
            {/* Role Switcher */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Portal
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-stone-100 dark:bg-[#162B22] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('santri');
                    setErrorMessage(null);
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'santri'
                      ? 'bg-gradient-to-r from-[#082F23] to-[#0D7B5F] text-white shadow-md'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <GraduationCap className={`w-4 h-4 ${selectedRole === 'santri' ? 'text-[#D4A24C]' : ''}`} />
                  <span>Santri</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('musyrif');
                    setErrorMessage(null);
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'musyrif'
                      ? 'bg-gradient-to-r from-[#082F23] to-[#0D7B5F] text-white shadow-md'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Shield className={`w-4 h-4 ${selectedRole === 'musyrif' ? 'text-[#D4A24C]' : ''}`} />
                  <span>Musyrif</span>
                </button>
              </div>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2 animate-fade-up">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-start gap-2 animate-fade-up">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{successMessage}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Identifier */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
                  {selectedRole === 'santri' ? 'NIS atau Email' : 'Email Musyrif'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {selectedRole === 'santri' ? (
                      <GraduationCap className="w-4 h-4 text-stone-300" />
                    ) : (
                      <Mail className="w-4 h-4 text-stone-300" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === 'santri'
                        ? 'STR-2026-042 atau email'
                        : 'mansur@nurulfalah.ac.id'
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-[#162B22] border border-stone-200 dark:border-[#1C3A2E] focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]/50 focus:border-[#0D7B5F] text-xs font-medium text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[10px] font-semibold text-[#0D7B5F] dark:text-[#D4A24C] hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-stone-300" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-stone-50 dark:bg-[#162B22] border border-stone-200 dark:border-[#1C3A2E] focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]/50 focus:border-[#0D7B5F] text-xs font-medium text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-stone-500 dark:text-stone-400 select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-stone-300 text-[#0D7B5F] focus:ring-[#0D7B5F] w-3.5 h-3.5"
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#082F23] via-[#0D7B5F] to-[#096B52] hover:from-[#0A3D2D] hover:to-[#0D7B5F] text-white text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-[#D4A24C]/15"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Portal {selectedRole === 'santri' ? 'Santri' : 'Musyrif'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Credentials */}
              <div className="pt-3 border-t border-stone-100 dark:border-[#1C3A2E] space-y-2">
                <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wider">
                  Akun Demo:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('musyrif');
                      setIdentifier('mansur@nurulfalah.ac.id');
                      setPassword('password123');
                      setErrorMessage(null);
                    }}
                    className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#162B22] hover:bg-[#0D7B5F]/8 dark:hover:bg-[#0D7B5F]/15 border border-stone-200/60 dark:border-[#1C3A2E] transition cursor-pointer text-left btn-press"
                  >
                    <span className="block font-bold text-[10px] text-[#0D7B5F] dark:text-[#D4A24C]">
                      Ust. Mansur
                    </span>
                    <span className="block text-[9px] text-stone-400 font-mono truncate">
                      mansur@nurulfalah.ac.id
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('santri');
                      setIdentifier('STR-2026-042');
                      setPassword('password123');
                      setErrorMessage(null);
                    }}
                    className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#162B22] hover:bg-[#0D7B5F]/8 dark:hover:bg-[#0D7B5F]/15 border border-stone-200/60 dark:border-[#1C3A2E] transition cursor-pointer text-left btn-press"
                  >
                    <span className="block font-bold text-[10px] text-[#0D7B5F] dark:text-[#D4A24C]">
                      Ahmad Fauzi
                    </span>
                    <span className="block text-[9px] text-stone-400 font-mono truncate">
                      NIS: STR-2026-042
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Bar */}
          <div className="bg-stone-50 dark:bg-[#0A1A14] px-5 py-2.5 border-t border-stone-200/60 dark:border-[#1C3A2E] flex items-center justify-between gap-3 text-[10px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0D7B5F] shrink-0" />
              <span className="truncate">PP. Nurul Falah Surabaya</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-[10px] font-semibold text-[#0D7B5F] dark:text-[#D4A24C] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Bantuan</span>
            </button>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-[#0D7B5F] dark:hover:text-[#D4A24C] transition"
          >
            <span>← Halaman Beranda</span>
          </Link>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1E18] rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 dark:border-[#1C3A2E] overflow-hidden animate-fade-up">
            <div className="bg-gradient-to-r from-[#082F23] to-[#0D7B5F] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#D4A24C]" />
                <div>
                  <h3 className="font-bold text-sm">Bantuan Akses</h3>
                  <p className="text-[10px] text-emerald-200/60">Nurul Falah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-stone-600 dark:text-stone-300">
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                <p className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0D7B5F]" />
                  Santri
                </p>
                <p className="text-[10px] text-stone-500">
                  Gunakan NIS resmi (contoh: <span className="font-mono font-bold">STR-2026-042</span>) atau email santri.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1">
                <p className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  Musyrif
                </p>
                <p className="text-[10px] text-stone-500">
                  Gunakan email dinas (contoh: <span className="font-mono font-bold">mansur@nurulfalah.ac.id</span>).
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-[#1C3A2E] text-[10px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3 h-3 text-[#0D7B5F]" />
                  <span>Kantor Kesantrian: Gedung Pusat Lt. 1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#0D7B5F]" />
                  <span>08.00 – 16.30 WIB (Sabtu – Kamis)</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-[#0A1A14] p-3 border-t border-stone-200 dark:border-[#1C3A2E]">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2 bg-[#0D7B5F] hover:bg-[#096B52] text-white rounded-lg text-xs font-bold transition cursor-pointer btn-press"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
