'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import {
  Compass,
  CheckCircle2,
  Calendar,
  History,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Camera,
  Check,
  FileQuestion,
} from 'lucide-react';
import { STATUS_META } from '@/lib/constants';

export default function SantriHomePage() {
  const { currentUser, activities, attendanceRecords, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;
  const isWindowOpen = activeResult.status === 'open' && !!activeActivity;

  // Filter records for current student
  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);

  // Check if current student has already attended today's active activity
  const todayStr = effectiveTime.toISOString().split('T')[0];
  const todayAttendance = activeActivity
    ? studentRecords.find(
        (r) => r.activity_id === activeActivity.id && r.operational_date === todayStr
      )
    : null;

  // Monthly stats
  const currentMonthPrefix = `${effectiveTime.getFullYear()}-${String(
    effectiveTime.getMonth() + 1
  ).padStart(2, '0')}`;
  const monthRecords = studentRecords.filter((r) =>
    r.operational_date.startsWith(currentMonthPrefix)
  );

  const hadirCount = monthRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinCount = monthRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
  ).length;
  const reviewCount = monthRecords.filter((r) => r.status === 'perlu_tinjauan').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Islamic Greeting & Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3D2E] via-[#146B50] to-[#0B3D2E] text-white p-6 sm:p-8 shadow-xl border border-[#D6A84F]/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6A84F] mb-1">
              <Sparkles className="w-4 h-4 text-[#D6A84F]" />
              <span>{getEstimatedHijriDate(effectiveTime)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalamu’alaikum, {currentUser.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              {currentUser.student_number} • {currentUser.group_name} • Pondok Pesantren Nurul Falah Surabaya
            </p>
          </div>

          <div className="bg-black/25 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 text-left md:text-right">
            <span className="text-[11px] text-emerald-200 block">Waktu Operasional:</span>
            <span className="text-xl font-bold font-mono text-[#D6A84F]">
              {effectiveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
            <p className="text-[10px] text-stone-300">{formatIndonesianDate(effectiveTime)}</p>
          </div>
        </div>
      </div>

      {/* Main Focus: Current Active Activity Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                isWindowOpen
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Kegiatan Saat Ini
                </span>
                {isWindowOpen ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Sedang Dibuka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600">
                    Ditutup
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
                {activeActivity ? activeActivity.name : 'Tidak Ada Kegiatan Aktif'}
              </h2>
            </div>
          </div>

          {activeActivity && (
            <div className="text-left sm:text-right text-xs text-stone-500">
              <span className="block font-semibold text-stone-800 dark:text-stone-200">
                {activeActivity.start_time} - {activeActivity.end_time} WIB
              </span>
              <span className="text-[11px]">
                Radius: {activeActivity.radius_m}m • Toleransi: ±{activeActivity.max_gps_accuracy_m}m
              </span>
            </div>
          )}
        </div>

        {/* Action Button / Today Attendance Status */}
        <div className="pt-5">
          {todayAttendance ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                    Anda sudah melakukan absensi untuk kegiatan ini
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Status: <span className="font-semibold">{todayAttendance.status}</span> • Dikirim pukul {new Date(todayAttendance.submitted_at).toLocaleTimeString('id-ID')} WIB
                  </p>
                </div>
              </div>
              <Link
                href="/santri/riwayat"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition text-center"
              >
                Lihat Detail
              </Link>
            </div>
          ) : isWindowOpen ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Silakan ambil foto selfie di pondok dan aktifkan GPS untuk mengonfirmasi kehadiran.
              </p>
              <Link
                href="/santri/absensi"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white font-bold text-sm shadow-lg shadow-emerald-950/20 active:scale-95 transition border border-[#D6A84F]/40 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#D6A84F]" />
                <span>Mulai Absensi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-stone-500">
                {activeResult.nextActivity
                  ? `Kegiatan berikutnya: ${activeResult.nextActivity.name} (${activeResult.nextActivity.start_time} WIB)`
                  : 'Semua kegiatan terjadwal hari ini telah selesai.'}
              </p>
              <Link
                href="/santri/absensi"
                className="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition"
              >
                Buka Halaman Absensi
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#146B50] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Hadir Valid Bulan Ini</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {hadirCount}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-bold">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Pengajuan Izin</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {izinCount}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Perlu Tinjauan</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {reviewCount}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Links & Recent History Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Attendance List */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <History className="w-4 h-4 text-[#146B50]" />
              Riwayat Absensi Terkini
            </h3>
            <Link
              href="/santri/riwayat"
              className="text-xs text-[#146B50] font-bold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {studentRecords.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              Belum ada riwayat absensi.
            </p>
          ) : (
            <div className="space-y-2">
              {studentRecords.slice(0, 4).map((rec) => {
                const meta = STATUS_META[rec.status];
                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-emerald-200 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-stone-800 dark:text-stone-200">
                        {rec.activity_name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {rec.operational_date} • {new Date(rec.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar Card Preview */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D6A84F]" />
                Kalender Absensi Santri
              </h3>
              <Link
                href="/santri/kalender"
                className="text-xs text-[#146B50] font-bold hover:underline"
              >
                Buka Kalender
              </Link>
            </div>
            <p className="text-xs text-stone-500 mt-3">
              Pantau rekap kehadiran harian Anda, izin, dan catatan audit musyrif dengan tampilan kalender interaktif bulanan.
            </p>
          </div>

          <Link
            href="/santri/kalender"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#146B50] dark:hover:text-[#D6A84F] text-stone-700 dark:text-stone-300 text-xs font-bold transition border border-stone-200 dark:border-stone-700"
          >
            <Calendar className="w-4 h-4 text-[#146B50] dark:text-[#D6A84F]" />
            <span>Buka Kalender Bulanan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
