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
} from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

export default function HomePage() {
  const { currentUser, activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3D2E] via-[#146B50] to-[#0B3D2E] text-white p-8 sm:p-12 shadow-2xl border border-[#D6A84F]/40 text-center sm:text-left">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#D6A84F] border border-[#D6A84F]/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Absensi Terpadu Santri Berbasis Geotag & Kamera</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Pondok Pesantren <br className="hidden sm:inline" />
            <span className="text-[#D6A84F]">Nurul Falah Ketintang</span>
            <span className="block text-2xl sm:text-3xl font-bold text-emerald-200 mt-1">Surabaya</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Validasi presensi kehadiran kegiatan santri melalui swafoto (selfie) kamera langsung dan verifikasi radius koordinat lokasi GPS secara akurat, tertib, dan transparan.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 justify-center sm:justify-start">
            <Link
              href="/santri/absensi"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D6A84F] hover:bg-[#c4953c] text-[#0B3D2E] text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Mulai Absen Sekarang</span>
            </Link>

            <Link
              href={currentUser.role === 'musyrif' ? '/musyrif' : '/santri'}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition cursor-pointer"
            >
              <span>Masuk ke Dashboard ({currentUser.role})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Active Activity Floating Indicator */}
        <div className="mt-8 sm:mt-0 sm:absolute sm:right-8 sm:top-8 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-left max-w-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
            <Clock className="w-4 h-4 text-[#D6A84F]" />
            <span>Status Kegiatan Saat Ini:</span>
          </div>
          {activeActivity ? (
            <div>
              <p className="font-extrabold text-sm text-white">{activeActivity.name}</p>
              <p className="text-xs text-stone-300 font-mono">
                {activeActivity.start_time} - {activeActivity.end_time} WIB
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-black">
                Sedang Dibuka (Radius {activeActivity.radius_m}m)
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-stone-300">Absensi kegiatan sedang ditutup.</p>
              {activeResult.nextActivity && (
                <p className="text-[11px] text-[#D6A84F] mt-1 font-semibold">
                  Jadwal berikutnya: {activeResult.nextActivity.name} ({activeResult.nextActivity.start_time} WIB)
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two Role Portals Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Santri Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg hover:border-[#146B50] transition flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#146B50] flex items-center justify-center font-bold">
              <Camera className="w-7 h-7 text-[#146B50]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Portal Santri
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Alur mandiri bagi santri untuk melakukan absensi kegiatan wajib harian.
              </p>
            </div>

            <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Absensi hadir validasi selfie wajah & GPS</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pengajuan izin sakit atau udzur syar’i</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kalender dan riwayat presensi harian santri</span>
              </li>
            </ul>
          </div>

          <Link
            href="/santri"
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md"
          >
            <span>Buka Dashboard Santri</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Musyrif Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg hover:border-[#0B3D2E] transition flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center font-bold">
              <Shield className="w-7 h-7 text-[#D6A84F]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Portal Musyrif & Pengasuhan
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Panel pengawasan, persetujuan perizinan, pengelolaan jadwal, dan audit log.
              </p>
            </div>

            <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Monitoring kehadiran langsung per kegiatan</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tinjauan dan persetujuan pengajuan izin santri</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Konfigurasi jam kegiatan, koordinat & radius meter</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Koreksi manual dengan audit trail & ekspor rekap CSV</span>
              </li>
            </ul>
          </div>

          <Link
            href="/musyrif"
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0B3D2E] hover:bg-[#07281E] text-white text-xs font-bold transition shadow-md border border-[#D6A84F]/40"
          >
            <span>Buka Dashboard Musyrif</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
