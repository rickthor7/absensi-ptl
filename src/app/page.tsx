'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, getEstimatedHijriDate } from '@/lib/schedule';
import {
  Camera,
  Shield,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap,
  Fingerprint,
  Locate,
  Wallet,
  CreditCard,
  ChevronRight,
  BookOpen,
  Users,
  Star,
  MapPin,
} from 'lucide-react';

export default function HomePage() {
  const { currentUser, isAuthenticated, activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;

  const dashboardHref = isAuthenticated
    ? currentUser.role === 'musyrif' ? '/musyrif' : '/santri'
    : '/login';

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)]">
      <div className="max-w-lg mx-auto px-4 pb-10 pt-5 space-y-4 relative z-10">

        {/* ══ HERO CARD ══ */}
        <div className="relative overflow-hidden rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-2xl shadow-emerald-950/30">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A24C]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />

          <div className="relative z-10 p-5 sm:p-7">
            {/* Top chips row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#D4A24C]/90 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#D4A24C]/20">
                <Sparkles className="w-3 h-3" />
                <span>{getEstimatedHijriDate(effectiveTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Clock className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span className="text-sm font-bold font-mono tabular-nums">
                  {effectiveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[9px] text-white/40">WIB</span>
              </div>
            </div>

            {/* Logo + Pondok name */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D7B5F] to-[#D4A24C] p-[2px] shadow-xl shrink-0 overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Logo Nurul Falah"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#D4A24C]/80 uppercase tracking-widest mb-0.5">Sistem Presensi Digital</p>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Pondok Pesantren
                </h1>
                <h1
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ background: 'linear-gradient(135deg, #D4A24C, #F5D78E, #D4A24C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  Nurul Falah
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-white/50 mb-5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>Ketintang, Gayungan, Kota Surabaya, Jawa Timur</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-2.5">
              <Link
                href={isAuthenticated ? '/santri/absensi' : '/login'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-sm font-extrabold shadow-lg shadow-amber-900/25 hover:brightness-110 transition-all btn-press"
              >
                <Camera className="w-4 h-4" />
                <span>{isAuthenticated ? 'Mulai Absen' : 'Masuk'}</span>
              </Link>

              <Link
                href={dashboardHref}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/16 text-white text-sm font-bold border border-white/15 transition-all backdrop-blur-sm btn-press"
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
        </div>

        {/* ══ LIVE ACTIVITY STATUS ══ */}
        <div className={`rounded-2xl border overflow-hidden ${
          activeActivity
            ? 'bg-white dark:bg-[#0F1E18] border-emerald-400/40 shadow-sm shimmer-border'
            : 'bg-white dark:bg-[#0F1E18] border-stone-200 dark:border-[#1C3A2E] shadow-sm'
        }`}>
          <div className={`h-0.5 ${activeActivity ? 'bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]' : 'bg-stone-200 dark:bg-[#1C3A2E]'}`} />
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeActivity ? 'bg-emerald-500/10' : 'bg-stone-100 dark:bg-[#162B22]'
              }`}>
                <Clock className={`w-4.5 h-4.5 ${activeActivity ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status Kegiatan</span>
                  {activeActivity ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-stone-100 dark:bg-[#162B22] text-stone-400">TUTUP</span>
                  )}
                </div>
                {activeActivity ? (
                  <p className="font-extrabold text-sm text-stone-900 dark:text-stone-100">{activeActivity.name}</p>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {activeResult.nextActivity
                      ? `Berikutnya: ${activeResult.nextActivity.name} · ${activeResult.nextActivity.start_time}`
                      : 'Semua sesi hari ini selesai'}
                  </p>
                )}
              </div>
            </div>
            {activeActivity && (
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold font-mono text-stone-700 dark:text-stone-300">
                  {activeActivity.start_time}–{activeActivity.end_time}
                </p>
                <p className="text-[10px] text-stone-400">r {activeActivity.radius_m}m</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ FEATURE BADGES ══ */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Fingerprint, label: 'Selfie', sub: 'Anti-Titip', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Locate, label: 'GPS', sub: 'Geotag Real-Time', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Shield, label: 'Audit Trail', sub: 'Rekam Jejak', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
          ].map(({ icon: Icon, label, sub, color, bg }) => (
            <div key={label} className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm p-3.5 flex flex-col items-center gap-2 text-center card-hover">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-stone-900 dark:text-stone-100">{label}</p>
                <p className="text-[9px] text-stone-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ ROLE PORTAL CARDS ══ */}
        <div className="space-y-3">
          {/* Santri Card */}
          <div className="group bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm hover:border-emerald-400/50 card-hover overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]" />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 text-[#0D7B5F] dark:text-emerald-400 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#0D7B5F] dark:text-emerald-400 uppercase tracking-widest">Area Santri</span>
                    <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Portal Santri</h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">Mandiri</span>
              </div>

              <div className="space-y-1.5 mb-4">
                {[
                  'Presensi selfie + validasi koordinat GPS pondok',
                  'Pengajuan izin syar\'i dengan lampiran bukti',
                  'Kalender & riwayat kehadiran lengkap',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/santri"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#0D7B5F] to-[#0A6951] hover:brightness-110 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-900/20 btn-press group"
              >
                <span>Buka Dashboard Santri</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Musyrif Card */}
          <div className="group bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm hover:border-amber-400/50 card-hover overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#D4A24C] via-[#E8C36E] to-[#0D7B5F]" />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5 text-[#D4A24C] stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#D4A24C] uppercase tracking-widest">Area Pembina</span>
                    <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Portal Musyrif</h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">Pengawasan</span>
              </div>

              <div className="space-y-1.5 mb-4">
                {[
                  'Monitoring absensi real-time per sesi kegiatan',
                  'Persetujuan izin & verifikasi tinjauan presensi',
                  'Ekspor rekap skor bulanan ke Excel/CSV',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/musyrif"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#082F23] to-[#0D4433] hover:brightness-110 text-[#D4A24C] text-xs font-bold transition-all shadow-sm border border-[#D4A24C]/30 btn-press group"
              >
                <span>Buka Dashboard Musyrif</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* ══ TRANSPARANSI BANNER ══ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/50 via-emerald-900/30 to-[#D4A24C]/10 border border-[#0D7B5F]/25 p-4 sm:p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A24C]/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4A24C]/15 text-[#D4A24C] text-[10px] font-bold border border-[#D4A24C]/25 mb-3">
              <Sparkles className="w-3 h-3" />
              <span>Transparansi Publik</span>
            </div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mb-1">
              Laporan Keuangan Terbuka
            </h2>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
              Wali santri & donatur dapat melihat seluruh pemasukan SPP dan peruntukan dana operasional secara real-time.
            </p>
            <div className="flex gap-2.5">
              <Link
                href="/transparansi"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0D7B5F] hover:bg-[#0A6951] text-white text-[11px] font-bold transition btn-press shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Buka Laporan</span>
              </Link>
              <Link
                href={isAuthenticated ? '/santri/spp' : '/login'}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-[#152922] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-bold hover:border-[#D4A24C]/50 transition"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Portal SPP</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ══ STATS ROW ══ */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Users, value: '32+', label: 'Santri Aktif', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: BookOpen, value: '8', label: 'Kegiatan/Hari', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Star, value: '4', label: 'Tahun Berdiri', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm p-3.5 text-center card-hover">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div className="text-xl font-black text-stone-900 dark:text-stone-100">{value}</div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400 font-semibold mt-0.5 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* ══ FOOTER ══ */}
        <div className="flex items-center justify-center gap-2 py-3 text-[10px] text-stone-400">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>Jl. Ketintang Madya No. 81, Ketintang, Kec. Gayungan, Kota Surabaya 60232</span>
        </div>

      </div>
    </div>
  );
}
