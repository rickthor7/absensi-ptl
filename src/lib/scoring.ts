import { AttendanceRecord, Profile, Activity } from '@/types';

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
 * - Alpa / Ditolak = 0 poin
 * Peringatan Real-Time aktif jika persentase di bawah 70%
 */
export function calculateMonthlyScores(
  profiles: Profile[],
  activities: Activity[],
  attendanceRecords: AttendanceRecord[],
  monthFilter: string // Format "YYYY-MM", e.g. "2026-10"
): GlobalMonthlyStats {
  const santriList = profiles.filter((p) => p.role === 'santri');

  // Filter record sesuai bulan
  const monthRecords = attendanceRecords.filter((r) =>
    r.operational_date.startsWith(monthFilter)
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

    studentRecords.forEach((rec) => {
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

      if (rec.status === 'hadir_valid') {
        hadirCount += 1;
        activityScores[actId].hadir += 1;
      } else if (rec.status === 'izin_diajukan' || rec.status === 'izin_disetujui') {
        izinCount += 1;
        activityScores[actId].izin += 1;
      } else {
        // ditolak_lokasi, izin_ditolak, perlu_tinjauan
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

  // Hitung statistik global per kegiatan
  const activityStats = activities.map((act) => {
    const actRecords = monthRecords.filter((r) => r.activity_id === act.id);
    const hadir = actRecords.filter((r) => r.status === 'hadir_valid').length;
    const izin = actRecords.filter(
      (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
    ).length;
    const alpa = actRecords.filter(
      (r) =>
        r.status === 'ditolak_lokasi' ||
        r.status === 'izin_ditolak' ||
        r.status === 'perlu_tinjauan'
    ).length;
    const total = actRecords.length;
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
