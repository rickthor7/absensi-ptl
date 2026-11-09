import { Activity } from '@/types';

/**
 * Schedule evaluation engine for Santri activities
 * Strictly operates in Indonesian Time (WIB / Asia/Jakarta, UTC+7)
 * Supports midnight-crossing activities and timezone-independent calculations
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

export interface ActiveActivityResult {
  activeActivity: Activity | null;
  status: 'open' | 'closed';
  timeRemainingMinutes?: number;
  nextActivity?: Activity | null;
  conflictingActivities?: Activity[];
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
 * Finds the currently active activity, or the next upcoming activity today.
 * Evaluated strictly in Asia/Jakarta (WIB) time.
 */
export function determineActiveActivity(
  activities: Activity[],
  currentDate: Date
): ActiveActivityResult {
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
 * Formats a date into Indonesian locale string: "Senin, 9 November 2026"
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
 * Returns activities that are scheduled and active on a specific date (matching ISO day of week 1=Senin..7=Ahad).
 * Evaluated strictly in Asia/Jakarta (WIB) time.
 * If none match or active_days is not configured, gracefully falls back to all active activities.
 */
export function getActivitiesForDate(activities: Activity[], date: Date): Activity[] {
  if (!activities || activities.length === 0) return [];
  const isoDay = getIsoDayOfWeek(date);
  const matching = activities.filter(
    (act) => act.is_active && Array.isArray(act.active_days) && act.active_days.includes(isoDay)
  );
  return matching.length > 0 ? matching : activities.filter((act) => act.is_active);
}
