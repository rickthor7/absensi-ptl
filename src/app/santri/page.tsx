'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate, formatTime24 } from '@/lib/schedule';
import {
  CheckCircle2,
  Calendar,
  History,
  AlertTriangle,
  Clock,
  ArrowRight,
  Camera,
  Check,
  CreditCard,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Flame,
  DoorOpen,
  HelpCircle,
  FileText,
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
  size = 76,
  strokeWidth = 6.5,
  color = '#0D7B5F',
  trackColor = '#E2E8E4',
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

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const tYear = effectiveTime.getFullYear();
  const tMonth = effectiveTime.getMonth();
  const tDay = effectiveTime.getDate();

  const gridCells = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    gridCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = year === tYear && month === tMonth && d === tDay;
    gridCells.push({
      day: d,
      isCurrentMonth: true,
      isToday,
    });
  }

  const remaining = (7 - (gridCells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return (
    <div className="bg-white dark:bg-[#0E1713] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0D7B5F]" />
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center pt-3 pb-1">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'].map((dayName, idx) => (
            <span
              key={dayName}
              className={`text-[10px] font-bold ${
                idx >= 5 ? 'text-rose-500' : 'text-stone-400'
              }`}
            >
              {dayName}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {gridCells.map((c, i) => (
            <div
              key={i}
              className={`py-1 text-xs rounded-lg transition-colors flex items-center justify-center font-medium ${
                c.isToday
                  ? 'bg-[#0D7B5F] text-white font-bold shadow-xs'
                  : c.isCurrentMonth
                  ? 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  : 'text-stone-300 dark:text-stone-600'
              }`}
            >
              {c.day}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-3 flex items-center justify-between text-[11px] text-stone-500">
        <span>Hari ini: {formatIndonesianDate(effectiveTime)}</span>
        <Link
          href="/santri/kalender"
          className="font-bold text-[#0D7B5F] dark:text-[#E0B45C] hover:underline"
        >
          Agenda &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function SantriDashboardPage() {
  const router = useRouter();
  const { currentUser, attendanceRecords, activities, effectiveTime } = useStore();
  const [isRaportOpen, setIsRaportOpen] = useState(false);

  const greeting = useMemo(() => getGreeting(effectiveTime), [effectiveTime]);
  const firstName = currentUser.nickname || currentUser.full_name?.split(' ')[0] || 'Santri';

  const currentSchedule = useMemo(() => {
    return determineActiveActivity(activities, effectiveTime);
  }, [activities, effectiveTime]);

  const activeActivity = currentSchedule.activeActivity;
  const isWindowOpen = currentSchedule.status === 'open' && !!activeActivity;

  const currentMonth = effectiveTime.getMonth();
  const currentYear = effectiveTime.getFullYear();

  const studentRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.student_id === currentUser.id);
  }, [attendanceRecords, currentUser.id]);

  const currentMonthRecords = useMemo(() => {
    return studentRecords.filter((r) => {
      const d = new Date(r.operational_date || r.submitted_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [studentRecords, currentMonth, currentYear]);

  const hadirCount = currentMonthRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinCount = currentMonthRecords.filter((r) => r.status === 'izin_disetujui').length;
  const alpaCount = currentMonthRecords.filter((r) => r.status === 'alpa').length;
  const reviewCount = currentMonthRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'perlu_tinjauan'
  ).length;

  const totalAssessed = hadirCount + izinCount + alpaCount;
  const attendanceRate = totalAssessed > 0 ? Math.round((hadirCount / totalAssessed) * 100) : 100;
  const isSafe = attendanceRate >= 70;

  const streak = useMemo(() => {
    let s = 0;
    const sorted = [...studentRecords].sort(
      (a, b) => new Date(b.operational_date).getTime() - new Date(a.operational_date).getTime()
    );
    for (const rec of sorted) {
      if (rec.status === 'hadir_valid') s++;
      else break;
    }
    return s;
  }, [studentRecords]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 1: EDITORIAL HERO BANNER ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left Card: Clean Forest Banner (Col 7) */}
        <div className="lg:col-span-7 bg-[#06241B] dark:bg-[#05140F] text-white rounded-2xl border border-[#0D382A] dark:border-[#142921] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            {/* Top row: Hijri date + WIB clock */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium text-emerald-200 border border-white/10">
                <span>{getEstimatedHijriDate(effectiveTime)}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono font-bold text-white border border-white/10">
                <Clock className="w-3.5 h-3.5 text-[#E0B45C]" />
                <span>{formatTime24(effectiveTime)}</span>
                <span className="text-[9px] text-emerald-300">WIB</span>
              </span>
            </div>

            {/* Title Greeting */}
            <div className="pt-1">
              <p className="text-xs text-emerald-300/90 font-medium">
                {greeting},
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                {firstName}
              </h1>
              <p className="text-xs text-stone-300 font-medium mt-1">
                {currentUser.full_name}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 font-mono text-[11px] font-bold text-emerald-200 border border-white/10">
                {currentUser.student_number || 'STR. SANTRI'}
              </span>

              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-[#E0B45C] font-bold text-[11px] border border-amber-500/30">
                Angkatan {currentUser.generation || '2026'}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                  isSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {isSafe ? 'Kehadiran Aman (≥ 70%)' : 'Peringatan Kehadiran'}
              </span>
            </div>
          </div>

          {/* 3 Metrics Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-5 mt-4 border-t border-white/10">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-black text-white">{hadirCount}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-300 mt-0.5">Hadir</div>
              <div className="text-[9px] text-stone-400">Bulan ini</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-black text-white">{izinCount}</div>
              <div className="text-[10px] uppercase font-bold text-amber-300 mt-0.5">Izin</div>
              <div className="text-[9px] text-stone-400">Disetujui</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#E0B45C]">{streak}</div>
              <div className="text-[10px] uppercase font-bold text-[#E0B45C] mt-0.5">Streak</div>
              <div className="text-[9px] text-stone-400">Hari Hadir</div>
            </div>
          </div>
        </div>

        {/* Right Card: Kegiatan & Status Sesi Presensi (Col 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0E1713] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0D7B5F]" />
                <h2 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Sesi Presensi Terkini
                </h2>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isWindowOpen
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                {isWindowOpen ? 'Sesi Dibuka' : 'Sesi Ditutup'}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
                {activeActivity ? activeActivity.name : 'Tidak Ada Kegiatan Aktif'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                {activeActivity
                  ? `Jadwal resmi: ${activeActivity.start_time} - ${activeActivity.end_time} WIB`
                  : 'Saat ini belum ada sesi presensi yang sedang berlangsung. Pantau agenda harian pondok.'}
              </p>
            </div>

            {activeActivity && (
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Radius Lokasi:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    Maks {activeActivity.radius_m} Meter dari Masjid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Metode Validasi:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Selfie Wajah &amp; Koordinat GPS
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2">
            <Link
              href="/santri/absensi"
              className="w-full py-3 px-4 rounded-xl bg-[#0D7B5F] hover:bg-[#0A664E] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 btn-press"
            >
              <Camera className="w-4 h-4 text-emerald-200" />
              <span>{isWindowOpen ? 'Buka Kamera & Absen Sekarang' : 'Buka Halaman Presensi & Izin'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 2: 4 QUICK NAVIGATION CARDS ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Absen Kamera */}
        <Link
          href="/santri/absensi"
          className="clean-card clean-card-hover p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D7B5F] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Presensi
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Selfie &amp; GPS
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0D7B5F] transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 2: Kalender */}
        <Link
          href="/santri/kalender"
          className="clean-card clean-card-hover p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Kalender
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Jadwal &amp; Agenda
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 3: Riwayat */}
        <Link
          href="/santri/riwayat"
          className="clean-card clean-card-hover p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Riwayat
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Catatan Presensi
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-sky-600 transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 4: SPP */}
        <Link
          href="/santri/spp"
          className="clean-card clean-card-hover p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                SPP Santri
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Administrasi Kas
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 transition shrink-0 hidden sm:block" />
        </Link>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 3: DETAILED SUMMARY GRID ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* COL 1: Ringkasan Kehadiran Donut (lg:col-span-4) */}
        <div className="lg:col-span-4 clean-card p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Ringkasan Kehadiran
              </h3>
              <button
                type="button"
                onClick={() => setIsRaportOpen(true)}
                className="text-xs font-bold text-[#0D7B5F] dark:text-[#E0B45C] hover:underline"
              >
                Lihat Raport
              </button>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative shrink-0 flex items-center justify-center">
                <DonutRing value={attendanceRate} size={76} strokeWidth={6.5} color="#0D7B5F" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-stone-900 dark:text-white">
                    {attendanceRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Target Kehadiran Bulanan
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isSafe
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {isSafe ? 'Status: Memenuhi Syarat' : 'Status: Kurang dari 70%'}
                </span>
                <p className="text-[11px] text-stone-400">
                  Berdasarkan seluruh sesi mutabaah wajib pondok bulan ini.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 text-center">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{hadirCount}</div>
              <div className="text-[10px] text-stone-500 font-medium">Hadir</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400">{izinCount}</div>
              <div className="text-[10px] text-stone-500 font-medium">Izin</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-rose-700 dark:text-rose-400">{alpaCount}</div>
              <div className="text-[10px] text-stone-500 font-medium">Alpa</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-sky-700 dark:text-sky-400">{reviewCount}</div>
              <div className="text-[10px] text-stone-500 font-medium">Review</div>
            </div>
          </div>
        </div>

        {/* COL 2: Riwayat Terkini (lg:col-span-4) */}
        <div className="lg:col-span-4 clean-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0D7B5F]" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Riwayat Presensi Terkini
                </h3>
              </div>
              <Link
                href="/santri/riwayat"
                className="text-xs font-bold text-[#0D7B5F] dark:text-[#E0B45C] hover:underline"
              >
                Semua &rarr;
              </Link>
            </div>

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
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-800 dark:text-stone-200 truncate">
                          {rec.activity_name || 'Kegiatan Pondok'}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {rec.operational_date} • {formatTime24(rec.submitted_at)} WIB
                        </p>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border truncate ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        {meta.label.split('—')[0].split('(')[0].trim()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-2 text-right">
            <Link
              href="/santri/riwayat"
              className="text-xs font-bold text-stone-500 hover:text-[#0D7B5F] transition"
            >
              Lihat selengkapnya &rarr;
            </Link>
          </div>
        </div>

        {/* COL 3: Mini Kalender (lg:col-span-4) */}
        <div className="lg:col-span-4">
          <MiniCalendarWidget effectiveTime={effectiveTime} />
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
