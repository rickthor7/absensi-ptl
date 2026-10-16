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
  Crosshair,
  Locate,
  GraduationCap,
  Wallet,
  CreditCard,
} from 'lucide-react';
import GeotagLocationModal from '@/components/schedule/GeotagLocationModal';
import RaportSantriModal from '@/components/reports/RaportSantriModal';

export default function MusyrifDashboardPage() {
  const {
    currentUser,
    attendanceRecords,
    activities,
    profiles,
    effectiveTime,
    sppPayments,
    financialTransactions,
    reviewPermission,
    correctAttendance,
  } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<AttendanceRecord | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecord | null>(null);
  const [isGeotagModalOpen, setIsGeotagModalOpen] = useState(false);
  const [isRaportModalOpen, setIsRaportModalOpen] = useState(false);
  const [selectedRaportStudentId, setSelectedRaportStudentId] = useState<string | undefined>(undefined);

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

  // Santri dengan ketidaksamaan presensi (Santri vs Musyrif)
  const discrepancyRecords = attendanceRecords.filter((r) => r.has_discrepancy);

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
    <div className="mesh-bg min-h-[calc(100vh-8rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 relative z-10">

        {/* ── Header Banner ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-xl shadow-emerald-950/20">
          <div className="absolute top-0 right-0 w-60 h-60 bg-[#D4A24C]/6 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-[#D4A24C]/80 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dashboard Musyrif • {getEstimatedHijriDate(effectiveTime)}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Ahlan, {currentUser.full_name.split(' ').slice(0, 2).join(' ')}
              </h1>
              <p className="text-[11px] text-emerald-200/60 mt-0.5">
                {currentUser.group_name} • Pengawasan Real-time
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsGeotagModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D6A84F] to-[#E8C36E] text-[#082F23] text-xs font-black transition shadow-md hover:brightness-105 active:scale-95 cursor-pointer"
                title="Perbarui titik lokasi GPS presensi santri"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Geotag GPS</span>
              </button>

              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/8">
                <Clock className="w-4 h-4 text-[#D4A24C]" />
                <div>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {effectiveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-emerald-200/50 ml-1">WIB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Discrepancy Alert Banner ── */}
        {discrepancyRecords.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                  Perhatian: Ditemukan {discrepancyRecords.length} Ketidaksamaan Data Presensi!
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Terdapat perbedaan antara catatan mandiri (selfie/izin) santri dan absen manual musyrif.
                </p>
              </div>
            </div>
            <Link
              href="/musyrif/absensi"
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black transition shadow-sm self-start sm:self-auto shrink-0 flex items-center gap-1.5"
            >
              <span>Cek Bukti & Verifikasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── 4 Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#0F1E18] p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-[#1C3A2E] stat-accent-emerald card-hover shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Hari Ini
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">{hadirValidToday}</div>
            <span className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold mt-0.5 block">Hadir Valid</span>
          </div>

          <div className="bg-white dark:bg-[#0F1E18] p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-[#1C3A2E] stat-accent-gold card-hover shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileQuestion className="w-4 h-4" />
              </div>
              {izinMenungguToday > 0 ? (
                <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full dot-pulse">
                  Perlu Aksi
                </span>
              ) : (
                <span className="text-[10px] font-bold text-stone-400 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  Nihil
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">{izinMenungguToday}</div>
            <span className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold mt-0.5 block">Izin Menunggu</span>
          </div>

          <div className="bg-white dark:bg-[#0F1E18] p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-[#1C3A2E] stat-accent-blue card-hover shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/12 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                Sesi Aktif
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">{belumAbsenCount}</div>
            <span className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold mt-0.5 block">Belum Absen</span>
            <span className="block text-[9px] text-stone-400">dari total {santriList.length} santri</span>
          </div>

          <div className="bg-white dark:bg-[#0F1E18] p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-[#1C3A2E] card-hover shadow-sm" style={{ borderLeft: '3px solid #0D7B5F' }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0D7B5F]/12 text-[#0D7B5F] dark:text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              {activeActivity ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] font-bold text-stone-400 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  Tutup
                </span>
              )}
            </div>
            <div className="text-sm font-black text-stone-900 dark:text-stone-100 truncate">
              {activeActivity ? activeActivity.name : 'Ditutup'}
            </div>
            <span className="text-[11px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold block mt-0.5">
              {activeActivity ? `${activeActivity.start_time} – ${activeActivity.end_time} WIB` : 'Jadwal sesi berikutnya'}
            </span>
          </div>
        </div>

        {/* ── Keuangan & SPP Quick Banner ── */}
        {(() => {
          const pendingSpp = (sppPayments || []).filter((p) => p.status === 'pending');
          const totalIn = (financialTransactions || [])
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const totalOut = (financialTransactions || [])
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const saldo = totalIn - totalOut;

          const formatRp = (val: number) =>
            new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(val);

          return (
            <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/90 dark:border-[#1C3A2E] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0D7B5F]/20 to-[#D4A24C]/20 text-[#0D7B5F] dark:text-[#D4A24C] flex items-center justify-center shrink-0 border border-[#0D7B5F]/20">
                  <Wallet className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Kas & Keuangan Pondok
                    </span>
                    <span className="text-xs font-mono font-extrabold text-[#0D7B5F] dark:text-[#D4A24C]">
                      Saldo: {formatRp(saldo)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>Kas Masuk: <strong className="text-emerald-600">{formatRp(totalIn)}</strong></span>
                    <span>•</span>
                    <span>Pengeluaran: <strong className="text-rose-600">{formatRp(totalOut)}</strong></span>
                    {pendingSpp.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 animate-pulse">
                        {pendingSpp.length} Bukti SPP Menunggu Verifikasi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <Link
                  href="/transparansi"
                  target="_blank"
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
                  <span>Publik</span>
                </Link>

                <Link
                  href="/musyrif/keuangan"
                  className="px-4 py-2 rounded-xl bg-[#0D7B5F] hover:bg-[#0a664e] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Kelola Keuangan & SPP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* ── Warning Banner ── */}
        {monthlyStats.warningCount > 0 && (
          <div className="rounded-2xl overflow-hidden border-2 border-rose-400/60 dark:border-rose-800 shadow-md animate-fade-up">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-white">
                <AlertOctagon className="w-5 h-5" />
                <div>
                  <span className="font-bold text-sm">Peringatan: {monthlyStats.warningCount} Santri &lt; 70%</span>
                  <span className="block text-[10px] text-rose-100">Bulan {monthlyStats.monthLabel}</span>
                </div>
              </div>
              <Link
                href="/musyrif/laporan"
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition btn-press flex items-center gap-1"
              >
                <span>Detail</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="bg-rose-50 dark:bg-rose-950/30 p-4 space-y-2">
              {monthlyStats.warningStudents.slice(0, 4).map((ws) => (
                <div
                  key={ws.student.id}
                  className="p-3 rounded-xl bg-white dark:bg-[#0F1E18] border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      {ws.student.full_name}
                      <span className="text-[10px] font-mono text-stone-400 ml-1.5">({ws.student.student_number})</span>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Hadir: {ws.hadirCount}x • Izin: {ws.izinCount}x • Alpa: {ws.alpaCount}x
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 tabular-nums">
                    {ws.scorePercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Global Attendance Chart & Export ── */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-[#1C3A2E]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D7B5F]/10 to-[#D4A24C]/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#0D7B5F]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Rekap Kehadiran <span className="text-stone-400 font-normal text-[11px]">({monthlyStats.monthLabel})</span>
                </h2>
                <p className="text-[10px] text-stone-400">Hadir=1pt • Izin=0.5pt • Alpa=0pt • Min: 70%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedRaportStudentId(undefined);
                  setIsRaportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D6A84F] to-[#E8C36E] text-[#082F23] text-xs font-black transition shadow-sm hover:brightness-105 active:scale-95 cursor-pointer"
                title="Buka raport bulanan santri dengan kop resmi (PDF & CSV)"
              >
                <GraduationCap className="w-4 h-4 stroke-[2.2]" />
                <span>Raport Santri</span>
              </button>
              <button
                onClick={exportMonthlyCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D7B5F] hover:bg-[#096B52] text-white text-[11px] font-bold transition shadow-sm cursor-pointer btn-press"
              >
                <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Ekspor CSV</span>
              </button>
              <Link
                href="/musyrif/laporan"
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-[#1C3A2E] hover:bg-stone-50 dark:hover:bg-[#162B22] text-stone-600 dark:text-stone-300 text-[11px] font-semibold transition"
              >
                Lengkap
              </Link>
            </div>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-100 dark:bg-[#1C3A2E]">
            {[
              { label: 'Rata-rata Skor', value: `${monthlyStats.averageScorePercentage}%`, color: 'text-[#0D7B5F] dark:text-[#D4A24C]' },
              { label: 'Sangat Baik (≥85%)', value: `${monthlyStats.tierSangatBaikCount}`, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Cukup (70-84%)', value: `${monthlyStats.tierCukupCount}`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Peringatan (<70%)', value: `${monthlyStats.tierPeringatanCount}`, color: monthlyStats.tierPeringatanCount > 0 ? 'text-rose-600' : 'text-stone-400' },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-[#0F1E18] p-3 sm:p-4">
                <span className="text-[10px] text-stone-400 block">{item.label}</span>
                <span className={`text-lg font-extrabold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Activity Bars */}
          <div className="p-5 space-y-3">
            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block">Per Kegiatan:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {monthlyStats.activityStats.map((act) => {
                const isLow = act.rate < 70;
                return (
                  <div
                    key={act.activityId}
                    className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#162B22]/50 border border-stone-200/60 dark:border-[#1C3A2E] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {act.activityName}
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-stone-200/60 dark:bg-[#1C3A2E] text-stone-400 ml-1.5">
                          {act.activityCode}
                        </span>
                      </span>
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-md ${
                          isLow
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            : act.rate >= 85
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {act.rate}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200/60 dark:bg-[#1C3A2E] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-fill-bar ${
                          isLow
                            ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                            : act.rate >= 85
                            ? 'bg-gradient-to-r from-[#0D7B5F] to-[#1AA37A]'
                            : 'bg-gradient-to-r from-[#D4A24C] to-[#E8C36E]'
                        }`}
                        style={{ width: `${Math.min(100, act.rate)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-stone-400">
                      H:{act.hadirCount} • I:{act.izinCount} • A:{act.alpaCount} • Total:{act.totalSessions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Pending Actions Panel ── */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-[#1C3A2E]">
            <div className="flex items-center gap-2">
              {pendingActions.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 dot-pulse" />
              )}
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Perlu Tindakan ({pendingActions.length})
              </h2>
            </div>
            <Link
              href="/musyrif/perizinan"
              className="text-[10px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold hover:underline flex items-center gap-1"
            >
              <span>Semua</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingActions.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              Alhamdulillah, tidak ada yang memerlukan tindakan.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-[#1C3A2E]">
              {pendingActions.slice(0, 4).map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-[#162B22]/30 transition">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.photo_path}
                        alt="Bukti"
                        className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-[#1C3A2E]"
                      />
                      <div>
                        <h3 className="font-bold text-xs text-stone-900 dark:text-stone-100">{item.student_name}</h3>
                        <p className="text-[10px] text-stone-500">{item.group_name} • {item.activity_name}</p>
                        {item.permission_reason && (
                          <p className="text-[10px] text-stone-500 italic mt-0.5">&ldquo;{item.permission_reason}&rdquo;</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                        {meta.label}
                      </span>
                      {item.status === 'izin_diajukan' ? (
                        <button
                          onClick={() => setReviewRecord(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#0D7B5F] hover:bg-[#096B52] text-white text-[11px] font-bold transition btn-press cursor-pointer"
                        >
                          Tinjau
                        </button>
                      ) : (
                        <button
                          onClick={() => setCorrectRecord(item)}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition btn-press cursor-pointer"
                        >
                          Koreksi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Attendance & Schedule ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Attendance Table */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-[#1C3A2E]">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Absensi Terkini</h2>
              <Link href="/musyrif/absensi" className="text-[10px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold hover:underline">
                Semua →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-[#1C3A2E] text-stone-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Santri</th>
                    <th className="py-2.5 px-3 font-semibold">Kegiatan</th>
                    <th className="py-2.5 px-3 font-semibold">Waktu</th>
                    <th className="py-2.5 px-3 font-semibold">Jarak</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-[#1C3A2E]">
                  {attendanceRecords.slice(0, 6).map((rec) => {
                    const meta = STATUS_META[rec.status];
                    return (
                      <tr key={rec.id} className="hover:bg-stone-50/50 dark:hover:bg-[#162B22]/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img src={rec.photo_path} alt="" className="w-7 h-7 rounded-md object-cover" />
                            <div>
                              <p className="font-semibold text-stone-800 dark:text-stone-100 text-[11px]">{rec.student_name}</p>
                              <p className="text-[9px] text-stone-400">{rec.group_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-[11px]">{rec.activity_name}</td>
                        <td className="py-3 px-3 text-stone-500 font-mono text-[10px] tabular-nums">
                          {new Date(rec.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] tabular-nums">{Math.round(rec.distance_from_site_m)}m</td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedRecord(rec)}
                            className="p-1.5 rounded-md bg-stone-100 dark:bg-[#162B22] text-stone-500 hover:bg-[#0D7B5F] hover:text-white transition cursor-pointer"
                            title="Detail"
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
          <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-[#1C3A2E]">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D4A24C]" />
                Jadwal
              </h2>
              <Link href="/musyrif/kegiatan" className="text-[10px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold hover:underline">
                Kelola
              </Link>
            </div>

            <div className="p-4 space-y-2">
              {activities.map((act) => {
                const isCurrent = activeActivity?.id === act.id;
                return (
                  <div
                    key={act.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-[#0D7B5F]/8 dark:bg-[#0D7B5F]/15 border-[#0D7B5F]/30'
                        : 'border-stone-100 dark:border-[#1C3A2E] bg-stone-50/50 dark:bg-[#162B22]/30'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-[#0D7B5F] dark:text-[#D4A24C]' : 'text-stone-700 dark:text-stone-300'}`}>
                        {act.name}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono tabular-nums">
                        {act.start_time} – {act.end_time}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#0D7B5F] text-white shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white dot-pulse" />
                        Aktif
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

        {/* Geotag Calibration Modal */}
        <GeotagLocationModal
          isOpen={isGeotagModalOpen}
          onClose={() => setIsGeotagModalOpen(false)}
        />

        {/* Raport Santri Bulanan Modal (Kop Resmi, Rincian Kegiatan, Cetak PDF & Ekspor CSV) */}
        {isRaportModalOpen && (
          <RaportSantriModal
            studentsScores={monthlyStats.studentScores}
            initialStudentId={selectedRaportStudentId}
            activities={activities}
            monthLabel={monthlyStats.monthLabel}
            monthKey={currentMonthKey}
            musyrifUser={currentUser}
            onClose={() => setIsRaportModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
