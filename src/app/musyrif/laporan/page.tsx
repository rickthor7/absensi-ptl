'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { calculateMonthlyScores, StudentMonthlyScore } from '@/lib/scoring';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  AlertOctagon,
  AlertTriangle,
  FileQuestion,
  User,
  Printer,
  Sparkles,
  Search,
  ChevronDown,
  Info,
  TrendingUp,
} from 'lucide-react';
import { formatIndonesianDate } from '@/lib/schedule';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

export default function MusyrifLaporanPage() {
  const { attendanceRecords, activities, profiles, effectiveTime } = useStore();

  const defaultMonth = effectiveTime.toISOString().substring(0, 7); // e.g. "2026-10"
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Month options for selector
  const availableMonths = [
    { value: '2026-10', label: 'Oktober 2026 (Bulan Berjalan)' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'Agustus 2026' },
  ];

  // Calculate monthly stats using the formula: Hadir=1, Izin=0.5, Alpa=0
  const monthlyStats = calculateMonthlyScores(
    profiles,
    activities,
    attendanceRecords,
    selectedMonth
  );

  const santriList = profiles.filter((p) => p.role === 'santri');
  const groups = Array.from(new Set(santriList.map((s) => s.group_name))).filter(Boolean);

  // Filter student scores
  const filteredStudents = monthlyStats.studentScores.filter((s) => {
    const matchName =
      s.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.student.student_number && s.student.student_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGroup = filterGroup === 'all' || s.student.group_name === filterGroup;
    return matchName && matchGroup;
  });

  // Selected student for individual deep-dive chart
  const currentSelectedStudent: StudentMonthlyScore =
    monthlyStats.studentScores.find((s) => s.student.id === selectedStudentId) ||
    monthlyStats.studentScores[0];

  // Export Comprehensive Monthly CSV
  const exportMonthlyCSV = () => {
    const headers = [
      'NIS',
      'Nama Santri',
      'Kamar / Asrama',
      'Hadir (Bobot 1)',
      'Izin (Bobot 0.5)',
      'Alpa / Ditolak (Bobot 0)',
      'Total Sesi Terjadwal',
      'Total Skor Poin',
      'Persentase Skor (%)',
      'Status Kelulusan',
      ...activities.map((a) => `Persentase ${a.name} (%)`),
    ];

    const rows = monthlyStats.studentScores.map((s) => {
      const actColumns = activities.map((a) => {
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
        ...actColumns,
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
      `rekap-bulanan-santri-nurul-falah-${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-1">
            <BarChart3 className="w-4 h-4 text-[#D6A84F]" />
            <span>Laporan & Evaluasi Presensi Bulanan</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Rekapitulasi Kehadiran & Analitik Santri
          </h1>
          <p className="text-xs text-stone-500">
            {PONDOK_DEFAULT_COORDINATES.name} • {PONDOK_DEFAULT_COORDINATES.address}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold p-2.5 pr-8 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 appearance-none focus:ring-2 focus:ring-[#146B50] outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportMonthlyCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-sm cursor-pointer border border-[#D6A84F]/40"
            title="Unduh seluruh rekap kehadiran bulanan dalam format CSV (Excel)"
          >
            <Download className="w-4 h-4 text-[#D6A84F]" />
            <span>Ekspor Bulanan (CSV)</span>
          </button>

          {/* Print Report Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
            title="Cetak format laporan resmi"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* FORMULA BOBOT PENILAIAN & AMBANG BATAS KELULUSAN */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-amber-50/50 to-emerald-50/80 dark:from-emerald-950/40 dark:via-stone-900 dark:to-emerald-950/40 p-4 sm:p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-800 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                Sistem Penilaian Skor Absensi Santri ({monthlyStats.monthLabel})
              </h3>
              <p className="text-stone-600 dark:text-stone-300 text-[11px] mt-0.5">
                Nilai akhir dihitung secara proporsional dari total sesi kegiatan yang terjadwal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] border border-emerald-200">
              Hadir = 1 Poin (100%)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-[11px] border border-amber-200">
              Izin = 0.5 Poin (50%)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-[11px] border border-rose-200">
              Alpa / Ditolak = 0 Poin (0%)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-red-600 text-white font-bold text-[11px] shadow-xs">
              Batas Minimal: 70%
            </span>
          </div>
        </div>
      </div>

      {/* PERINGATAN REAL-TIME: Santri Di Bawah 70% */}
      {monthlyStats.warningCount > 0 ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 shadow-md space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertOctagon className="w-6 h-6" />
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
                <h2 className="text-base font-extrabold text-rose-950 dark:text-rose-100 mt-1">
                  Ditemukan {monthlyStats.warningCount} Santri dengan Tingkat Kehadiran &lt; 70%
                </h2>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  Santri-santri berikut memerlukan evaluasi kedisiplinan dan komunikasi dengan wali santri.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {monthlyStats.warningStudents.map((ws) => (
              <div
                key={ws.student.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-900/60 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                      {ws.student.full_name}
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                      {ws.student.student_number}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {ws.student.group_name} • Kontak: {ws.student.phone || '-'}
                  </p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium">
                    Rincian: Hadir {ws.hadirCount}x, Izin {ws.izinCount}x, Alpa {ws.alpaCount}x (Total: {ws.totalSessions} sesi)
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-3 py-1.5 rounded-xl text-sm font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {ws.scorePercentage}%
                  </span>
                  <span className="block text-[10px] text-rose-600 font-bold mt-1">
                    Skor: {ws.totalScore} / {ws.totalSessions} pt
                  </span>
                  <button
                    onClick={() => setSelectedStudentId(ws.student.id)}
                    className="mt-2 text-[11px] font-bold text-[#146B50] hover:underline block"
                  >
                    Lihat Grafik &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Alhamdulillah, Seluruh Santri Memenuhi Standar Presensi!</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Tidak ada santri yang memiliki skor kehadiran di bawah 70% untuk periode {monthlyStats.monthLabel}.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: DATA GRAFIK UMUM / GLOBAL SANTRI               */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#146B50]" />
            <span>Data Grafik Umum / Global Santri Pondok</span>
          </h2>
          <span className="text-xs text-stone-500">
            Rata-rata: <strong className="text-[#146B50] dark:text-[#D6A84F]">{monthlyStats.averageScorePercentage}%</strong>
          </span>
        </div>

        {/* Global Summary KPI 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-stone-400 text-xs font-semibold block">Rata-rata Skor Keseluruhan</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#146B50] dark:text-[#D6A84F] mt-1">
              {monthlyStats.averageScorePercentage}%
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Akumulasi bobot 1/0.5/0</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold block">Sangat Baik (≥ 85%)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              {monthlyStats.tierSangatBaikCount} <span className="text-xs text-stone-400 font-normal">Santri</span>
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1">Konsisten hadir tepat waktu</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold block">Cukup (70% - 84%)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
              {monthlyStats.tierCukupCount} <span className="text-xs text-stone-400 font-normal">Santri</span>
            </div>
            <p className="text-[11px] text-amber-600/80 mt-1">Memenuhi standar minimal</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-rose-600 dark:text-rose-400 text-xs font-semibold block">Peringatan (&lt; 70%)</span>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${monthlyStats.tierPeringatanCount > 0 ? 'text-rose-600 animate-pulse' : 'text-stone-400'}`}>
              {monthlyStats.tierPeringatanCount} <span className="text-xs text-stone-400 font-normal">Santri</span>
            </div>
            <p className="text-[11px] text-rose-600/80 mt-1">Perlu tindakan pembinaan</p>
          </div>
        </div>

        {/* Global Bar Chart: Kehadiran Per Kegiatan Pondok */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Grafik Skor Rata-rata per Kegiatan ({monthlyStats.monthLabel})
              </h3>
              <p className="text-xs text-stone-500">
                Membandingkan tingkat ketertiban kehadiran santri di seluruh 8 jadwal kegiatan harian
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {monthlyStats.activityStats.map((act) => {
              const isBelow70 = act.rate < 70;
              return (
                <div
                  key={act.activityId}
                  className="p-4 rounded-2xl bg-stone-50/50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>{act.activityName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-200/60 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                        {act.activityCode}
                      </span>
                    </span>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                        isBelow70
                          ? 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/50 dark:text-rose-300'
                          : act.rate >= 85
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}
                    >
                      {act.rate}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-200/70 dark:bg-stone-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBelow70
                          ? 'bg-rose-500'
                          : act.rate >= 85
                          ? 'bg-[#146B50]'
                          : 'bg-[#D6A84F]'
                      }`}
                      style={{ width: `${Math.min(100, act.rate)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>Hadir: {act.hadirCount}x (x1) • Izin: {act.izinCount}x (x0.5) • Alpa: {act.alpaCount}x</span>
                    <span className="font-medium">Total: {act.totalSessions} sesi</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: DATA GRAFIK MASING-MASING SANTRI (INDIVIDUAL) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#146B50]">
              <TrendingUp className="w-4 h-4 text-[#D6A84F]" />
              <span>Analisis Grafik Masing-Masing Santri</span>
            </div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
              Breakdown Performa Santri Terpilih ({monthlyStats.monthLabel})
            </h2>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500">Pilih Santri:</span>
            <div className="relative">
              <select
                value={currentSelectedStudent?.student.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs font-bold p-2.5 pr-8 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 appearance-none focus:ring-2 focus:ring-[#146B50] outline-none cursor-pointer"
              >
                {monthlyStats.studentScores.map((s) => (
                  <option key={s.student.id} value={s.student.id}>
                    {s.student.full_name} ({s.scorePercentage}% {s.isWarning ? '⚠️ <70%' : ''})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected Student Profile & Summary Card */}
        {currentSelectedStudent && (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold text-lg shadow-sm">
                  {currentSelectedStudent.student.full_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                      {currentSelectedStudent.student.full_name}
                    </h3>
                    <span className="font-mono text-xs text-stone-500">
                      NIS: {currentSelectedStudent.student.student_number}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {currentSelectedStudent.student.group_name} • Kontak: {currentSelectedStudent.student.phone || '-'}
                  </p>
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center min-w-[70px]">
                  <span className="text-[10px] text-stone-400 block">Hadir (x1)</span>
                  <span className="font-bold text-sm text-emerald-700">{currentSelectedStudent.hadirCount}x</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center min-w-[70px]">
                  <span className="text-[10px] text-stone-400 block">Izin (x0.5)</span>
                  <span className="font-bold text-sm text-amber-700">{currentSelectedStudent.izinCount}x</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center min-w-[70px]">
                  <span className="text-[10px] text-stone-400 block">Alpa (x0)</span>
                  <span className="font-bold text-sm text-rose-700">{currentSelectedStudent.alpaCount}x</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center min-w-[90px]">
                  <span className="text-[10px] text-stone-400 block">Total Nilai Skor</span>
                  <span className="font-black text-sm text-[#146B50] dark:text-[#D6A84F]">
                    {currentSelectedStudent.totalScore} / {currentSelectedStudent.totalSessions} pt
                  </span>
                </div>

                <div className={`p-3 rounded-2xl text-center min-w-[100px] border ${
                  currentSelectedStudent.isWarning
                    ? 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 text-rose-700'
                    : 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold block">
                    {currentSelectedStudent.isWarning ? 'Peringatan' : 'Aman'}
                  </span>
                  <span className="font-black text-lg">
                    {currentSelectedStudent.scorePercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Activity Bars for Selected Student */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Tingkat Kehadiran per Kegiatan untuk {currentSelectedStudent.student.full_name}:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activities.map((act) => {
                  const sc = currentSelectedStudent.activityScores[act.id];
                  const percentage = sc ? sc.percentage : 100;
                  const hadir = sc ? sc.hadir : 0;
                  const izin = sc ? sc.izin : 0;
                  const alpa = sc ? sc.alpa : 0;
                  const score = sc ? sc.score : 0;
                  const sessions = sc ? sc.sessions : 0;
                  const isLow = percentage < 70;

                  return (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {act.name}
                        </span>
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                            isLow
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : percentage >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow
                              ? 'bg-rose-500'
                              : percentage >= 85
                              ? 'bg-[#146B50]'
                              : 'bg-[#D6A84F]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>Hadir: {hadir}x • Izin: {izin}x • Alpa: {alpa}x</span>
                        <span className="font-semibold text-stone-600 dark:text-stone-300">Skor: {score}/{sessions} pt</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: TABEL REKAPITULASI BULANAN LENGKAP SANTRI     */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
              Tabel Rekapitulasi & Nilai Akhir Santri ({monthlyStats.monthLabel})
            </h2>
            <p className="text-xs text-stone-500">
              Total {filteredStudents.length} santri terdaftar • Skor dihitung otomatis: Hadir=1, Izin=0.5, Alpa=0
            </p>
          </div>

          {/* Search & Group Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari santri / NIS..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none focus:ring-2 focus:ring-[#146B50]"
              />
            </div>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="text-xs font-medium p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
            >
              <option value="all">Semua Kamar</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 bg-stone-50/50 dark:bg-stone-800/30">
                <th className="py-3 px-4 font-bold">Santri</th>
                <th className="py-3 px-4 font-bold">NIS</th>
                <th className="py-3 px-4 font-bold">Kamar Asrama</th>
                <th className="py-3 px-4 font-bold text-center">Hadir (x1)</th>
                <th className="py-3 px-4 font-bold text-center">Izin (x0.5)</th>
                <th className="py-3 px-4 font-bold text-center">Alpa (x0)</th>
                <th className="py-3 px-4 font-bold text-center">Total Skor</th>
                <th className="py-3 px-4 font-bold text-center">Persentase</th>
                <th className="py-3 px-4 font-bold text-center">Status Kelulusan</th>
                <th className="py-3 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredStudents.map((st) => {
                const isSelected = currentSelectedStudent?.student.id === st.student.id;
                return (
                  <tr
                    key={st.student.id}
                    className={`transition ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold'
                        : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {st.student.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-500">
                      {st.student.student_number}
                    </td>
                    <td className="py-3.5 px-4 text-[#146B50] font-semibold">
                      {st.student.group_name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {st.hadirCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                      {st.izinCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-rose-700">
                      {st.alpaCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-stone-900 dark:text-stone-100">
                      {st.totalScore} / {st.totalSessions} pt
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-black px-2.5 py-1 rounded-xl text-xs ${
                          st.isWarning
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                            : st.scorePercentage >= 85
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {st.scorePercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {st.isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Peringatan (&lt; 70%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Aman (≥ 70%)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudentId(st.student.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#146B50] text-white shadow-xs'
                            : 'border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-[#146B50] hover:text-white'
                        }`}
                      >
                        Grafik
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
