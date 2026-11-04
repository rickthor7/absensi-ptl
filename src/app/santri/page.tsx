'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import {
  CheckCircle2,
  Calendar,
  History,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Camera,
  Check,
  CreditCard,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Star,
  Flame,
  FileSpreadsheet,
  DoorOpen,
} from 'lucide-react';
import { STATUS_META } from '@/lib/constants';
import RaportSantriModal from '@/components/reports/RaportSantriModal';

/* ─── Greeting Helper ─── */
function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Selamat Malam';
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

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
            Kalender Kegiatan
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

export default function SantriDashboardPage() {
  const router = useRouter();
  const [isRaportOpen, setIsRaportOpen] = useState(false);
  const {
    currentUser,
    activities,
    attendanceRecords,
    effectiveTime,
    deleteSantriAttendance,
  } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;
  const isWindowOpen = activeResult.status === 'open' && !!activeActivity;

  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);
  const todayStr = effectiveTime.toISOString().split('T')[0];
  const todayAttendance = activeActivity
    ? studentRecords.find(
        (r) => r.activity_id === activeActivity.id && r.operational_date === todayStr
      )
    : null;

  /* ── Monthly Stats ── */
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
  const alpaCount = monthRecords.filter((r) => r.status === 'alpa').length;
  const reviewCount = monthRecords.filter(
    (r) => r.status === 'perlu_tinjauan' || r.status === 'ditolak_lokasi'
  ).length;
  const totalThisMonth = hadirCount + izinCount + alpaCount + reviewCount;
  const attendanceRate =
    totalThisMonth > 0 ? Math.round((hadirCount / totalThisMonth) * 100) : 0;

  /* ── Streak Calculation ── */
  const streak = useMemo(() => {
    const sorted = [...studentRecords]
      .filter((r) => r.status === 'hadir_valid')
      .sort((a, b) => (b.operational_date > a.operational_date ? 1 : -1));
    if (!sorted.length) return 0;
    let count = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = new Date(sorted[i].operational_date);
      const next = new Date(sorted[i + 1].operational_date);
      const diff = (curr.getTime() - next.getTime()) / 86400000;
      if (diff <= 2) count++;
      else break;
    }
    return count;
  }, [studentRecords]);

  const firstName = currentUser.nickname || currentUser.full_name?.split(' ')[0] || 'Santri';
  const greeting = getGreeting(effectiveTime);

  // Status badge check
  const isSafe = attendanceRate >= 70;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 1: HERO CARD + KEGIATAN TERBARU WIDGET ── */}
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

            {/* Greeting & Name Title */}
            <div>
              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
                {greeting},
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>{firstName.toUpperCase()}</span>
                <span>👋</span>
              </h1>
              <p className="text-xs text-emerald-100/80 font-medium tracking-wide uppercase mt-1">
                {currentUser.full_name}
              </p>
            </div>

            {/* Tag Badges Row (STR/NIS, Angkatan, Status Peringatan) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-[#083327]/80 border border-[#146B50] text-[11px] font-mono font-bold text-emerald-200">
                {currentUser.student_number || 'STR. 2024 - 809'}
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-900/40 border border-amber-600/40 text-[11px] font-bold text-amber-200 flex items-center gap-1">
                <span>🎓</span>
                <span>Angkatan {currentUser.generation || '2024'}</span>
              </span>

              {isSafe ? (
                <span className="px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-500/40 text-[11px] font-bold text-emerald-200 flex items-center gap-1">
                  <span>✓</span>
                  <span>Aman (≥ 70%)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/50 text-[11px] font-bold text-rose-200 flex items-center gap-1 animate-pulse">
                  <span>⚠️</span>
                  <span>Peringatan</span>
                </span>
              )}
            </div>

          </div>

          {/* Bottom 3 Glass Stat Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-3 pt-5">
            {/* Box 1: Hadir */}
            <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 text-center transition">
              <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-none">
                {hadirCount}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-white/90 mt-1">
                HADIR
              </div>
              <div className="text-[9px] text-emerald-200/70">Bulan ini</div>
            </div>

            {/* Box 2: Izin */}
            <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 text-center transition">
              <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-none">
                {izinCount}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-white/90 mt-1">
                IZIN
              </div>
              <div className="text-[9px] text-emerald-200/70">Disetujui</div>
            </div>

            {/* Box 3: Streak */}
            <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 text-center transition">
              <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-[#D6A84F]/25 text-[#D6A84F] flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-white leading-none">
                {streak}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-white/90 mt-1">
                STREAK
              </div>
              <div className="text-[9px] text-emerald-200/70">Hari hadir</div>
            </div>
          </div>

        </div>

        {/* ── RIGHT CARD: KEGIATAN TERBARU (Col 5 on Desktop) ── */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          
          <div className="space-y-3.5">
            {/* Header: Title + Lihat Semua */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📢</span>
                <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  Kegiatan Terbaru
                </h2>
              </div>
              <Link
                href="/santri/kalender"
                className="text-xs font-bold text-[#105943] dark:text-[#D6A84F] hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
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
                    {isWindowOpen ? 'BUKA' : 'TUTUP'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 truncate">
                  {activeActivity ? activeActivity.name : 'Tidak Ada Kegiatan'}
                </h3>

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {isWindowOpen
                    ? `Sesi absensi kegiatan ${activeActivity?.name} sedang dibuka. Silakan lakukan selfie dan verifikasi GPS.`
                    : 'Diluar jam kegiatan aktif. Anda dapat melihat jadwal sesi berikutnya atau mengajukan perizinan.'}
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
                    : 'Semua sesi terjadwal hari ini selesai.'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                {isWindowOpen ? 'Aktif' : 'Di Luar Jam'}
              </span>
            </div>

          </div>

          {/* Primary Action Button */}
          <div className="pt-4">
            {todayAttendance ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                    Absen Tercatat: {todayAttendance.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Ambil ulang foto absensi ini?')) {
                      await deleteSantriAttendance(todayAttendance.id);
                      router.push('/santri/absensi');
                    }
                  }}
                  className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                  title="Retake absen"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isWindowOpen ? (
              <Link
                href="/santri/absensi"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0B4A37] to-[#105943] hover:from-[#08382A] hover:to-[#0B4A37] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#D6A84F]" />
                <span>Ambil Absensi Selfie Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/santri/absensi"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0B4A37] hover:bg-[#08382A] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#D6A84F]" />
                <span>Formulir Presensi &amp; Izin</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 2: 4 QUICK NAVIGATION CARDS ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Absen / Selfie GPS */}
        <Link
          href="/santri/absensi"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#105943] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Absen
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Selfie GPS
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#105943] group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Card 2: Kalender / Bulanan */}
        <Link
          href="/santri/kalender"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Kalender
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Bulanan
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Card 3: Riwayat / Catatan */}
        <Link
          href="/santri/riwayat"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Riwayat
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Catatan
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Card 4: SPP / Keuangan */}
        <Link
          href="/santri/spp"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                SPP
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Keuangan
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
        
        {/* ── COL 1: RINGKASAN KEHADIRAN (lg:col-span-4) ── */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#105943] text-sm">📊</span>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Ringkasan Kehadiran
                </h3>
              </div>
            </div>

            {/* Donut Chart Row */}
            <div className="flex items-center gap-4 pt-1">
              {/* Donut Ring */}
              <div className="relative shrink-0 flex items-center justify-center">
                <DonutRing value={attendanceRate} size={82} strokeWidth={7} color="#105943" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-stone-900 dark:text-white">
                    {attendanceRate}%
                  </span>
                </div>
              </div>

              {/* Status Info & Raport Trigger */}
              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                  Kehadiran Bulan Ini
                </p>

                {isSafe ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    <span>✓</span>
                    <span>Aman (≥ 70%)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                    <span>⚠️</span>
                    <span>Peringatan</span>
                  </span>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setIsRaportOpen(true)}
                    className="text-xs font-bold text-[#105943] dark:text-[#D6A84F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Mini Stat Boxes Below */}
          <div className="grid grid-cols-4 gap-2 pt-5 border-t border-stone-100 dark:border-stone-800 mt-4">
            {/* Hadir */}
            <div className="text-center p-2 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {hadirCount}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Hadir</div>
            </div>

            {/* Izin */}
            <div className="text-center p-2 rounded-2xl bg-amber-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <DoorOpen className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {izinCount}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Izin</div>
            </div>

            {/* Alpa */}
            <div className="text-center p-2 rounded-2xl bg-rose-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {alpaCount}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Alpa</div>
            </div>

            {/* Review */}
            <div className="text-center p-2 rounded-2xl bg-orange-50 dark:bg-stone-800/50">
              <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                <Star className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-white">
                {reviewCount}
              </div>
              <div className="text-[10px] font-semibold text-stone-500">Review</div>
            </div>
          </div>

        </div>

        {/* ── COL 2: RIWAYAT ABSENSI TERKINI (lg:col-span-4) ── */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between">
          
          <div>
            {/* Header: Title + Semua Riwayat */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#105943]" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Riwayat Absensi Terkini
                </h3>
              </div>
              <Link
                href="/santri/riwayat"
                className="text-xs font-bold text-[#105943] dark:text-[#D6A84F] hover:underline flex items-center gap-1"
              >
                <span>Semua Riwayat</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* List of Recent Items */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800 pt-1">
              {studentRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Belum ada riwayat absensi tercatat.
                </div>
              ) : (
                studentRecords.slice(0, 4).map((rec) => {
                  const meta = STATUS_META[rec.status];
                  return (
                    <div
                      key={rec.id}
                      className="py-3 flex items-center justify-between gap-2.5 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition rounded-xl px-1"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            rec.status === 'hadir_valid'
                              ? 'bg-emerald-500'
                              : rec.status.startsWith('izin')
                              ? 'bg-amber-500'
                              : 'bg-orange-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-stone-800 dark:text-stone-200 truncate">
                            {rec.activity_name || 'Kegiatan Pondok'}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {rec.operational_date} •{' '}
                            {new Date(rec.submitted_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        {meta.label.split('—')[0].trim()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link
              href="/santri/riwayat"
              className="text-[11px] font-bold text-stone-500 hover:text-[#105943] transition"
            >
              Lihat selengkapnya &rarr;
            </Link>
          </div>

        </div>

        {/* ── COL 3: KALENDER KEGIATAN WIDGET (lg:col-span-4) ── */}
        <div className="lg:col-span-4">
          <MiniCalendarWidget effectiveTime={effectiveTime} />
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 4: BOTTOM MOTIVATIONAL PESANTREN BANNER ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B4A37] via-[#0E5B44] to-[#146B50] p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#146B50]/40">
        
        {/* Subtle background mosque silhouette */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-20 pointer-events-none overflow-hidden mix-blend-overlay hidden md:block">
          <img
            src="/og-image.jpg"
            alt="Pesantren"
            className="w-full h-full object-cover object-right"
          />
        </div>

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 text-white">
            <BookOpen className="w-5 h-5 text-[#D6A84F]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
              Mulai absensi hari ini dan raih streak berturut-turut, {firstName.toUpperCase()}!
            </h4>
            <p className="text-[11px] text-emerald-100/70 truncate mt-0.5">
              Pondok Pesantren Nurul Falah - Ketintang, Surabaya
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0 self-end sm:self-center">
          <Link
            href="/santri/absensi"
            className="px-4 py-2 rounded-full bg-[#D7EFE5] hover:bg-white text-[#0B4A37] font-black text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Semangat!</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── RAPORT MUTABAAH BULANAN MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isRaportOpen && (
        <RaportSantriModal
          initialStudentId={currentUser.id}
          onClose={() => setIsRaportOpen(false)}
        />
      )}

    </div>
  );
}
