'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import {
  determineActiveActivity,
  formatIndonesianDate,
  formatTime24,
  getWibDateStr,
  getActivitiesForDate,
  getActiveAttendanceSessions,
  getSessionRemainingSeconds,
  formatCountdownTimer,
  getSafeDate,
  isTahfidzActivity,
} from '@/lib/schedule';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import PermissionReviewModal from '@/components/attendance/PermissionReviewModal';
import CorrectionModal from '@/components/attendance/CorrectionModal';
import { AttendanceRecord } from '@/types';
import { calculateMonthlyScores } from '@/lib/scoring';
import {
  CheckCircle2,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  BarChart3,
  Crosshair,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  DoorOpen,
  BookOpen,
} from 'lucide-react';
import GeotagLocationModal from '@/components/schedule/GeotagLocationModal';
import RaportSantriModal from '@/components/reports/RaportSantriModal';

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
  const safeTime = getSafeDate(effectiveTime);
  const [viewDate, setViewDate] = useState(
    () => new Date(safeTime.getFullYear(), safeTime.getMonth(), 1)
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

  const tYear = safeTime.getFullYear();
  const tMonth = safeTime.getMonth();
  const tDay = safeTime.getDate();

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

      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-3 flex items-center justify-between gap-2 text-[11px] text-stone-500">
        <span className="truncate">Hari ini: {formatIndonesianDate(effectiveTime)}</span>
        <Link
          href="/musyrif/kegiatan"
          className="font-bold text-[#0D7B5F] dark:text-[#E0B45C] hover:underline shrink-0"
        >
          Kegiatan &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function MusyrifDashboardPage() {
  const {
    currentUser,
    attendanceRecords,
    activities,
    attendanceSessions,
    openAttendanceSession,
    closeAttendanceSession,
    profiles,
    effectiveTime,
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

  // State durasi sesi yang dipilih musyrif per kegiatan (30, 60, 90, 120 menit)
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});
  const [sessionActionNotice, setSessionActionNotice] = useState<string | null>(null);

  const todayStr = getWibDateStr(effectiveTime);
  const santriList = profiles.filter((p) => p.role === 'santri' && p.is_active);

  // Seluruh kegiatan resmi pondok yang aktif ditampilkan di kontrol Musyrif agar dapat dibuka kapan saja
  const activitiesForMusyrifControl = React.useMemo(() => {
    const active = activities.filter((a) => a.is_active);
    return active.length > 0 ? active : activities;
  }, [activities]);

  // Durasi default: Setoran (Tahfidz) default 120 menit, kegiatan lainnya 60 menit
  const getDefaultDurationForActivity = (act: import('@/types').Activity): number => {
    if (isTahfidzActivity(act)) {
      return 120;
    }
    return 60;
  };

  // Sesi yang sedang dibuka Musyrif (mendukung multi-sesi aktif)
  const activeSessions = React.useMemo(() => {
    return getActiveAttendanceSessions(attendanceSessions, effectiveTime);
  }, [attendanceSessions, effectiveTime]);

  const activeResult = determineActiveActivity(activities, effectiveTime, attendanceSessions);
  const activeActivity = activeResult.activeActivity;
  const isWindowOpen = activeSessions.length > 0;

  const handleOpenSession = async (activityId: string) => {
    const act = activities.find((a) => a.id === activityId);
    const defaultDur = act ? getDefaultDurationForActivity(act) : 60;
    const duration = selectedDurations[activityId] || defaultDur;
    const res = await openAttendanceSession({ activityId, durationMinutes: duration });
    setSessionActionNotice(res.message);
    setTimeout(() => setSessionActionNotice(null), 5000);
  };

  const handleCloseSession = async (sessionId: string) => {
    const res = await closeAttendanceSession(sessionId);
    setSessionActionNotice(res.message);
    setTimeout(() => setSessionActionNotice(null), 5000);
  };

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

  // Monthly stats
  const currentMonthKey = getWibDateStr(effectiveTime).substring(0, 7);
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

  const h = effectiveTime.getHours();
  const greeting =
    h < 5 ? 'Selamat Malam' : h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 19 ? 'Selamat Sore' : 'Selamat Malam';

  return (
    <div className="space-y-6 pb-12">
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 1: HERO CARD + MONITORING SESI WIDGET ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT HERO CARD (Col 7) */}
        <div className="lg:col-span-7 bg-[#06241B] dark:bg-[#05140F] text-white rounded-2xl border border-[#0D382A] dark:border-[#142921] p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            {/* Top row: Tanggal Indonesia & WIB clock */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium text-emerald-200 border border-white/10 w-fit">
                <Calendar className="w-3.5 h-3.5 text-[#E0B45C] shrink-0" />
                <span className="truncate">{formatIndonesianDate(effectiveTime)}</span>
              </span>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsGeotagModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-700/50 hover:bg-emerald-700 text-white text-[11px] font-bold border border-emerald-500/30 transition cursor-pointer active:scale-95"
                  title="Atur Radius & Geotag GPS Pondok"
                >
                  <Crosshair className="w-3.5 h-3.5 text-[#E0B45C] shrink-0" />
                  <span>Geotag GPS</span>
                </button>

                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono font-bold text-white border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#E0B45C] shrink-0" />
                  <span>{formatTime24(effectiveTime)}</span>
                  <span className="text-[9px] text-emerald-300 font-semibold">WIB</span>
                </span>
              </div>
            </div>

            {/* Greeting & Title */}
            <div className="pt-1">
              <p className="text-xs text-emerald-300/90 font-medium">
                {greeting},
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                Ustadz {ustadzName}
              </h1>
              <p className="text-xs text-stone-300 font-medium mt-1">
                {currentUser.full_name} • Musyrif Pengasuhan Pondok
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 font-bold text-[11px] text-emerald-200 border border-white/10 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#E0B45C]" />
                <span>Dewan Asatidz</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-md bg-white/10 font-bold text-[11px] text-stone-200 border border-white/10">
                {currentUser.group_name || 'Asrama Nurul Falah'}
              </span>
            </div>
          </div>

          {/* 3 Metrics Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-5 mt-4 border-t border-white/10">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-lg sm:text-2xl font-black text-white">{santriList.length}</div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300 mt-0.5">Santri Aktif</div>
              <div className="text-[8px] sm:text-[9px] text-stone-400">Total Binaan</div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-lg sm:text-2xl font-black text-white">{hadirValidToday}</div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300 mt-0.5">Hadir</div>
              <div className="text-[8px] sm:text-[9px] text-stone-400">Hari ini</div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-lg sm:text-2xl font-black text-[#E0B45C]">{izinMenungguToday}</div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-[#E0B45C] mt-0.5">Menunggu</div>
              <div className="text-[8px] sm:text-[9px] text-stone-400">Izin Diajukan</div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: KONTROL & MONITORING SESI ABSENSI (Col 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0E1713] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-[#0D7B5F] shrink-0" />
                <h2 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 truncate">
                  Kontrol Sesi Presensi
                </h2>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 whitespace-nowrap ${
                  isWindowOpen
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                {isWindowOpen ? `${activeSessions.length} Sesi Terbuka` : 'Semua Sesi Ditutup'}
              </span>
            </div>

            {/* Notice banner alert */}
            {sessionActionNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sessionActionNotice}</span>
              </div>
            )}

            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
                Musyrif memegang kendali penuh sesi presensi. Jika sesi tidak dibuka, kegiatan dianggap <strong>libur</strong> dan santri tidak dihitung alpa.
              </p>

              {/* List Kegiatan dengan Kontrol Buka/Tutup Sesi (Termasuk Kitab Kuning) */}
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                {activitiesForMusyrifControl.length > 0 ? (
                  activitiesForMusyrifControl.map((act) => {
                    // Cari sesi aktif hari ini untuk kegiatan ini
                    const liveSession = activeSessions.find((s) => s.activity_id === act.id);
                    const closedSession = attendanceSessions.find(
                      (s) => s.activity_id === act.id && s.operational_date === todayStr && s.status === 'closed'
                    );

                    const remSeconds = liveSession ? getSessionRemainingSeconds(liveSession, effectiveTime) : 0;
                    const timerText = formatCountdownTimer(remSeconds);

                    const attendedCount = todayRecords.filter(
                      (r) => r.activity_id === act.id && r.status === 'hadir_valid'
                    ).length;

                    const defaultDur = getDefaultDurationForActivity(act);
                    const curDuration = selectedDurations[act.id] ?? defaultDur;

                    return (
                      <div
                        key={act.id}
                        className={`p-3 rounded-xl border transition-all ${
                          liveSession
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/70'
                            : 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                                {act.name}
                              </h4>
                              {liveSession && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono">
                              Jadwal: {act.start_time} - {act.end_time} WIB
                            </span>
                          </div>

                          {liveSession ? (
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>{timerText}</span>
                              </span>
                              <span className="text-[10px] text-stone-500">
                                {attendedCount} santri hadir
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400">
                              {closedSession ? 'Selesai' : 'Libur'}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons & Duration Selector */}
                        <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/50 flex flex-wrap items-center justify-between gap-2">
                          {liveSession ? (
                            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between w-full gap-2">
                              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                                Sesi sedang aktif ({liveSession.duration_minutes} mnt)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCloseSession(liveSession.id)}
                                className="w-full xs:w-auto px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              >
                                <span>Tutup Sesi Sekarang</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
                              {/* Duration Selector Dropdown */}
                              <div className="flex items-center justify-between sm:justify-start gap-1.5">
                                <span className="text-[10px] text-stone-500 font-medium">Durasi:</span>
                                <select
                                  value={curDuration}
                                  onChange={(e) =>
                                    setSelectedDurations((prev) => ({
                                      ...prev,
                                      [act.id]: Number(e.target.value),
                                    }))
                                  }
                                  className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none"
                                >
                                  <option value={30}>30 Menit</option>
                                  <option value={60}>60 Menit</option>
                                  <option value={90}>90 Menit</option>
                                  <option value={120}>120 Menit</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenSession(act.id)}
                                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-[#0D7B5F] hover:bg-[#0A664E] text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                              >
                                <span>Buka Sesi ({curDuration} mnt)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-stone-500">
                    Tidak ada kegiatan yang terjadwal hari ini.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 flex flex-col sm:flex-row gap-2">
            <Link
              href="/musyrif/absensi"
              className="flex-1 py-3 px-4 rounded-xl bg-[#0D7B5F] hover:bg-[#0A664E] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 btn-press"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>Edit Presensi (Sesi &amp; Santri)</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>

            <Link
              href="/musyrif/laporan"
              className="py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Rekap Laporan</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 2: 5 QUICK NAVIGATION CARDS ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Data Santri */}
        <Link
          href="/musyrif/santri"
          className="clean-card clean-card-hover p-3.5 sm:p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D7B5F] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Data Santri
              </h4>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {santriList.length} Santri Aktif
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0D7B5F] transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 2: Perizinan */}
        <Link
          href="/musyrif/perizinan"
          className="clean-card clean-card-hover p-3.5 sm:p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                  Perizinan
                </h4>
                {izinMenungguToday > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {izinMenungguToday} Menunggu
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 3: Tahfidz */}
        <Link
          href="/musyrif/tahfidz"
          className="clean-card clean-card-hover p-3.5 sm:p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D7B5F] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Tahfidz
              </h4>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                Setoran &amp; WA
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 4: Edit Presensi */}
        <Link
          href="/musyrif/absensi"
          className="clean-card clean-card-hover p-3.5 sm:p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0D7B5F] dark:text-teal-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Edit Presensi
              </h4>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Per Sesi &amp; Santri
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0D7B5F] transition shrink-0 hidden sm:block" />
        </Link>

        {/* Card 5: Keuangan SPP (Spans full width across 2 cols on mobile) */}
        <Link
          href="/musyrif/keuangan"
          className="col-span-2 sm:col-span-1 clean-card clean-card-hover p-3.5 sm:p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Data SPP
              </h4>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Kas &amp; Rekening Pondok
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 transition shrink-0 hidden sm:block" />
        </Link>

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ROW 3: DETAILED INFORMATION GRID ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* COL 1: Ringkasan Kedisiplinan Pondok (lg:col-span-4) */}
        <div className="lg:col-span-4 clean-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Kedisiplinan Pondok
              </h3>
              <Link
                href="/musyrif/laporan"
                className="text-xs font-bold text-[#0D7B5F] dark:text-[#E0B45C] hover:underline"
              >
                Raport Bulanan &rarr;
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative shrink-0 flex items-center justify-center">
                <DonutRing
                  value={monthlyStats.averageScorePercentage}
                  size={76}
                  strokeWidth={6.5}
                  color="#0D7B5F"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-stone-900 dark:text-white">
                    {monthlyStats.averageScorePercentage}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Rata-rata Mutaba&apos;ah Santri
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    monthlyStats.averageScorePercentage >= 70
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {monthlyStats.averageScorePercentage >= 70 ? 'Target Tercapai (≥ 70%)' : 'Perlu Pendampingan'}
                </span>
                <p className="text-[11px] text-stone-400">
                  Akumulasi seluruh santri aktif bulan ini.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 text-center">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{totalHadirMonth}</div>
              <div className="text-[10px] text-stone-500 font-medium">Hadir</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400">{totalIzinMonth}</div>
              <div className="text-[10px] text-stone-500 font-medium">Izin</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-rose-700 dark:text-rose-400">{totalAlpaMonth}</div>
              <div className="text-[10px] text-stone-500 font-medium">Alpa</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <div className="text-sm font-bold text-sky-700 dark:text-sky-400">{masalahToday}</div>
              <div className="text-[10px] text-stone-500 font-medium">Review</div>
            </div>
          </div>
        </div>

        {/* COL 2: Perlu Ditinjau Segera (lg:col-span-4) */}
        <div className="lg:col-span-4 clean-card p-4 sm:p-5 flex flex-col justify-between">
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
                className="text-xs font-bold text-[#0D7B5F] dark:text-[#E0B45C] hover:underline"
              >
                Kelola Semua &rarr;
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
                    className="py-2.5 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-stone-800 dark:text-stone-200 truncate">
                        {rec.student_name}
                      </p>
                      <p className="text-[10px] text-stone-400 truncate">
                        {rec.activity_name} • {rec.permission_reason || 'Izin diajukan'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReviewRecord(rec)}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#0D7B5F] hover:bg-[#0A664E] text-white transition cursor-pointer active:scale-95"
                    >
                      Tinjau
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-2 text-right">
            <Link
              href="/musyrif/perizinan"
              className="text-xs font-bold text-stone-500 hover:text-[#0D7B5F] transition"
            >
              Lihat selengkapnya &rarr;
            </Link>
          </div>
        </div>

        {/* COL 3: Mini Kalender Kegiatan (lg:col-span-4) */}
        <div className="lg:col-span-4">
          <MiniCalendarWidget effectiveTime={effectiveTime} />
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
