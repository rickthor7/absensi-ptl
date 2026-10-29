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
      <div className="max-w-lg lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4 sm:pt-6 space-y-5 sm:space-y-6 relative z-10">

        {/* ══ TOP SECTION: HERO + LIVE STATUS (Desktop 2-Col Grid) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          
          {/* HERO CARD (Col 7 on Desktop) */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-2xl shadow-emerald-950/30 flex flex-col justify-between p-5 sm:p-7 lg:p-8">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A24C]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            />

            <div className="relative z-10">
              {/* Top chips row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-[#D4A24C]/90 bg-black/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full border border-[#D4A24C]/20">
                  <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
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
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0D7B5F] to-[#D4A24C] p-[2px] shadow-xl shrink-0 overflow-hidden">
                  <img
                    src="/logo.jpg"
                    alt="Logo Nurul Falah"
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-[#D4A24C]/80 uppercase tracking-widest mb-0.5">Sistem Presensi & Keuangan Digital</p>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                    Pondok Pesantren
                  </h1>
                  <h1
                    className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight"
                    style={{ background: 'linear-gradient(135deg, #D4A24C, #F5D78E, #D4A24C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  >
                    Nurul Falah
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/60 mb-6">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D4A24C]" />
                <span>Jl. Ketintang Madya No. 81, Ketintang, Gayungan, Kota Surabaya, Jawa Timur</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <Link
                href={isAuthenticated ? '/santri/absensi' : '/login'}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-sm font-extrabold shadow-lg shadow-amber-900/25 hover:brightness-110 transition-all btn-press"
              >
                <Camera className="w-4 h-4" />
                <span>{isAuthenticated ? 'Mulai Absensi Santri' : 'Masuk ke Portal'}</span>
              </Link>

              <Link
                href={dashboardHref}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold border border-white/15 transition-all backdrop-blur-sm btn-press"
              >
                <span>
                  {isAuthenticated
                    ? `Dashboard ${currentUser.role === 'musyrif' ? 'Musyrif' : 'Santri'}`
                    : 'Pilih Portal Akun'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* LIVE ACTIVITY STATUS + QUICK HIGHLIGHTS (Col 5 on Desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
            {/* Live Activity Box */}
            <div className={`rounded-3xl border overflow-hidden transition-all duration-300 flex-1 flex flex-col justify-between ${
              activeActivity
                ? 'bg-white dark:bg-[#0F1E18] border-emerald-400/40 shadow-lg shadow-emerald-950/5 shimmer-border'
                : 'bg-white dark:bg-[#0F1E18] border-stone-200 dark:border-[#1C3A2E] shadow-sm'
            }`}>
              <div className={`h-1 ${activeActivity ? 'bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]' : 'bg-stone-200 dark:bg-[#1C3A2E]'}`} />
              
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activeActivity ? 'bg-emerald-500/10' : 'bg-stone-100 dark:bg-[#162B22]'
                      }`}>
                        <Clock className={`w-5 h-5 ${activeActivity ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Sesi Presensi</span>
                        <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight">
                          {activeActivity ? activeActivity.name : 'Jadwal Ditutup'}
                        </h3>
                      </div>
                    </div>

                    {activeActivity ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-[#162B22] text-stone-400 shrink-0">
                        TUTUP
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                    {activeActivity
                      ? `Sesi absensi kegiatan ${activeActivity.name} sedang dibuka. Pastikan berada dalam radius pondok.`
                      : activeResult.nextActivity
                      ? `Sesi berikutnya: ${activeResult.nextActivity.name} pukul ${activeResult.nextActivity.start_time} WIB.`
                      : 'Semua sesi absensi pondok hari ini telah berakhir.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-[#1C3A2E] flex items-center justify-between text-xs font-mono">
                  <div className="text-stone-500 dark:text-stone-400">
                    {activeActivity ? (
                      <span>Jam: <strong className="text-stone-800 dark:text-stone-200">{activeActivity.start_time} – {activeActivity.end_time}</strong></span>
                    ) : (
                      <span>Status: <strong className="text-stone-700 dark:text-stone-300">Menunggu sesi</strong></span>
                    )}
                  </div>
                  {activeActivity && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#162B22] text-[11px] text-stone-600 dark:text-stone-300 font-bold">
                      Radius {activeActivity.radius_m}m
                    </span>
                  )}
                </div>
              </div>

              {/* Action footer inside live box */}
              <div className="p-3.5 bg-stone-50 dark:bg-[#0A1612] border-t border-stone-100 dark:border-[#1C3A2E]">
                <Link
                  href={isAuthenticated ? '/santri/absensi' : '/login'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0D7B5F] hover:bg-[#0A6951] text-white text-xs font-bold transition-all shadow-sm btn-press"
                >
                  <Camera className="w-4 h-4 text-[#D4A24C]" />
                  <span>{isAuthenticated ? 'Buka Kamera Absensi' : 'Masuk untuk Presensi'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Feature Badges mini strip on desktop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: Fingerprint, label: 'Selfie Valid', sub: 'Anti-Titip', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: Locate, label: 'GPS Geotag', sub: 'Akurasi Tinggi', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                { icon: Shield, label: 'Audit Trail', sub: 'Tervalidasi', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
              ].map(({ icon: Icon, label, sub, color, bg }) => (
                <div key={label} className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] p-2.5 sm:p-3 text-center flex flex-col items-center gap-1 shadow-sm card-hover">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-0.5`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-[11px] font-extrabold text-stone-900 dark:text-stone-100 leading-tight">{label}</p>
                  <p className="text-[9px] text-stone-400 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ROLE PORTAL CARDS (2 Columns on Desktop) ══ */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">Portal Pengguna</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">Pilih akses sesuai peran Anda di Pondok Pesantren Nurul Falah</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Santri Card */}
            <div className="group bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm hover:border-emerald-400/50 card-hover overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-1 bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6 text-[#0D7B5F] dark:text-emerald-400 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#0D7B5F] dark:text-emerald-400 uppercase tracking-widest">Area Santri</span>
                        <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">Portal Santri</h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">Mandiri</span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
                    Akses terpadu untuk santri dalam melakukan presensi sholat & taklim, memantau riwayat, serta administrasi SPP.
                  </p>

                  <div className="space-y-2 mb-6 bg-stone-50/70 dark:bg-[#14261F] p-3.5 rounded-2xl border border-stone-100 dark:border-[#1C3A2E]">
                    {[
                      'Presensi selfie kamera + validasi radius GPS pondok',
                      'Pengajuan izin syar\'i multi-kegiatan berlampiran',
                      'Kalender & rekap statistik kehadiran mandiri',
                      'Pembayaran & konfirmasi bukti transfer SPP bulanan',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 pt-0">
                <Link
                  href="/santri"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0D7B5F] to-[#0A6951] hover:brightness-110 text-white text-sm font-bold transition-all shadow-md shadow-emerald-900/20 btn-press group"
                >
                  <span>Buka Dashboard Santri</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Musyrif Card */}
            <div className="group bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm hover:border-amber-400/50 card-hover overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-1 bg-gradient-to-r from-[#D4A24C] via-[#E8C36E] to-[#0D7B5F]" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Shield className="w-6 h-6 text-[#D4A24C] stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#D4A24C] uppercase tracking-widest">Area Pembina & Musyrif</span>
                        <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">Portal Musyrif</h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">Pengawasan</span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
                    Panel kendali manajemen santri, validasi perizinan, verifikasi pembayaran SPP, dan audit presensi pondok.
                  </p>

                  <div className="space-y-2 mb-6 bg-stone-50/70 dark:bg-[#14261F] p-3.5 rounded-2xl border border-stone-100 dark:border-[#1C3A2E]">
                    {[
                      'Monitoring absensi santri real-time tiap sesi kegiatan',
                      'Persetujuan izin syar\'i & verifikasi koreksi musyrif',
                      'Verifikasi pembayaran SPP & pembukuan kas pondok',
                      'Ekspor laporan & raport santri (Excel, CSV, PDF)',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 pt-0">
                <Link
                  href="/musyrif"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#082F23] to-[#0D4433] hover:brightness-110 text-[#D4A24C] text-sm font-bold transition-all shadow-md border border-[#D4A24C]/30 btn-press group"
                >
                  <span>Buka Dashboard Musyrif</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══ TRANSPARANSI BANNER & STATS (Responsive Layout) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          
          {/* Transparansi Card (Col 7 on Desktop) */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-[#D4A24C]/15 border border-[#0D7B5F]/30 p-5 sm:p-7 flex flex-col justify-between shadow-sm">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4A24C]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A24C]/15 text-[#D4A24C] text-[10px] font-bold border border-[#D4A24C]/25 mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Transparansi Publik & Akuntabilitas</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 mb-2">
                Laporan Keuangan & Kas Terbuka
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
                Wali santri, donatur, dan masyarakat luas dapat meninjau seluruh arus kas masuk dari SPP santri serta rincian penggunaan operasional pondok secara real-time dan terbuka.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/transparansi"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0D7B5F] hover:bg-[#0A6951] text-white text-xs font-bold transition btn-press shadow-md"
              >
                <Wallet className="w-4 h-4 text-[#D4A24C]" />
                <span>Buka Laporan Transparansi</span>
              </Link>
              <Link
                href={isAuthenticated ? '/santri/spp' : '/login'}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white dark:bg-[#152922] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:border-[#D4A24C]/50 transition"
              >
                <CreditCard className="w-4 h-4 text-[#D4A24C]" />
                <span>Portal SPP Santri</span>
              </Link>
            </div>
          </div>

          {/* Stats Badges (Col 5 on Desktop) */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3 sm:gap-4 items-stretch">
            {[
              { icon: Users, value: '32+', label: 'Santri Aktif', desc: 'Terdaftar aktif', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
              { icon: BookOpen, value: '8', label: 'Kegiatan/Hari', desc: 'Sholat & taklim', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
              { icon: Star, value: '4+', label: 'Tahun Khidmah', desc: 'Nurul Falah', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
            ].map(({ icon: Icon, value, label, desc, color, bg }) => (
              <div key={label} className="bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm p-4 sm:p-5 text-center flex flex-col items-center justify-center card-hover">
                <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-2xl ${bg} flex items-center justify-center mb-2.5`}>
                  <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${color}`} />
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">{value}</div>
                <div className="text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold uppercase tracking-wide mt-1">{label}</div>
                <div className="text-[9px] text-stone-400 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-[#1C3A2E]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D4A24C] shrink-0" />
            <span>Jl. Ketintang Madya No. 81, Ketintang, Kec. Gayungan, Kota Surabaya 60232</span>
          </div>
          <p className="text-[11px] text-stone-400">
            © {effectiveTime.getFullYear()} Pondok Pesantren Nurul Falah Surabaya
          </p>
        </div>

      </div>
    </div>
  );
}
