import { Activity, AttendanceSession } from '@/types';

/**
 * Schedule evaluation engine for Santri activities
 * Strictly operates in Indonesian Time (WIB / Asia/Jakarta, UTC+7)
 * Supports dynamic Musyrif-controlled sessions, countdown timers, and multi-session activities.
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

export interface ActiveActivityResult {
  activeActivity: Activity | null;
  status: 'open' | 'closed';
  timeRemainingMinutes?: number;
  nextActivity?: Activity | null;
  conflictingActivities?: Activity[];
  activeSession?: AttendanceSession | null;
  allActiveSessions?: AttendanceSession[];
}

/**
 * Safely converts any Date, string, number or undefined into a valid Date object.
 * Prevents "TypeError: ...getDate is not a function" errors.
 */
export function getSafeDate(date?: Date | string | number | null): Date {
  if (!date) return new Date();
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Extracts hour (0-23), minute (0-59), and ISO day of week (1=Senin..7=Ahad)
 * strictly in Asia/Jakarta (WIB) timezone, regardless of the host/browser local timezone.
 */
export function getWibTimeParts(date: Date | string | number): {
  hours: number;
  minutes: number;
  seconds: number;
  dayOfWeek: number;
} {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return { hours: 0, minutes: 0, seconds: 0, dayOfWeek: 1 };
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIMEZONE,
    weekday: 'short', // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let weekdayStr = 'Mon';

  for (const part of parts) {
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
    if (part.type === 'second') seconds = parseInt(part.value, 10);
    if (part.type === 'weekday') weekdayStr = part.value;
  }

  // Handle midnight 24 edge case in some JS engines
  if (hours === 24) hours = 0;

  const dayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return {
    hours,
    minutes,
    seconds,
    dayOfWeek: dayMap[weekdayStr] || 1,
  };
}

/**
 * Converts a time string "HH:mm" into minutes from start of day (0 to 1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Returns ISO day of week (1=Senin, ..., 7=Ahad) evaluated in WIB (Asia/Jakarta)
 */
export function getIsoDayOfWeek(date: Date): number {
  return getWibTimeParts(date).dayOfWeek;
}

/**
 * Memeriksa apakah suatu sesi presensi sedang aktif (status 'open' dan belum melewati closes_at).
 */
export function isSessionActive(
  session: AttendanceSession | null | undefined,
  currentDate: Date | string | number
): boolean {
  if (!session || session.status !== 'open') return false;
  const d = currentDate instanceof Date ? currentDate : new Date(currentDate);
  if (isNaN(d.getTime())) return false;

  const closesAt = new Date(session.closes_at);
  if (isNaN(closesAt.getTime())) return false;

  return d.getTime() <= closesAt.getTime();
}

/**
 * Menghitung sisa detik sebelum sesi presensi ditutup otomatis.
 * Bernilai 0 jika sesi sudah ditutup atau melewati batas closes_at.
 */
export function getSessionRemainingSeconds(
  session: AttendanceSession | null | undefined,
  currentDate: Date | string | number
): number {
  if (!session || session.status !== 'open') return 0;
  const d = currentDate instanceof Date ? currentDate : new Date(currentDate);
  const closesAt = new Date(session.closes_at);
  if (isNaN(d.getTime()) || isNaN(closesAt.getTime())) return 0;

  const diffMs = closesAt.getTime() - d.getTime();
  return diffMs > 0 ? Math.floor(diffMs / 1000) : 0;
}

/**
 * Format countdown timer sisa detik menjadi format "MM:SS" atau "HH:MM:SS" (misal: "44:12" atau "01:29:50").
 */
export function formatCountdownTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Mengambil seluruh sesi yang sedang aktif / dibuka oleh Musyrif pada saat ini.
 * Mendukung multi-sesi aktif secara bersamaan (misal: Isya + Setoran Malam).
 */
export function getActiveAttendanceSessions(
  sessions: AttendanceSession[],
  currentDate: Date | string | number
): AttendanceSession[] {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];
  const d = currentDate instanceof Date ? currentDate : new Date(currentDate);
  return sessions.filter((s) => isSessionActive(s, d));
}

/**
 * Evaluates whether an activity is currently within its operational attendance window.
 * Evaluated strictly in Asia/Jakarta (WIB) time.
 */
