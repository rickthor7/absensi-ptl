import { AttendanceRecord, Profile, Activity } from '@/types';
import {
  getActivitiesForDate,
  getWibDateStr,
  getWibTimeParts,
  timeStringToMinutes,
} from '@/lib/schedule';

export interface ActivityBreakdown {
  activityId: string;
  activityName: string;
  activityCode: string;
  hadir: number;
  izin: number;
  alpa: number;
  score: number;
  sessions: number;
  percentage: number;
}

export interface StudentMonthlyScore {
  student: Profile;
  hadirCount: number;      // Bobot 1
  izinCount: number;       // Bobot 0.5
  alpaCount: number;       // Bobot 0
  totalSessions: number;
  totalScore: number;      // (hadir * 1) + (izin * 0.5)
  scorePercentage: number; // (totalScore / totalSessions) * 100
  isWarning: boolean;      // scorePercentage < 70
  activityScores: Record<string, ActivityBreakdown>;
}

export interface GlobalMonthlyStats {
  monthKey: string;             // e.g. "2026-10"
  monthLabel: string;           // e.g. "Oktober 2026"
  totalStudents: number;
  averageScorePercentage: number;
  warningCount: number;
  tierSangatBaikCount: number;  // >= 85%
  tierCukupCount: number;       // 70% - 84.9%
  tierPeringatanCount: number;  // < 70%
  activityStats: {
    activityId: string;
    activityName: string;
    activityCode: string;
    hadirCount: number;
    izinCount: number;
    alpaCount: number;
    totalSessions: number;
    averageScore: number;
    rate: number;
  }[];
  studentScores: StudentMonthlyScore[];
  warningStudents: StudentMonthlyScore[];
}

/**
 * Menghitung nilai skor absensi bulanan berdasarkan bobot PRD:
 * - Hadir = 1 poin
 * - Izin = 0.5 poin
 * - Alpa / Ditolak / Tidak Absen = 0 poin
 * Aturan: Jika santri tidak melakukan presensi pada jadwal kegiatan yang telah berlalu,
 * otomatis dihitung sebagai ALPA.
 */
