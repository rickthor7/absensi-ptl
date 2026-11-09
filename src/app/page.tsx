'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, getEstimatedHijriDate, formatTime24 } from '@/lib/schedule';
import {
  Camera,
  Shield,
  Clock,
  CheckCircle2,
  Fingerprint,
  Locate,
  BookOpen,
  Users,
  Star,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const { currentUser, isAuthenticated, activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;

  const dashboardHref = isAuthenticated
    ? currentUser.role === 'musyrif' ? '/musyrif' : '/santri'
    : '/login';

  return (
    <div className="min-h-[calc(100vh-8rem)] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ══ TOP SECTION: HERO + LIVE STATUS ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* HERO CARD (Col 7 on Desktop) */}
          <div className="lg:col-span-7 bg-[#06241B] dark:bg-[#05140F] text-white rounded-2xl border border-[#0D382A] dark:border-[#142921] p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              {/* Top row */}
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium text-emerald-200 border border-white/10">
                  <span>{getEstimatedHijriDate(effectiveTime)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono font-bold text-white border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#E0B45C]" />
                  <span>{formatTime24(effectiveTime)}</span>
                  <span className="text-[9px] text-emerald-300">WIB</span>
                </span>
              </div>

              {/* Brand Branding */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#0D7B5F] p-0.5 shadow-sm shrink-0 overflow-hidden border border-white/10">
                  <img
                    src="/logo.jpg"
                    alt="Logo Nurul Falah"
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-300/90 uppercase tracking-widest">
                    Portal Presensi &amp; Administrasi
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Pondok Pesantren Nurul Falah
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-300 mb-6">
                <MapPin className="w-4 h-4 shrink-0 text-[#E0B45C]" />
                <span>Jl. Ketintang Madya No. 81, Gayungan, Kota Surabaya, Jawa Timur</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <Link
                href={isAuthenticated ? '/santri/absensi' : '/login/santri'}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0D7B5F] hover:bg-[#0A664E] text-white text-xs font-bold transition shadow-sm btn-press"
              >
                <Camera className="w-4 h-4 text-emerald-200" />
                <span>{isAuthenticated ? 'Mulai Presensi Santri' : 'Masuk Portal Santri'}</span>
              </Link>

              <Link
                href={dashboardHref}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition btn-press"
              >
                <span>
                  {isAuthenticated
                    ? `Buka Dashboard ${currentUser.role === 'musyrif' ? 'Musyrif' : 'Santri'}`
                    : 'Masuk Portal Musyrif'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* LIVE ACTIVITY STATUS (Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
            <div className="clean-card p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0D7B5F]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Sesi Presensi
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeActivity
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {activeActivity ? 'Live Aktif' : 'Sesi Ditutup'}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
                  {activeActivity ? activeActivity.name : 'Jadwal Ditutup'}
                </h3>

                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  {activeActivity
                    ? `Sesi absensi kegiatan ${activeActivity.name} sedang dibuka. Pastikan berada dalam radius pondok.`
                    : activeResult.nextActivity
                    ? `Sesi berikutnya: ${activeResult.nextActivity.name} pukul ${activeResult.nextActivity.start_time} WIB.`
                    : 'Semua sesi absensi pondok hari ini telah berakhir.'}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 flex items-center justify-between text-xs">
                <span className="text-stone-500">
                  {activeActivity
                    ? `Pukul: ${activeActivity.start_time} – ${activeActivity.end_time} WIB`
                    : 'Menunggu sesi berikutnya'}
                </span>
                {activeActivity && (
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                    Radius {activeActivity.radius_m}m
                  </span>
                )}
              </div>
            </div>

            {/* Feature mini pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Fingerprint, label: 'Selfie Valid', sub: 'Anti-Titip Presensi' },
                { icon: Locate, label: 'Geotag GPS', sub: 'Radius Masjid' },
                { icon: Shield, label: 'Audit Log', sub: 'Transparan & Resmi' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="clean-card p-3 text-center flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#0D7B5F] dark:text-emerald-300 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold text-stone-900 dark:text-stone-100 leading-tight">{label}</p>
                  <p className="text-[9px] text-stone-400 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ══ ROLE PORTAL CARDS (2 Columns) ══ */}
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Portal Pengguna</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Pilih akses sesuai peran Anda di Pondok Pesantren Nurul Falah</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Santri Card */}
            <div className="clean-card clean-card-hover p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D7B5F] dark:text-emerald-300 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#0D7B5F] uppercase tracking-wider block">Area Santri</span>
                      <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Portal Santri</h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Mandiri
                  </span>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
                  Akses terpadu santri untuk presensi selfie &amp; koordinat GPS, mengajukan izin, kalender, dan upload SPP.
                </p>

                <div className="space-y-2 mb-6 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  {[
                    'Presensi selfie kamera + validasi radius GPS pondok',
                    'Pengajuan izin syar\'i berlampiran dokumen/foto',
                    'Kalender & rekap statistik kehadiran mandiri',
                    'Upload & konfirmasi bukti pembayaran SPP bulanan',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={isAuthenticated ? '/santri' : '/login/santri'}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0D7B5F] hover:bg-[#0A664E] text-white text-xs font-bold transition shadow-xs btn-press"
                >
                  <span>{isAuthenticated ? 'Buka Dashboard Santri' : 'Masuk Portal Santri'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Musyrif Card */}
            <div className="clean-card clean-card-hover p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Area Musyrif</span>
                      <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Portal Musyrif</h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Pengawasan
                  </span>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
                  Panel pengasuhan santri, verifikasi izin, setoran tahfidz, pencatatan SPP, dan audit presensi pondok.
                </p>

                <div className="space-y-2 mb-6 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  {[
                    'Monitoring presensi santri real-time tiap sesi kegiatan',
                    'Persetujuan izin syar\'i & verifikasi koreksi musyrif',
                    'Verifikasi upload bukti pembayaran SPP santri',
                    'Ekspor laporan mutabaah & raport santri (Excel, PDF)',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={isAuthenticated ? '/musyrif' : '/login/musyrif'}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-bold transition shadow-xs btn-press"
                >
                  <span>{isAuthenticated ? 'Buka Dashboard Musyrif' : 'Masuk Portal Musyrif'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATS HIGHLIGHT ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, value: '32+', label: 'Santri Aktif', desc: 'Binaan Pondok Pesantren' },
            { icon: BookOpen, value: '8', label: 'Kegiatan Harian', desc: 'Sesi Sholat & Mutabaah' },
            { icon: Star, value: '4+', label: 'Tahun Berkhidmat', desc: 'Ketintang, Surabaya' },
          ].map(({ icon: Icon, value, label, desc }) => (
            <div key={label} className="clean-card p-5 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D7B5F] dark:text-emerald-300 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{value}</div>
              <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mt-0.5">{label}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        {/* ══ FOOTER ══ */}
        <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0D7B5F] shrink-0" />
            <span>Jl. Ketintang Madya No. 81, Ketintang, Gayungan, Kota Surabaya 60232</span>
          </div>
          <p className="text-[11px] text-stone-400">
            © {effectiveTime.getFullYear()} Pondok Pesantren Nurul Falah Surabaya
          </p>
        </div>

      </div>
    </div>
  );
}
