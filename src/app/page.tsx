'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import {
  Compass,
  Camera,
  Shield,
  Calendar,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  BarChart3,
  Zap,
  Fingerprint,
  Locate,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

export default function HomePage() {
  const { currentUser, isAuthenticated, activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 relative z-10">

        {/* ── Hero Section ── */}
        <div className="relative overflow-hidden rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-2xl shadow-emerald-950/30">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4A24C]/8 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#0D7B5F]/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4 pointer-events-none" />
          
          {/* Islamic dot pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
              {/* Left Content */}
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D7B5F] to-[#D4A24C] p-[2px] shadow-xl overflow-hidden shrink-0">
                    <img
                      src="/logo.jpg"
                      alt="Logo Pondok Pesantren Nurul Falah"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 text-[11px] font-semibold text-[#D4A24C] border border-[#D4A24C]/20 backdrop-blur-sm">
                    <Zap className="w-3 h-3" />
                    <span>Presensi GPS & SPP Terpadu</span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
                  Pondok Pesantren<br />
                  <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #D4A24C, #F0D78C, #D4A24C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Nurul Falah
                  </span>
                  <span className="block text-xl sm:text-2xl font-bold text-emerald-200/60 mt-1">
                    Ketintang, Surabaya
                  </span>
                </h1>

                <p className="text-sm text-emerald-100/70 leading-relaxed max-w-lg">
                  Sistem kehadiran santri terintegrasi — validasi melalui swafoto kamera dan koordinat GPS real-time secara presisi.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href={isAuthenticated ? "/santri/absensi" : "/login"}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-sm font-bold shadow-lg shadow-amber-900/25 hover:shadow-xl transition-all btn-press"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isAuthenticated ? "Mulai Absen" : "Masuk"}</span>
                  </Link>

                  <Link
                    href={
                      isAuthenticated
                        ? currentUser.role === 'musyrif'
                          ? '/musyrif'
                          : '/santri'
                        : '/login'
                    }
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/8 hover:bg-white/14 text-white text-sm font-semibold border border-white/15 transition-all backdrop-blur-sm btn-press"
                  >
                    <span>
                      {isAuthenticated
                        ? `Dashboard ${currentUser.role === 'musyrif' ? 'Musyrif' : 'Santri'}`
                        : 'Portal Akun'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: Live Activity Card */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 w-full lg:w-80 shrink-0 bg-black/20 border border-white/10 float-anim">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A24C] mb-3">
                  <div className="relative">
                    <Clock className="w-4 h-4" />
                    {activeActivity && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full dot-pulse" />}
                  </div>
                  <span>Status Kegiatan</span>
                </div>
                {activeActivity ? (
                  <div className="space-y-2">
                    <p className="font-extrabold text-base text-white">{activeActivity.name}</p>
                    <p className="text-xs text-stone-300 font-mono">
                      {activeActivity.start_time} – {activeActivity.end_time} WIB
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
                        Dibuka
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Radius {activeActivity.radius_m}m
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-stone-400">Absensi sedang ditutup</p>
                    {activeResult.nextActivity && (
                      <p className="text-[11px] text-[#D4A24C]/80 mt-2 font-medium">
                        Berikutnya: {activeResult.nextActivity.name} ({activeResult.nextActivity.start_time})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature Highlights ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {[
            {
              icon: Fingerprint,
              label: 'Selfie Validasi',
              desc: 'Bukti foto wajah santri langsung dari kamera',
              badge: 'Anti-Titip',
              gradient: 'from-emerald-500/12 via-emerald-500/6 to-transparent',
              iconBg: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
              borderHover: 'hover:border-emerald-500/40',
            },
            {
              icon: Locate,
              label: 'GPS Presisi',
              desc: 'Radius radius geolokasi pondok akurat',
              badge: 'Geotag Real-Time',
              gradient: 'from-blue-500/12 via-blue-500/6 to-transparent',
              iconBg: 'bg-blue-600/15 text-blue-700 dark:text-blue-300',
              borderHover: 'hover:border-blue-500/40',
            },
            {
              icon: Shield,
              label: 'Audit Trail',
              desc: 'Rekam jejak kehadiran lengkap & transparan',
              badge: 'Tinjauan Musyrif',
              gradient: 'from-amber-500/12 via-amber-500/6 to-transparent',
              iconBg: 'bg-amber-600/15 text-amber-700 dark:text-amber-300',
              borderHover: 'hover:border-amber-500/40',
            },
          ].map((f, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${f.gradient} bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm card-hover transition-all ${f.borderHover}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center shadow-xs`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200/50 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                  {f.badge}
                </span>
              </div>
              <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{f.label}</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Transparansi Kas & Pengeluaran Terbuka Showcase ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#D4A24C]/10 border border-[#0D7B5F]/30 p-6 sm:p-8 backdrop-blur-sm shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A24C]/15 text-[#D4A24C] text-[11px] font-bold border border-[#D4A24C]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparansi Publik & Akuntabilitas Pondok</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Pencatatan Keuangan & Alokasi Dana Terbuka
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Masyarakat, wali santri, dan donatur dapat melihat laporan real-time seluruh pemasukan iuran SPP serta peruntukan dana operasional dapur santri, listrik, air, dan perawatan asrama secara terbuka.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/transparansi"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0D7B5F] to-[#0A6951] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all btn-press"
            >
              <Wallet className="w-4 h-4" />
              <span>Buka Laporan Transparansi</span>
            </Link>

            <Link
              href={isAuthenticated ? "/santri/spp" : "/login"}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-[#152922] border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold hover:border-[#0D7B5F] transition-all"
            >
              <CreditCard className="w-4 h-4 text-[#D4A24C]" />
              <span>Portal SPP Santri</span>
            </Link>
          </div>
        </div>

        {/* ── Two Role Portal Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Santri Card */}
          <div className="group bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-md card-hover flex flex-col justify-between overflow-hidden relative">
            {/* Top decorative gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]" />
            
            <div className="p-6 sm:p-8 space-y-5 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[#0D7B5F] dark:text-[#1AA37A] flex items-center justify-center shadow-inner border border-emerald-500/20">
                    <Camera className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#0D7B5F] dark:text-emerald-400 uppercase tracking-wider">Area Santri</span>
                    <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">Portal Santri</h2>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Mandiri
                </span>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Akses cepat untuk melakukan presensi harian berbasis swafoto dan GPS, mengecek kalender rekap kehadiran, serta mengajukan izin syar&apos;i.
              </p>

              <div className="space-y-2.5 pt-1">
                {[
                  'Presensi kamera selfie dan validasi koordinat GPS pondok',
                  'Pengajuan izin syar\'i (sakit/pulang) dengan bukti lampiran',
                  'Kalender visual dan riwayat log presensi santri lengkap',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-2">
              <Link
                href="/santri"
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0D7B5F] to-[#0A6951] hover:from-[#096B52] hover:to-[#075340] text-white text-sm font-bold transition-all shadow-md shadow-emerald-900/20 btn-press group-hover:shadow-xl w-full"
              >
                <span>Buka Dashboard Santri</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Musyrif Card */}
          <div className="group bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-md card-hover flex flex-col justify-between overflow-hidden relative">
            {/* Top decorative gradient bar — gold focus */}
            <div className="h-1.5 bg-gradient-to-r from-[#D4A24C] via-[#E8C36E] to-[#0D7B5F]" />
            
            <div className="p-6 sm:p-8 space-y-5 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-[#D4A24C] dark:text-[#E8C36E] flex items-center justify-center shadow-inner border border-amber-500/20">
                    <Shield className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#D4A24C] uppercase tracking-wider">Area Pembina</span>
                    <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">Portal Musyrif</h2>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Pengawasan
                </span>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Panel kendali musyrif untuk memantau kehadiran langsung, menyetujui izin, mengkalibrasi titik geotag GPS, serta mengunduh rekap evaluasi bulanan.
              </p>

              <div className="space-y-2.5 pt-1">
                {[
                  'Monitoring absensi real-time per sesi jadwal kegiatan',
                  'Persetujuan izin santri dan verifikasi tinjauan presensi',
                  'Kalibrasi geotag koordinat GPS & radius pondok terkini',
                  'Ekspor rekap skor bulanan & evaluasi santri ke Excel/CSV',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-2">
              <Link
                href="/musyrif"
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#082F23] to-[#0D4433] hover:from-[#051A13] hover:to-[#082F23] text-[#D4A24C] hover:text-[#E8C36E] text-sm font-bold transition-all shadow-md shadow-emerald-950/20 border border-[#D4A24C]/30 btn-press group-hover:shadow-xl w-full"
              >
                <span>Buka Dashboard Musyrif</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
