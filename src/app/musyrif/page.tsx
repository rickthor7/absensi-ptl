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
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Star,
  DoorOpen,
  Shield,
} from 'lucide-react';
import GeotagLocationModal from '@/components/schedule/GeotagLocationModal';
import RaportSantriModal from '@/components/reports/RaportSantriModal';

/* ─── Circular Donut Ring Progress ─── */
function DonutRing({
  value,
  size = 80,
  strokeWidth = 7,
  color = '#105943',
  trackColor = '#E5EBE8',
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
      />
    </svg>
  );
}

/* ─── Mini Calendar Widget ─── */
function MiniCalendarWidget({ effectiveTime }: { effectiveTime: Date }) {
  const [viewDate, setViewDate] = useState(
    () => new Date(effectiveTime.getFullYear(), effectiveTime.getMonth(), 1)
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const handlePrev = () => setViewDate(new Date(year, month - 1, 1));
  const handleNext = () => setViewDate(new Date(year, month + 1, 1));

  // Monday-based offset (0 = Mon .. 6 = Sun)
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const tYear = effectiveTime.getFullYear();
  const tMonth = effectiveTime.getMonth();
  const tDay = effectiveTime.getDate();

  const gridCells = [];

  // Prev month filler
  for (let i = startOffset - 1; i >= 0; i--) {
    gridCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === tDay && month === tMonth && year === tYear;
    gridCells.push({
      day: d,
      isCurrentMonth: true,
      isToday,
    });
  }

  // Next month filler
  const remaining = (7 - (gridCells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#105943]" />
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
            Kalender Kegiatan Pondok
          </h3>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          aria-label="Bulan Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-400 mb-1.5">
        <span>Sen</span>
        <span>Sel</span>
        <span>Rab</span>
        <span>Kam</span>
        <span>Jum</span>
        <span>Sab</span>
        <span>Min</span>
      </div>

      {/* Day Cells Matrix */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {gridCells.map((item, idx) => (
          <div
            key={idx}
            className={`h-7 sm:h-8 flex items-center justify-center rounded-xl text-xs transition ${
              item.isToday
                ? 'bg-[#105943] text-white font-black shadow-sm'
                : item.isCurrentMonth
                ? 'text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-100 dark:hover:bg-stone-800/60'
                : 'text-stone-300 dark:text-stone-700'
            }`}
          >
            {item.day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MusyrifDashboardPage() {
  const {
    currentUser,
    attendanceRecords,
    activities,
    profiles,
    effectiveTime,
    sppPayments,
    reviewPermission,
    correctAttendance,
  } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<AttendanceRecord | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecord | null>(null);
  const [isGeotagModalOpen, setIsGeotagModalOpen] = useState(false);
  const [isRaportModalOpen, setIsRaportModalOpen] = useState(false);
  const [selectedRaportStudentId, setSelectedRaportStudentId] = useState<string | undefined>(
    undefined
  );

  const todayStr = effectiveTime.toISOString().split('T')[0];
  const santriList = profiles.filter((p) => p.role === 'santri' && p.is_active);

  // Active activity evaluation
  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;
  const isWindowOpen = activeResult.status === 'open' && !!activeActivity;

  // Today's attendance stats
  const todayRecords = attendanceRecords.filter((r) => r.operational_date === todayStr);
  const hadirValidToday = todayRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinMenungguToday = attendanceRecords.filter((r) => r.status === 'izin_diajukan').length;
  const masalahToday = attendanceRecords.filter(
    (r) => r.status === 'perlu_tinjauan' || r.status === 'ditolak_lokasi'
  ).length;

  const attendedActiveActivityCount = activeActivity
    ? todayRecords.filter((r) => r.activity_id === activeActivity.id).length
    : 0;
  const belumAbsenCount = activeActivity
    ? Math.max(0, santriList.length - attendedActiveActivityCount)
    : 0;

  // "Perlu Tindakan" list
  const pendingActions = attendanceRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'perlu_tinjauan'
  );

  // Discrepancy
  const discrepancyRecords = attendanceRecords.filter((r) => r.has_discrepancy);

  // Monthly stats
  const currentMonthKey = effectiveTime.toISOString().substring(0, 7);
  const monthlyStats = calculateMonthlyScores(
    profiles,
    activities,
    attendanceRecords,
    currentMonthKey
  );

  const totalHadirMonth = monthlyStats.studentScores.reduce((acc, s) => acc + s.hadirCount, 0);
  const totalIzinMonth = monthlyStats.studentScores.reduce((acc, s) => acc + s.izinCount, 0);
  const totalAlpaMonth = monthlyStats.studentScores.reduce((acc, s) => acc + s.alpaCount, 0);

  const ustadzName = currentUser.nickname || currentUser.full_name?.split(' ')[0] || 'Musyrif';

  // Greeting
  const h = effectiveTime.getHours();
  const greeting =
    h < 5 ? 'Selamat Malam' : h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 19 ? 'Selamat Sore' : 'Selamat Malam';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 1: HERO CARD + MONITORING SESI WIDGET ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ── LEFT HERO CARD (Col 7 on Desktop) ── */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B4A37] via-[#0E5B44] to-[#124233] text-white p-5 sm:p-6 lg:p-7 shadow-lg flex flex-col justify-between border border-[#146B50]/30 min-h-[300px]">
          
          {/* Mosque building backdrop image blended smoothly on right */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none overflow-hidden mix-blend-overlay hidden sm:block">
            <img
              src="/og-image.jpg"
              alt="Pesantren"
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B4A37] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 space-y-4">
            
            {/* Top row: Hijri date & WIB clock pills */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-emerald-100 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D6A84F]" />
                <span>{getEstimatedHijriDate(effectiveTime)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeotagModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6A84F] hover:bg-[#E8C36E] text-[#082F23] text-xs font-black transition shadow-xs cursor-pointer"
                  title="Atur Radius & Geotag GPS Pondok"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Geotag GPS</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-2xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#D6A84F]" />
                  <span>
                    {effectiveTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[9px] text-emerald-200">WIB</span>
                </div>
              </div>
            </div>

            {/* Greeting & Title */}
            <div>
              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
                {greeting},
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>USTADZ {ustadzName.toUpperCase()}</span>
                <span>👋</span>
              </h1>
              <p className="text-xs text-emerald-100/80 font-medium tracking-wide uppercase mt-1">
                {currentUser.full_name} • Musyrif Pembina Pondok
              </p>
            </div>

            {/* Tag Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-[#083327]/80 border border-[#146B50] text-[11px] font-mono font-bold text-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#D6A84F]" />
                <span>Dewan Asatidz</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-900/40 border border-amber-600/40 text-[11px] font-bold text-amber-200 flex items-center gap-1">
                <span>🛡️</span>
                <span>Verifikator Presensi</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-500/40 text-[11px] font-bold text-emerald-200 flex items-center gap-1">
                <span>🏠</span>
                <span>{currentUser.group_name || 'Asrama Nurul Falah'}</span>
              </span>
            </div>

          </div>

          {/* Bottom 3 Glass Stat Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-3 pt-5">
            {/* Box 1: Santri Aktif */}
            <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 text-center transition">
              <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-none">
                {santriList.length}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-white/90 mt-1">
                SANTRI
              </div>
              <div className="text-[9px] text-emerald-200/70">Aktif binaan</div>
            </div>

            {/* Box 2: Hadir Hari Ini */}
            <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 text-center transition">
              <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-none">
                {hadirValidToday}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-white/90 mt-1">
                HADIR
              </div>
              <div className="text-[9px] text-emerald-200/70">Hari ini</div>
            </div>

            {/* Box 3: Izin Menunggu */}
            <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 text-center transition">
              <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-none">
                {izinMenungguToday}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-white/90 mt-1">
                MENUNGGU
              </div>
              <div className="text-[9px] text-emerald-200/70">Izin diajukan</div>
            </div>
          </div>

        </div>

        {/* ── RIGHT CARD: MONITORING SESI AKTIF (Col 5 on Desktop) ── */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          
          <div className="space-y-3.5">
            {/* Header: Title + Semua Kegiatan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📢</span>
                <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  Monitoring Sesi Aktif
                </h2>
              </div>
              <Link
                href="/musyrif/kegiatan"
                className="text-xs font-bold text-[#105943] dark:text-[#D6A84F] hover:underline flex items-center gap-1"
              >
                <span>Semua Kegiatan</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Status Icon & Session Info */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#105943] dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
                <Calendar className="w-6 h-6" />
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isWindowOpen
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {isWindowOpen ? 'SEDANG BERLANGSUNG' : 'TUTUP'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 truncate">
                  {activeActivity ? activeActivity.name : 'Tidak Ada Sesi Terbuka'}
                </h3>

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {isWindowOpen
                    ? `${attendedActiveActivityCount} santri sudah tercatat hadir. ${belumAbsenCount} santri belum presensi.`
                    : 'Di luar rentang waktu kegiatan pondok. Anda dapat meninjau rekaman atau verifikasi perizinan.'}
                </p>
              </div>
            </div>

            {/* Next activity notice box */}
            <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 min-w-0">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  {activeResult.nextActivity
                    ? `Berikutnya: ${activeResult.nextActivity.name} (${activeResult.nextActivity.start_time})`
                    : 'Jadwal sesi hari ini telah tuntas.'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                {isWindowOpen ? 'Live' : 'Di Luar Jam'}
              </span>
            </div>

          </div>

          {/* Primary Action Button */}
          <div className="pt-4 flex items-center gap-2">
            <Link
              href="/musyrif/absensi"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-[#0B4A37] hover:bg-[#08382A] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D6A84F]" />
              <span>Buka Presensi Santri &amp; Rekap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>

      {/* ── Discrepancy Alert Banner if any ── */}
      {discrepancyRecords.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
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
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition shadow-xs self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <span>Verifikasi Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 2: 4 QUICK NAVIGATION CARDS ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Absensi Santri */}
        <Link
          href="/musyrif/absensi"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#105943] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Absensi
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Rekap &amp; GPS
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#105943] group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Card 2: Perizinan */}
        <Link
          href="/musyrif/perizinan"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                  Perizinan
                </h4>
                {izinMenungguToday > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {izinMenungguToday} Menunggu
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Card 3: Laporan & Raport */}
        <Link
          href="/musyrif/laporan"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Laporan
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Raport &amp; PDF
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Card 4: Keuangan & SPP */}
        <Link
          href="/musyrif/keuangan"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Keuangan
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                SPP &amp; Kas
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
        </Link>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 3: 3-COLUMN DETAILED INFORMATION GRID ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ── COL 1: KEDISIPLINAN KESELURUHAN (lg:col-span-4) ── */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#105943] text-sm">📊</span>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Ringkasan Kehadiran Pondok
                </h3>
              </div>
            </div>

            {/* Donut Chart Row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="relative shrink-0 flex items-center justify-center">
                <DonutRing
                  value={monthlyStats.averageScorePercentage}
                  size={82}
                  strokeWidth={7}
                  color="#105943"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-stone-900 dark:text-white">
                    {monthlyStats.averageScorePercentage}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                  Rata-rata Mutaba&apos;ah
                </p>

                {monthlyStats.averageScorePercentage >= 70 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    <span>✓</span>
                    <span>Memenuhi Standar</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                    <span>⚠️</span>
                    <span>Perlu Pembinaan</span>
                  </span>
                )}

                <div>
                  <Link
                    href="/musyrif/laporan"
                    className="text-xs font-bold text-[#105943] dark:text-[#D6A84F] hover:underline flex items-center gap-1"
                  >
                    <span>Buka Raport Bulanan</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Mini Stat Boxes Below */}
          <div className="grid grid-cols-4 gap-2 pt-5 border-t border-stone-100 dark:border-stone-800 mt-4">
            <div className="text-center p-2 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {totalHadirMonth}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Hadir</div>
            </div>

            <div className="text-center p-2 rounded-2xl bg-amber-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <DoorOpen className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {totalIzinMonth}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Izin</div>
            </div>

            <div className="text-center p-2 rounded-2xl bg-rose-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {totalAlpaMonth}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Alpa</div>
            </div>

            <div className="text-center p-2 rounded-2xl bg-orange-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                <Star className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {masalahToday}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Review</div>
            </div>
          </div>

        </div>

        {/* ── COL 2: PERLU TINDAKAN (lg:col-span-4) ── */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Perlu Ditinjau Segera
                </h3>
              </div>
              <Link
                href="/musyrif/perizinan"
                className="text-xs font-bold text-[#105943] dark:text-[#D6A84F] hover:underline flex items-center gap-1"
              >
                <span>Kelola Semua</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800 pt-1">
              {pendingActions.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Semua perizinan dan presensi telah terverifikasi aman.
                </div>
              ) : (
                pendingActions.slice(0, 4).map((rec) => (
                  <div
                    key={rec.id}
                    className="py-3 flex items-center justify-between gap-2.5 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition rounded-xl px-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-800 dark:text-stone-200 truncate">
                          {rec.student_name}
                        </p>
                        <p className="text-[10px] text-stone-400 truncate">
                          {rec.activity_name} • {rec.permission_reason || 'Izin diajukan'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReviewRecord(rec)}
                      className="shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#105943] hover:bg-[#08382A] text-white transition cursor-pointer"
                    >
                      Tinjau
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link
              href="/musyrif/perizinan"
              className="text-[11px] font-bold text-stone-500 hover:text-[#105943] transition"
            >
              Lihat selengkapnya &rarr;
            </Link>
          </div>

        </div>

        {/* ── COL 3: KALENDER KEGIATAN PONDOK (lg:col-span-4) ── */}
        <div className="lg:col-span-4">
          <MiniCalendarWidget effectiveTime={effectiveTime} />
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 4: BOTTOM BANNER ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B4A37] via-[#0E5B44] to-[#146B50] p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#146B50]/40">
        
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-20 pointer-events-none overflow-hidden mix-blend-overlay hidden md:block">
          <img
            src="/og-image.jpg"
            alt="Pesantren"
            className="w-full h-full object-cover object-right"
          />
        </div>

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 text-white">
            <Shield className="w-5 h-5 text-[#D6A84F]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
              Pantau kedisiplinan dan mutaba&apos;ah santri dengan amanah dan transparan
            </h4>
            <p className="text-[11px] text-emerald-100/70 truncate mt-0.5">
              Pondok Pesantren Nurul Falah - Ketintang, Surabaya
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0 self-end sm:self-center">
          <Link
            href="/musyrif/audit"
            className="px-4 py-2 rounded-full bg-[#D7EFE5] hover:bg-white text-[#0B4A37] font-black text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* ── MODALS ── */}
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
          onApprove={async (id, note, applyBatch) => {
            await reviewPermission(id, 'izin_disetujui', note, applyBatch);
            setReviewRecord(null);
          }}
          onReject={async (id, note, applyBatch) => {
            await reviewPermission(id, 'izin_ditolak', note, applyBatch);
            setReviewRecord(null);
          }}
        />
      )}

      {correctRecord && (
        <CorrectionModal
          record={correctRecord}
          onClose={() => setCorrectRecord(null)}
          onSave={async (id, newStatus, notes) => {
            await correctAttendance(id, newStatus, notes);
            setCorrectRecord(null);
          }}
        />
      )}

      {isGeotagModalOpen && (
        <GeotagLocationModal
          isOpen={isGeotagModalOpen}
          onClose={() => setIsGeotagModalOpen(false)}
        />
      )}

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
  );
}
