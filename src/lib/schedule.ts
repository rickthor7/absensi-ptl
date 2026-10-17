import { Activity } from '@/types';

/**
 * Schedule evaluation engine for Santri activities
 * Supports Asia/Jakarta timezone and midnight-crossing activities
 */

export interface ActiveActivityResult {
  activeActivity: Activity | null;
  status: 'open' | 'closed';
  timeRemainingMinutes?: number;
  nextActivity?: Activity | null;
  conflictingActivities?: Activity[];
}

/**
 * Converts a time string "HH:mm" into minutes from start of day (0 to 1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Returns ISO day of week (1=Monday, ..., 7=Sunday)
 */
export function getIsoDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Evaluates whether an activity is currently within its operational attendance window.
 */
export function isActivityActiveAt(
  activity: Activity,
  currentDate: Date
): { isActive: boolean; timeRemainingMinutes: number } {
  if (!activity.is_active) {
    return { isActive: false, timeRemainingMinutes: 0 };
  }

  const currentIsoDay = getIsoDayOfWeek(currentDate);
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

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
  const currentIsoDay = getIsoDayOfWeek(currentDate);
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

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
 * Formats a date into Indonesian locale string: "Jumat, 9 Oktober 2026"
 */
export function formatIndonesianDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Approximate Hijri calendar converter for decorative header
 */
export function getEstimatedHijriDate(date: Date): string {
  // Approximate Hijri year calculation
  try {
    const intl = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
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