export function calculateMonthlyScores(
  profiles: Profile[],
  activities: Activity[],
  attendanceRecords: AttendanceRecord[],
  monthFilter: string, // Format "YYYY-MM", e.g. "2026-10"
  effectiveTimeOverride?: Date
): GlobalMonthlyStats {
  const santriList = profiles.filter((p) => p.role === 'santri');

  // Filter record sesuai bulan
  const monthRecords = attendanceRecords.filter((r) =>
    r.operational_date?.startsWith(monthFilter)
  );

  // Month label in Indonesian
  const [yearStr, monthStr] = monthFilter.split('-');
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthLabel = `${monthNames[monthIndex] || monthStr} ${yearStr}`;

  // Tentukan batas hari yang telah lewat di bulan ini dalam waktu WIB
  const now = effectiveTimeOverride || new Date();
  const currentWibStr = getWibDateStr(now);
  const currentMonthWib = currentWibStr.substring(0, 7);
  const currentWibTime = getWibTimeParts(now);
  const currentMinutesWib = currentWibTime.hours * 60 + currentWibTime.minutes;

  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const totalDaysInMonth = new Date(y, m, 0).getDate();

  // Hari-hari yang telah lewat atau sedang berjalan dalam bulan filter
  let maxDayToCheck = 0;
  if (monthFilter < currentMonthWib) {
    maxDayToCheck = totalDaysInMonth; // Bulan lampau: seluruh hari dihitung
  } else if (monthFilter === currentMonthWib) {
    maxDayToCheck = parseInt(currentWibStr.substring(8, 10), 10); // Bulan berjalan: hingga hari ini
  } else {
    maxDayToCheck = 0; // Bulan masa depan
  }

  // Bangun daftar sesi terjadwal lampau dalam bulan ini
  const pastSessionsInMonth: { dateStr: string; activity: Activity }[] = [];
  for (let d = 1; d <= maxDayToCheck; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${monthFilter}-${dayStr}`;
    const scheduledActs = getActivitiesForDate(activities, dateStr);

    for (const act of scheduledActs) {
      if (dateStr < currentWibStr) {
        // Tanggal kemarin atau sebelumnya: pasti sudah lewat
        pastSessionsInMonth.push({ dateStr, activity: act });
      } else if (dateStr === currentWibStr) {
        // Hari ini: sudah lewat jika waktu akhir kegiatan telah terlewati
        const endMinutes = timeStringToMinutes(act.end_time);
        if (endMinutes <= currentMinutesWib) {
          pastSessionsInMonth.push({ dateStr, activity: act });
        }
      }
    }
  }

  // Hitung skor per santri
  const studentScores: StudentMonthlyScore[] = santriList.map((st) => {
    const studentRecords = monthRecords.filter((r) => r.student_id === st.id);

    let hadirCount = 0;
    let izinCount = 0;
    let alpaCount = 0;

    const activityScores: Record<string, ActivityBreakdown> = {};
    activities.forEach((act) => {
      activityScores[act.id] = {
        activityId: act.id,
        activityName: act.name,
        activityCode: act.code,
        hadir: 0,
        izin: 0,
        alpa: 0,
        score: 0,
        sessions: 0,
        percentage: 100,
      };
    });

    // Set untuk menandai record presensi yang sudah dicocokkan dengan sesi terjadwal
    const matchedRecordIds = new Set<string>();

    // 1. Evaluasi seluruh sesi terjadwal yang telah lewat dalam bulan ini
    for (const session of pastSessionsInMonth) {
      const actId = session.activity.id;
      if (!activityScores[actId]) {
        activityScores[actId] = {
          activityId: actId,
          activityName: session.activity.name,
          activityCode: session.activity.code,
          hadir: 0,
          izin: 0,
          alpa: 0,
          score: 0,
          sessions: 0,
          percentage: 100,
        };
      }

      // Cari apakah santri memiliki record presensi pada sesi ini
      const rec = studentRecords.find(
        (r) =>
          r.activity_id === actId &&
          (r.operational_date?.substring(0, 10) === session.dateStr ||
           r.session_id?.includes(session.dateStr))
      );

      if (rec) {
        matchedRecordIds.add(rec.id);
        const isHadir =
          rec.musyrif_status === 'hadir' ||
          rec.status === 'hadir_valid' ||
          (rec.attendance_type === 'hadir' &&
            rec.status !== 'ditolak_lokasi' &&
            rec.status !== 'alpa' &&
            rec.status !== 'izin_ditolak');

        const isIzin =
          rec.musyrif_status === 'izin' ||
          rec.status === 'izin_disetujui' ||
          rec.status === 'izin_diajukan' ||
          rec.attendance_type === 'izin';

        if (isHadir) {
          hadirCount += 1;
          activityScores[actId].hadir += 1;
        } else if (isIzin) {
          izinCount += 1;
          activityScores[actId].izin += 1;
        } else {
          alpaCount += 1;
          activityScores[actId].alpa += 1;
        }
      } else {
        // SANTRI TIDAK ABSEN PADA SESI YANG SUDAH LEWAT: OTOMATIS ALPA!
        alpaCount += 1;
        activityScores[actId].alpa += 1;
      }
      activityScores[actId].sessions += 1;
    }

    // 2. Evaluasi sisa record yang belum tercocokkan (misal: sesi hari ini yang sedang berlangsung / manual)
    studentRecords.forEach((rec) => {
      if (matchedRecordIds.has(rec.id)) return;

      const actId = rec.activity_id;
      if (!activityScores[actId]) {
        activityScores[actId] = {
          activityId: actId,
          activityName: rec.activity_name,
          activityCode: 'ACT',
          hadir: 0,
          izin: 0,
          alpa: 0,
          score: 0,
          sessions: 0,
          percentage: 100,
        };
      }

      const isHadir =
        rec.musyrif_status === 'hadir' ||
        rec.status === 'hadir_valid' ||
        (rec.attendance_type === 'hadir' &&
          rec.status !== 'ditolak_lokasi' &&
          rec.status !== 'alpa' &&
          rec.status !== 'izin_ditolak');

      const isIzin =
        rec.musyrif_status === 'izin' ||
        rec.status === 'izin_disetujui' ||
        rec.status === 'izin_diajukan' ||
        rec.attendance_type === 'izin';

      if (isHadir) {
        hadirCount += 1;
        activityScores[actId].hadir += 1;
      } else if (isIzin) {
        izinCount += 1;
        activityScores[actId].izin += 1;
      } else {
        alpaCount += 1;
        activityScores[actId].alpa += 1;
      }
      activityScores[actId].sessions += 1;
    });

    // Hitung persentase per kegiatan santri
    Object.keys(activityScores).forEach((actId) => {
      const itm = activityScores[actId];
      const sScore = itm.hadir * 1.0 + itm.izin * 0.5 + itm.alpa * 0;
      itm.score = sScore;
      itm.percentage =
        itm.sessions > 0 ? Math.round((sScore / itm.sessions) * 100) : 100;
    });

    const totalSessions = hadirCount + izinCount + alpaCount;
    const totalScore = hadirCount * 1.0 + izinCount * 0.5 + alpaCount * 0;
    const scorePercentage =
      totalSessions > 0 ? Math.round((totalScore / totalSessions) * 1000) / 10 : 100;

    const isWarning = totalSessions > 0 && scorePercentage < 70;

    return {
      student: st,
      hadirCount,
      izinCount,
      alpaCount,
      totalSessions,
      totalScore,
      scorePercentage,
      isWarning,
      activityScores,
    };
  });

  // Urutkan studentScores dari persentase terendah ke tertinggi agar santri bermasalah terlihat cepat
  const sortedStudents = [...studentScores].sort(
    (a, b) => a.scorePercentage - b.scorePercentage
  );

  const warningStudents = sortedStudents.filter((s) => s.isWarning);

  // Hitung statistik global per kegiatan berdasarkan rekapitulasi seluruh santri
  const activityStats = activities.map((act) => {
    let hadir = 0;
    let izin = 0;
    let alpa = 0;
    let total = 0;

    studentScores.forEach((stScore) => {
      const actScore = stScore.activityScores[act.id];
      if (actScore) {
        hadir += actScore.hadir;
        izin += actScore.izin;
        alpa += actScore.alpa;
        total += actScore.sessions;
      }
    });

    const avgScore = total > 0 ? hadir * 1.0 + izin * 0.5 : 0;
    const rate = total > 0 ? Math.round((avgScore / total) * 1000) / 10 : 100;

    return {
      activityId: act.id,
      activityName: act.name,
      activityCode: act.code,
      hadirCount: hadir,
      izinCount: izin,
      alpaCount: alpa,
      totalSessions: total,
      averageScore: avgScore,
      rate,
    };
  });

  // Hitung rata-rata global
  const totalScoreAll = studentScores.reduce((acc, curr) => acc + curr.scorePercentage, 0);
  const averageScorePercentage =
    studentScores.length > 0
      ? Math.round((totalScoreAll / studentScores.length) * 10) / 10
      : 100;

  const tierSangatBaikCount = studentScores.filter((s) => s.scorePercentage >= 85).length;
  const tierCukupCount = studentScores.filter(
    (s) => s.scorePercentage >= 70 && s.scorePercentage < 85
  ).length;
  const tierPeringatanCount = warningStudents.length;

  return {
    monthKey: monthFilter,
    monthLabel,
    totalStudents: santriList.length,
    averageScorePercentage,
    warningCount: warningStudents.length,
    tierSangatBaikCount,
    tierCukupCount,
    tierPeringatanCount,
    activityStats,
    studentScores: sortedStudents,
    warningStudents,
  };
}