export function isActivityActiveAt(
  activity: Activity,
  currentDate: Date
): { isActive: boolean; timeRemainingMinutes: number } {
  if (!activity.is_active) {
    return { isActive: false, timeRemainingMinutes: 0 };
  }

  const { hours, minutes, dayOfWeek: currentIsoDay } = getWibTimeParts(currentDate);
  const currentMinutes = hours * 60 + minutes;

  const startMinutes = timeStringToMinutes(activity.start_time);
  const endMinutes = timeStringToMinutes(activity.end_time);

  // If activity crosses midnight (e.g., 23:30 to 01:30 or 23:00 to 03:00)
  if (activity.crosses_midnight || endMinutes < startMinutes) {
    // Current time is before midnight (e.g., 23:45)
    if (currentMinutes >= startMinutes) {
      if (activity.active_days.includes(currentIsoDay)) {
        const remaining = 1440 - currentMinutes + endMinutes;
        return { isActive: true, timeRemainingMinutes: remaining };
      }
    }
    // Current time is after midnight (e.g., 00:30)
    if (currentMinutes <= endMinutes) {
      // It belonged to yesterday's active days
      const yesterdayIsoDay = currentIsoDay === 1 ? 7 : currentIsoDay - 1;
      if (activity.active_days.includes(yesterdayIsoDay)) {
        const remaining = endMinutes - currentMinutes;
        return { isActive: true, timeRemainingMinutes: remaining };
      }
    }
  } else {
    // Standard daytime activity (start <= current <= end)
    if (
      activity.active_days.includes(currentIsoDay) &&
      currentMinutes >= startMinutes &&
      currentMinutes <= endMinutes
    ) {
      const remaining = endMinutes - currentMinutes;
      return { isActive: true, timeRemainingMinutes: remaining };
    }
  }

  return { isActive: false, timeRemainingMinutes: 0 };
}

/**
 * Menentukan kegiatan aktif saat ini.
 * Jika `sessions` disediakan, penentu utama adalah sesi yang SEDANG DIBUKA oleh Musyrif.
 * Mendukung multi-sesi aktif secara paralel.
 */
export function determineActiveActivity(
  activities: Activity[],
  currentDate: Date,
  sessions?: AttendanceSession[]
): ActiveActivityResult {
  // 1. Jika sessions diberikan, evaluasi berdasarkan sesi real yang dibuka Musyrif
  if (Array.isArray(sessions)) {
    const activeSessions = getActiveAttendanceSessions(sessions, currentDate);
    if (activeSessions.length > 0) {
      const matchedActivities: Activity[] = [];
      for (const sess of activeSessions) {
        const act = activities.find((a) => a.id === sess.activity_id);
        if (act && !matchedActivities.some((m) => m.id === act.id)) {
          matchedActivities.push(act);
        }
      }

      if (matchedActivities.length > 0) {
        const primarySession = activeSessions[0];
        const primaryActivity = matchedActivities[0];
        const remSeconds = getSessionRemainingSeconds(primarySession, currentDate);

        return {
          activeActivity: primaryActivity,
          status: 'open',
          timeRemainingMinutes: Math.ceil(remSeconds / 60),
          conflictingActivities: matchedActivities.length > 1 ? matchedActivities : undefined,
          activeSession: primarySession,
          allActiveSessions: activeSessions,
        };
      }
    }

    // Jika Musyrif belum membuka sesi apa pun untuk hari ini, status adalah closed (dianggap libur/belum dibuka)
    const { hours, minutes, dayOfWeek: currentIsoDay } = getWibTimeParts(currentDate);
    const currentMinutes = hours * 60 + minutes;

    const upcoming = activities
      .filter((act) => act.is_active && act.active_days.includes(currentIsoDay))
      .map((act) => ({
        activity: act,
        startDiff: timeStringToMinutes(act.start_time) - currentMinutes,
      }))
      .filter((item) => item.startDiff > 0)
      .sort((a, b) => a.startDiff - b.startDiff);

    return {
      activeActivity: null,
      status: 'closed',
      nextActivity: upcoming.length > 0 ? upcoming[0].activity : null,
      activeSession: null,
      allActiveSessions: [],
    };
  }

  // 2. Fallback: evaluasi jadwal standar jika sessions tidak diberikan
  const matching: { activity: Activity; timeRemainingMinutes: number }[] = [];

  for (const act of activities) {
    const res = isActivityActiveAt(act, currentDate);
    if (res.isActive) {
      matching.push({ activity: act, timeRemainingMinutes: res.timeRemainingMinutes });
    }
  }

  if (matching.length > 0) {
    return {
      activeActivity: matching[0].activity,
      status: 'open',
      timeRemainingMinutes: matching[0].timeRemainingMinutes,
      conflictingActivities: matching.length > 1 ? matching.map((m) => m.activity) : undefined,
    };
  }

  // Find next upcoming activity
  const { hours, minutes, dayOfWeek: currentIsoDay } = getWibTimeParts(currentDate);
  const currentMinutes = hours * 60 + minutes;

  const upcoming = activities
    .filter((act) => act.is_active && act.active_days.includes(currentIsoDay))
    .map((act) => ({
      activity: act,
      startDiff: timeStringToMinutes(act.start_time) - currentMinutes,
    }))
    .filter((item) => item.startDiff > 0)
    .sort((a, b) => a.startDiff - b.startDiff);

  return {
    activeActivity: null,
    status: 'closed',
    nextActivity: upcoming.length > 0 ? upcoming[0].activity : null,
  };
}

