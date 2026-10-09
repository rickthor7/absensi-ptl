'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import PermissionReviewModal from '@/components/attendance/PermissionReviewModal';
import CorrectionModal from '@/components/attendance/CorrectionModal';
import { AttendanceRecord } from '@/types';
import { calculateMonthlyScores } from '@/lib/scoring';
import {
  Compass,
  CheckCircle2,
  FileQuestion,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Sparkles,
  Calendar,
  Download,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  FileSpreadsheet,
} from 'lucide-react';

export default function MusyrifDashboardPage() {
  const {
    currentUser,
    attendanceRecords,
    activities,
    profiles,
    effectiveTime,
    reviewPermission,
    correctAttendance,
  } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<AttendanceRecord | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecord | null>(null);

  const todayStr = effectiveTime.toISOString().split('T')[0];
  const santriList = profiles.filter((p) => p.role === 'santri' && p.is_active);

  // Active activity evaluation
  const activeResult = determineActiveActivity(activities, effectiveTime);

  // Today's attendance stats
  const todayRecords = attendanceRecords.filter((r) => r.operational_date === todayStr);
  const hadirValidToday = todayRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinMenungguToday = attendanceRecords.filter((r) => r.status === 'izin_diajukan').length;
  const masalahToday = attendanceRecords.filter(
    (r) => r.status === 'perlu_tinjauan' || r.status === 'ditolak_lokasi'
  ).length;

  // Santri count who haven't attended the currently active activity
  const activeActivity = activeResult.activeActivity;
  const attendedActiveActivityCount = activeActivity
    ? todayRecords.filter((r) => r.activity_id === activeActivity.id).length
    : 0;
  const belumAbsenCount = activeActivity
    ? Math.max(0, santriList.length - attendedActiveActivityCount)
    : 0;

  // "Perlu Tindakan" list: Izin diajukan & Absensi perlu tinjauan
  const pendingActions = attendanceRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'perlu_tinjauan'
  );

  // Perhitungan Rekap Bulanan Terpadu (Hadir=1, Izin=0.5, Alpa=0)
  const currentMonthKey = effectiveTime.toISOString().substring(0, 7);
  const monthlyStats = calculateMonthlyScores(
    profiles,
    activities,
    attendanceRecords,
    currentMonthKey
  );

  // Fungsi Ekspor Bulanan Santri Langsung dari Dashboard
  const exportMonthlyCSV = () => {
    const headers = [
      'NIS',
      'Nama Santri',
      'Kamar Asrama',
      'Hadir (Poin 1)',
      'Izin (Poin 0.5)',
      'Alpa / Ditolak (Poin 0)',
      'Total Sesi Terjadwal',
      'Total Skor Poin',
      'Persentase Skor (%)',
      'Status Kelulusan Presensi',
      ...activities.map((a) => `Kehadiran ${a.name} (%)`),
    ];

    const rows = monthlyStats.studentScores.map((s) => {
      const actPercentages = activities.map((a) => {
        const sc = s.activityScores[a.id];
        return sc ? `${sc.percentage}%` : '100%';
      });

      return [
        `"${s.student.student_number || ''}"`,
        `"${s.student.full_name}"`,
        `"${s.student.group_name || ''}"`,
        s.hadirCount,
        s.izinCount,
        s.alpaCount,
        s.totalSessions,
        s.totalScore,
        `${s.scorePercentage}%`,
        s.isWarning ? 'PERINGATAN (< 70%)' : 'AMAN (>= 70%)',
        ...actPercentages,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rekap-bulanan-santri-nurul-falah-${currentMonthKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B3D2E] via-[#146B50] to-[#0B3D2E] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#D6A84F]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6A84F] mb-1">
            <Sparkles className="w-4 h-4 text-[#D6A84F]" />
            <span>Dashboard Musyrif • {getEstimatedHijriDate(effectiveTime)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ahlan wa Sahlan, {currentUser.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            {currentUser.group_name} • Pengawasan Absensi Santri Real-time
          </p>
        </div>

        <div className="bg-black/25 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 text-left md:text-right">
          <span className="text-[11px] text-emerald-200 block">Jam Operasional:</span>
          <span className="text-xl font-bold font-mono text-[#D6A84F]">
            {effectiveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </span>
          <p className="text-[10px] text-stone-300">{formatIndonesianDate(effectiveTime)}</p>
        </div>
      </div>

      {/* 4 Metric Cards as per design.md Section 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Hadir Valid Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#146B50] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 mt-2">
            {hadirValidToday}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Presensi terverifikasi radius</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Izin Menunggu Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">
            {izinMenungguToday}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Membutuhkan persetujuan</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Belum Melakukan Absen</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 mt-2">
            {belumAbsenCount}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Dari {santriList.length} total santri aktif
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Kegiatan Berlangsung</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100 mt-2 truncate">
            {activeActivity ? activeActivity.name : 'Sedang Ditutup'}
          </div>
          <p className="text-[11px] text-[#146B50] font-semibold mt-1">
            {activeActivity ? `${activeActivity.start_time} - ${activeActivity.end_time} WIB` : 'Jadwal berikutnya nanti'}
          </p>
        </div>
      </div>

      {/* BANNER PERINGATAN REAL-TIME: Santri Di Bawah 70% */}
      {monthlyStats.warningCount > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 shadow-md animate-in fade-in space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider animate-pulse">
                    Peringatan Real-Time
                  </span>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    Bulan {monthlyStats.monthLabel}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-rose-950 dark:text-rose-100 mt-0.5">
                  Perhatian: {monthlyStats.warningCount} Santri Berada di Bawah Batas Kelulusan Presensi (&lt; 70%)
                </h3>
              </div>
            </div>

            <Link
              href="/musyrif/laporan"
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Buka Rekap Bulanan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {monthlyStats.warningStudents.map((ws) => (
              <div
                key={ws.student.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-900/70 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <p className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>{ws.student.full_name}</span>
                    <span className="text-[10px] font-mono text-stone-400">({ws.student.student_number})</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {ws.student.group_name} • Hadir: {ws.hadirCount}x, Izin: {ws.izinCount}x, Alpa: {ws.alpaCount}x
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {ws.scorePercentage}%
                  </span>
                  <span className="block text-[10px] text-rose-600 font-bold mt-0.5">
                    Skor: {ws.totalScore}/{ws.totalSessions}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAFIK GLOBAL KEHADIRAN PONDOK & EKSPOR BULANAN */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#146B50] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#D6A84F]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Grafik Rekap Kehadiran Global Santri</span>
                <span className="text-[11px] font-normal text-stone-400">({monthlyStats.monthLabel})</span>
              </h2>
              <p className="text-[11px] text-stone-500">
                Aturan Penilaian: Hadir = 1 pt • Izin = 0.5 pt • Alpa = 0 pt • Standar Minimal: 70%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportMonthlyCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-sm cursor-pointer border border-[#D6A84F]/40"
              title="Unduh rekap bulanan santri dalam format CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D6A84F]" />
              <span>Ekspor Bulanan (CSV)</span>
            </button>
            <Link
              href="/musyrif/laporan"
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition"
            >
              Analisis Lengkap
            </Link>
          </div>
        </div>

        {/* Global Summary Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div>
            <span className="text-stone-400 text-[11px] block">Rata-rata Skor Pondok</span>
            <span className="text-xl font-extrabold text-[#146B50] dark:text-[#D6A84F]">
              {monthlyStats.averageScorePercentage}%
            </span>
          </div>
          <div>
            <span className="text-stone-400 text-[11px] block">Sangat Baik (≥ 85%)</span>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {monthlyStats.tierSangatBaikCount} Santri
            </span>
          </div>
          <div>
            <span className="text-stone-400 text-[11px] block">Cukup (70% - 84%)</span>
            <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400">
              {monthlyStats.tierCukupCount} Santri
            </span>
          </div>
          <div>
            <span className="text-stone-400 text-[11px] block">Peringatan (&lt; 70%)</span>
            <span className={`text-xl font-extrabold ${monthlyStats.tierPeringatanCount > 0 ? 'text-rose-600' : 'text-stone-400'}`}>
              {monthlyStats.tierPeringatanCount} Santri
            </span>
          </div>
        </div>

        {/* Visual Bar Chart per Activity */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
            Persentase Skor Kehadiran Berdasarkan Kegiatan Pondok:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monthlyStats.activityStats.map((act) => {
              const isLow = act.rate < 70;
              return (
                <div
                  key={act.activityId}
                  className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>{act.activityName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-700 text-stone-500">
                        {act.activityCode}
                      </span>
                    </span>
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                        isLow
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : act.rate >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {act.rate}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow
                          ? 'bg-rose-500'
                          : act.rate >= 85
                          ? 'bg-[#146B50]'
                          : 'bg-[#D6A84F]'
                      }`}
                      style={{ width: `${Math.min(100, act.rate)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Hadir: {act.hadirCount}x (x1) • Izin: {act.izinCount}x (x0.5) • Alpa: {act.alpaCount}x</span>
                    <span>Total Sesi: {act.totalSessions}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel "Perlu Tindakan" (Pending Permission & Review Issues) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Panel Perlu Tindakan ({pendingActions.length})
            </h2>
          </div>
          <Link
            href="/musyrif/perizinan"
            className="text-xs text-[#146B50] font-bold hover:underline flex items-center gap-1"
          >
            <span>Buka Semua Perizinan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingActions.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            Alhamdulillah, tidak ada pengajuan izin atau absensi yang memerlukan tindakan musyrif.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingActions.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.photo_path}
                        alt="Bukti"
                        className="w-12 h-12 rounded-xl object-cover border border-stone-300"
                      />
                      <div>
                        <h3 className="font-bold text-stone-900 dark:text-stone-100">
                          {item.student_name}
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          {item.group_name} • {item.activity_name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {item.permission_reason && (
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 italic">
                      &quot;{item.permission_reason}&quot;
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    {item.status === 'izin_diajukan' ? (
                      <button
                        onClick={() => setReviewRecord(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Tinjau Permohonan
                      </button>
                    ) : (
                      <button
                        onClick={() => setCorrectRecord(item)}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Koreksi Status
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Attendance Stream & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Latest Attendance */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Absensi Santri Terkini
            </h2>
            <Link
              href="/musyrif/absensi"
              className="text-xs text-[#146B50] font-bold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500">
                  <th className="py-2.5 px-3">Santri</th>
                  <th className="py-2.5 px-3">Kegiatan</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Jarak</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {attendanceRecords.slice(0, 6).map((rec) => {
                  const meta = STATUS_META[rec.status];
                  return (
                    <tr key={rec.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rec.photo_path}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100">
                              {rec.student_name}
                            </p>
                            <p className="text-[10px] text-stone-400">{rec.group_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold">{rec.activity_name}</td>
                      <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                        {new Date(rec.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {Math.round(rec.distance_from_site_m)}m
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-[#146B50] hover:text-white transition cursor-pointer"
                          title="Lihat Detail Absensi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today Activities Timeline */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D6A84F]" />
              Jadwal Hari Ini
            </h2>
            <Link
              href="/musyrif/kegiatan"
              className="text-xs text-[#146B50] dark:text-[#D6A84F] font-bold hover:underline"
            >
              Kelola
            </Link>
          </div>

          <div className="space-y-3">
            {activities.map((act) => {
              const isCurrent = activeActivity?.id === act.id;
              return (
                <div
                  key={act.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                    isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#146B50] ring-1 ring-emerald-500/20'
                      : 'border-stone-100 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/30'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold ${isCurrent ? 'text-[#146B50] dark:text-[#D6A84F]' : 'text-stone-800 dark:text-stone-200'}`}>
                      {act.name}
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                      {act.start_time} - {act.end_time} WIB
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#146B50] text-white">
                      Aktif Sekarang
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedRecord && (
        <AttendanceDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {reviewRecord && (
        <PermissionReviewModal
          record={reviewRecord}
          onClose={() => setReviewRecord(null)}
          onApprove={(id, note) => reviewPermission(id, 'izin_disetujui', note)}
          onReject={(id, note) => reviewPermission(id, 'izin_ditolak', note)}
        />
      )}

      {correctRecord && (
        <CorrectionModal
          record={correctRecord}
          onClose={() => setCorrectRecord(null)}
          onSave={(id, newStatus, reason) => correctAttendance(id, newStatus, reason)}
        />
      )}
    </div>
  );
}