/**
 * Format jam tegas 24 jam "HH:mm" atau "HH:mm:ss" di zona waktu Indonesia (WIB - Asia/Jakarta).
 * Menjamin tidak ada format 12 jam (AM/PM) dan tidak terpengaruh timezone UTC perangkat pengguna.
 */
export function formatTime24(
  date: Date | string | number | null | undefined,
  includeSeconds = false
): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WIB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  });

  return formatter.format(d);
}

/**
 * Mengambil tanggal standar "YYYY-MM-DD" dalam zona waktu Indonesia (WIB - Asia/Jakarta).
 * Menghindari bug UTC di mana sebelum jam 07:00 pagi tanggalnya mundur ke hari kemarin.
 */
export function getWibDateStr(date?: Date | string | number | null): string {
  const d = date ? (date instanceof Date ? date : new Date(date)) : new Date();
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Formats a date into Indonesian locale string: "Senin, 10 November 2026"
 * Mengunci zona waktu ke Asia/Jakarta (WIB) sehingga selalu konsisten dengan tanggal Indonesia.
 */
export function formatIndonesianDate(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Approximate Hijri calendar converter for decorative header
 * Mengunci zona waktu ke Asia/Jakarta (WIB).
 */
export function getEstimatedHijriDate(date: Date): string {
  try {
    const intl = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      timeZone: WIB_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return intl.format(date) + ' H';
  } catch {
    return '1448 H';
  }
}

/**
 * Checks whether an activity is a Tahfidz / Setoran activity (Pagi / Malam)
 */
export function isTahfidzActivity(activity?: { code?: string; name?: string } | null): boolean {
  if (!activity) return false;
  const code = (activity.code || '').toUpperCase();
  const name = (activity.name || '').toLowerCase();
  return (
    code === 'SETORAN_PAGI' ||
    code === 'SETORAN_MALAM' ||
    code.includes('SETORAN') ||
    code.includes('TAHFIDZ') ||
    name.includes('setoran') ||
    name.includes('tahfidz')
  );
}

/**
 * Memeriksa apakah suatu kegiatan aktif dan terjadwal pada tanggal tertentu di zona WIB.
 * Mengonversi active_days ke angka dan mencocokkan dengan ISO day (1=Senin..7=Ahad).
 */
export function isActivityScheduledOnDate(
  activity: Activity | null | undefined,
  date: Date | string | number
): boolean {
  if (!activity || !activity.is_active) return false;
  if (!Array.isArray(activity.active_days) || activity.active_days.length === 0) return false;

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;

  const isoDay = getIsoDayOfWeek(d);
  return activity.active_days.map(Number).includes(Number(isoDay));
}

/**
 * Returns activities that are scheduled and active on a specific date (matching ISO day of week 1=Senin..7=Ahad).
 * Evaluated strictly in Asia/Jakarta (WIB) time.
 * Pastikan HANYA mengembalikan kegiatan yang aktif di hari tersebut.
 * Tidak ada fallback ke semua kegiatan agar kegiatan hari khusus (misal: Ngaji Kitab Kuning hari Sabtu)
 * tidak bocor ke hari lain.
 */
export function getActivitiesForDate(
  activities: Activity[],
  date: Date | string | number
): Activity[] {
  if (!Array.isArray(activities) || activities.length === 0) return [];
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return [];

  const isoDay = getIsoDayOfWeek(d);
  return activities.filter((act) => {
    if (!act.is_active) return false;
    if (!Array.isArray(act.active_days) || act.active_days.length === 0) return false;
    return act.active_days.map(Number).includes(Number(isoDay));
  });
}
