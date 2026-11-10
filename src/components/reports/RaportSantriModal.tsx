'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { StudentMonthlyScore } from '@/lib/scoring';
import { Activity, Profile, AttendanceRecord } from '@/types';
import { getWibDateStr, getWibTimeParts, timeStringToMinutes } from '@/lib/schedule';
import {
  X,
  Printer,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface RaportSantriModalProps {
  studentsScores?: StudentMonthlyScore[];
  initialStudentId?: string;
  activities?: Activity[];
  monthLabel?: string;
  monthKey?: string;
  musyrifUser?: Profile;
  onClose: () => void;
}

const INDO_DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

const MONTH_NAMES = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

interface ColumnDef {
  key: string;
  header: string;
  activityCodes: string[];
}

export default function RaportSantriModal({
  studentsScores: propStudentsScores,
  initialStudentId,
  activities: propActivities,
  monthLabel: propMonthLabel,
  monthKey: propMonthKey,
  musyrifUser,
  onClose,
}: RaportSantriModalProps) {
  const {
    profiles,
    activities: storeActivities,
    attendanceRecords,
    effectiveTime,
    currentUser,
  } = useStore();

  const allActivities = propActivities || storeActivities;

  // Month Key state (e.g. "2026-11")
  const defaultMonthKey = propMonthKey || getWibDateStr(effectiveTime).substring(0, 7);
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  // Available months (dinamis dari bulan efektif - 5 bulan ke belakang sampai 1 bulan ke depan)
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const baseDate = effectiveTime instanceof Date ? effectiveTime : new Date();
    const currYear = baseDate.getFullYear();
    const currMonth = baseDate.getMonth(); // 0-indexed

    for (let offset = 1; offset >= -5; offset--) {
      const d = new Date(currYear, currMonth + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[m - 1]} ${y}`;
      list.push({ key, label });
    }
    return list;
  }, [effectiveTime]);

  const santriProfiles = useMemo(() => {
    return profiles.filter((p) => p.role === 'santri');
  }, [profiles]);

  // Selected student index
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId) return initialStudentId;
    if (currentUser.role === 'santri') return currentUser.id;
    return santriProfiles[0]?.id || '';
  });

  const currentStudent = useMemo(() => {
    return santriProfiles.find((s) => s.id === selectedStudentId) || santriProfiles[0];
  }, [santriProfiles, selectedStudentId]);

  const currentStudentIndex = useMemo(() => {
    return santriProfiles.findIndex((s) => s.id === currentStudent?.id);
  }, [santriProfiles, currentStudent]);

  // Activity columns definition matching exactly the spreadsheet
  // Columns: LAIL, SUBUH, TAHFIDZ_PAGI, NGAJI_KITAB, MAGHRIB, ISYA, TAHFIDZ_MALAM
  const columns: ColumnDef[] = useMemo(() => {
    const standardDefs: ColumnDef[] = [
      { key: 'lail', header: 'LAIL', activityCodes: ['QIYAM'] },
      { key: 'subuh', header: 'SUBUH', activityCodes: ['SHUBUH'] },
      { key: 'tahfidz_pagi', header: 'TAHFIDZ_PAGI', activityCodes: ['SETORAN_PAGI'] },
      { key: 'ngaji_kitab', header: 'NGAJI_KITAB', activityCodes: ['MADIN', 'KITAB_KUNING', 'NGAJI_SABTU', 'KITAB'] },
      { key: 'maghrib', header: 'MAGHRIB', activityCodes: ['MAGHRIB'] },
      { key: 'isya', header: 'ISYA', activityCodes: ['ISYA'] },
      { key: 'tahfidz_malam', header: 'TAHFIDZ_MALAM', activityCodes: ['SETORAN_MALAM'] },
    ];

    // Also check if any activity in store doesn't match standard codes
    const handledCodes = new Set(standardDefs.flatMap((d) => d.activityCodes));
    const extraActivities = allActivities.filter(
      (a) => a.is_active && !handledCodes.has(a.code)
    );

    const extraDefs: ColumnDef[] = extraActivities.map((a) => ({
      key: `custom_${a.id}`,
      header: a.code || a.name.toUpperCase().replace(/\s+/g, '_'),
      activityCodes: [a.code],
    }));

    return [...standardDefs, ...extraDefs];
  }, [allActivities]);

  // Compute days in selected month and status for each activity
  const monthData = useMemo(() => {
    if (!selectedMonthKey || !currentStudent) {
      return {
        days: [] as Array<{ dateStr: string; dayName: string; cells: Record<string, 'H' | 'I' | 'A' | ''> }>,
        colTotals: {
          hadir: {} as Record<string, number>,
          izin: {} as Record<string, number>,
          alpa: {} as Record<string, number>,
        },
        totals: {
          hadir: 0,
          izin: 0,
          alpa: 0,
          poinHadir: 0,
          poinIzin: 0,
          poin: 0,
          totalKegiatan: 0,
          percentage: 0,
        },
      };
    }

    const [yearStr, monthStr] = selectedMonthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = getWibDateStr(effectiveTime);

    // Activity lookup map by ID
    const activityById = new Map<string, Activity>();
    allActivities.forEach((a) => activityById.set(a.id, a));

    // Waktu sekarang dalam WIB untuk evaluasi kegiatan hari ini
    const wibParts = getWibTimeParts(effectiveTime);
    const currentWibMinutes = wibParts.hours * 60 + wibParts.minutes;

    const studentRecords = attendanceRecords.filter(
      (r) => r.student_id === currentStudent.id && r.operational_date.startsWith(selectedMonthKey)
    );

    const days: Array<{
      dateStr: string;
      dayName: string;
      cells: Record<string, 'H' | 'I' | 'A' | ''>;
    }> = [];

    // Initialize col totals
    const colHadir: Record<string, number> = {};
    const colIzin: Record<string, number> = {};
    const colAlpa: Record<string, number> = {};
    columns.forEach((col) => {
      colHadir[col.key] = 0;
      colIzin[col.key] = 0;
      colAlpa[col.key] = 0;
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(`${dateStr}T12:00:00+07:00`);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu .. 6 = Sabtu
      const dayName = INDO_DAYS[dayOfWeek];
      const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 1 = Senin .. 7 = Minggu

      const cells: Record<string, 'H' | 'I' | 'A' | ''> = {};

      columns.forEach((col) => {
        // Find matching activity for this day of week
        const act = allActivities.find(
          (a) =>
            a.is_active &&
            col.activityCodes.includes(a.code) &&
            a.active_days &&
            a.active_days.map(Number).includes(Number(isoDay))
        );

        // Cari catatan presensi santri yang cocok untuk kolom ini pada tanggal ini:
        // 1. Berdasarkan operational_date yang sama
        // 2. Cocok activity_id langsung ATAU activity_id terdaftar dalam activityCodes kolom ini
        const rec = studentRecords.find((r) => {
          if (r.operational_date !== dateStr) return false;
          if (act && r.activity_id === act.id) return true;
          const rAct = activityById.get(r.activity_id);
          if (rAct && col.activityCodes.includes(rAct.code)) return true;
          if (col.activityCodes.some((c) => r.session_id?.toLowerCase().includes(c.toLowerCase()))) return true;
          return false;
        });

        if (rec) {
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
            rec.status === 'perlu_tinjauan' ||
            rec.attendance_type === 'izin';

          if (isHadir) {
            cells[col.key] = 'H';
            colHadir[col.key]++;
          } else if (isIzin) {
            cells[col.key] = 'I';
            colIzin[col.key]++;
          } else {
            cells[col.key] = 'A';
            colAlpa[col.key]++;
          }
        } else {
          // Jika tidak ada kegiatan yang terjadwal dan tidak ada presensi
          if (!act) {
            cells[col.key] = '';
            return;
          }

          // Jika tanggal lampau: Alpa
          if (dateStr < todayStr) {
            cells[col.key] = 'A';
            colAlpa[col.key]++;
          } else if (dateStr === todayStr) {
            // Jika tanggal hari ini: Hanya tandai Alpa jika jendela kegiatan sudah berakhir
            const endMinutes = act.end_time ? timeStringToMinutes(act.end_time) : 1440;
            if (currentWibMinutes >= endMinutes) {
              cells[col.key] = 'A';
              colAlpa[col.key]++;
            } else {
              // Kegiatan hari ini belum selesai/sedang berlangsung, belum Alpa
              cells[col.key] = '';
            }
          } else {
            // Tanggal yang akan datang di masa depan
            cells[col.key] = '';
          }
        }
      });

      days.push({
        dateStr,
        dayName,
        cells,
      });
    }

    // Totals calculation
    const totalHadir = Object.values(colHadir).reduce((a, b) => a + b, 0);
    const totalIzin = Object.values(colIzin).reduce((a, b) => a + b, 0);
    const totalAlpa = Object.values(colAlpa).reduce((a, b) => a + b, 0);

    const poinHadir = totalHadir * 1;
    const poinIzin = totalIzin * 0.5;
    const totalPoin = poinHadir + poinIzin;
    const totalKegiatan = totalHadir + totalIzin + totalAlpa;
    const percentage = totalKegiatan > 0 ? (totalPoin / totalKegiatan) * 100 : 0;

    return {
      days,
      colTotals: {
        hadir: colHadir,
        izin: colIzin,
        alpa: colAlpa,
      },
      totals: {
        hadir: totalHadir,
        izin: totalIzin,
        alpa: totalAlpa,
        poinHadir,
        poinIzin,
        poin: totalPoin,
        totalKegiatan,
        percentage,
      },
    };
  }, [selectedMonthKey, currentStudent, columns, allActivities, attendanceRecords, effectiveTime]);

  const monthLabel = useMemo(() => {
    if (!selectedMonthKey) return '';
    const [yearStr, monthStr] = selectedMonthKey.split('-');
    const m = parseInt(monthStr, 10);
    return `${MONTH_NAMES[m - 1]} ${yearStr}`;
  }, [selectedMonthKey]);

  // Export to CSV matching the spreadsheet layout
  const handleDownloadCSV = () => {
    if (!currentStudent) return;

    const headers = ['HARI', 'TANGGAL', ...columns.map((c) => c.header)];
    const rows = monthData.days.map((d) => [
      d.dayName,
      d.dateStr,
      ...columns.map((c) => d.cells[c.key] || ''),
    ]);

    const hadirRow = ['JUMLAH HADIR', '', ...columns.map((c) => monthData.colTotals.hadir[c.key] || 0)];
    const izinRow = ['JUMLAH IZIN', '', ...columns.map((c) => monthData.colTotals.izin[c.key] || 0)];
    const alpaRow = ['JUMLAH ALPA', '', ...columns.map((c) => monthData.colTotals.alpa[c.key] || 0)];

    const lines = [
      'LAPORAN MUTABAAH YAUMIYAH PER BULAN',
      '',
      `Nama Santri,${currentStudent.full_name}`,
      `Bulan,${monthLabel}`,
      `NIS,${currentStudent.student_number || '-'}`,
      `Kamar / Asrama,${currentStudent.group_name || '-'}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      hadirRow.join(','),
      izinRow.join(','),
      alpaRow.join(','),
      '',
      'POIN KEAKTIFAN,HADIR,' + monthData.totals.hadir + ',' + monthData.totals.poinHadir,
      ',IZIN,' + monthData.totals.izin + ',' + monthData.totals.poinIzin + ',' + monthData.totals.poin,
      ',ALPA,' + monthData.totals.alpa + ',0',
      '',
      `TOTAL KEGIATAN,${monthData.totals.totalKegiatan}`,
      `PERSENTASE KEAKTIFAN,${monthData.totals.percentage.toFixed(2).replace('.', ',')}%`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rapot-mutabaah-${currentStudent.nickname || currentStudent.full_name}-${selectedMonthKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Box */}
      <div className="bg-white dark:bg-[#0C1713] text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200 dark:border-[#1C3A2E] w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">

        {/* ══ TOP ACTION TOOLBAR (Hidden in Print) ══ */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#082F23] to-[#0D7B5F] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#D4A24C]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Raport Mutaba&apos;ah Yaumiyah</h2>
              <p className="text-[10px] text-emerald-200/70">Format Tabel Bulanan &amp; Detail Perhitungan</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Month Select */}
            <div className="flex items-center gap-1.5 bg-black/20 rounded-xl px-2.5 py-1.5 border border-white/15">
              <Calendar className="w-3.5 h-3.5 text-[#D4A24C]" />
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#082F23] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Switcher (If multiple students available) */}
            {santriProfiles.length > 1 && (
              <div className="flex items-center gap-1 bg-black/20 rounded-xl px-1.5 py-1 border border-white/15">
                <button
                  type="button"
                  disabled={currentStudentIndex <= 0}
                  onClick={() => {
                    if (currentStudentIndex > 0) {
                      setSelectedStudentId(santriProfiles[currentStudentIndex - 1].id);
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 cursor-pointer"
                  title="Santri Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold max-w-[160px] truncate focus:outline-none cursor-pointer px-1"
                >
                  {santriProfiles.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#082F23] text-white">
                      {s.full_name} ({s.nickname || s.student_number || 'Santri'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={currentStudentIndex >= santriProfiles.length - 1}
                  onClick={() => {
                    if (currentStudentIndex < santriProfiles.length - 1) {
                      setSelectedStudentId(santriProfiles[currentStudentIndex + 1].id);
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 cursor-pointer"
                  title="Santri Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Download CSV */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer btn-press"
              title="Unduh Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span className="hidden sm:inline">Unduh CSV</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A24C] hover:bg-[#E8C36E] text-[#082F23] text-xs font-bold transition shadow-sm cursor-pointer btn-press"
              title="Cetak Raport"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rapot</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ══ SCROLLABLE REPORT BODY ══ */}
        <div className="overflow-y-auto overflow-x-auto p-4 sm:p-6 lg:p-8 space-y-5 print:p-0 print:overflow-visible">

          {/* ══ 1. TITLE BANNER ══ */}
          <div
            className="w-full text-center py-2.5 px-4 font-bold text-sm sm:text-base uppercase tracking-wider text-[#1F497D] border border-[#8EA9DB] rounded-md shadow-xs print:rounded-none"
            style={{ backgroundColor: '#C6D9F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          >
            LAPORAN MUTABAAH YAUMIYAH PER BULAN
          </div>

          {/* ══ 2. HEADER INFO (NAMA SANTRI & BULAN) ══ */}
          <div className="space-y-1 text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
            <div className="flex items-center gap-2">
              <span className="w-28 sm:w-32 shrink-0 text-stone-600 dark:text-stone-400 font-semibold">Nama Santri</span>
              <span className="uppercase text-stone-900 dark:text-white font-extrabold">: {currentStudent?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 sm:w-32 shrink-0 text-stone-600 dark:text-stone-400 font-semibold">Bulan</span>
              <span className="uppercase text-stone-900 dark:text-white font-extrabold">: {monthLabel}</span>
            </div>
          </div>

          {/* ══ 3. MAIN SPREADSHEET TABLE ══ */}
          <div className="overflow-x-auto border border-[#8EA9DB] rounded-md shadow-xs print:rounded-none">
            <table className="w-full border-collapse text-center text-xs">
              {/* Header Row */}
              <thead>
                <tr
                  className="font-bold text-stone-900 border-b border-[#8EA9DB] text-[11px] sm:text-xs uppercase"
                  style={{ backgroundColor: '#B8CCE4', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <th className="border-r border-[#8EA9DB] py-2 px-2.5 w-20 text-center font-bold">HARI</th>
                  <th className="border-r border-[#8EA9DB] py-2 px-2.5 w-28 text-center font-bold">TANGGAL</th>
                  {columns.map((col) => (
                    <th key={col.key} className="border-r border-[#8EA9DB] py-2 px-2 text-center font-bold whitespace-nowrap min-w-[70px]">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Day Rows */}
              <tbody>
                {monthData.days.map((row) => (
                  <tr
                    key={row.dateStr}
                    className="border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 transition-colors text-[11px] sm:text-xs"
                  >
                    {/* Hari */}
                    <td className="border-r border-[#8EA9DB] py-1 px-2 font-medium text-stone-800 dark:text-stone-200">
                      {row.dayName}
                    </td>

                    {/* Tanggal */}
                    <td className="border-r border-[#8EA9DB] py-1 px-2 font-mono text-stone-700 dark:text-stone-300">
                      {row.dateStr}
                    </td>

                    {/* Activity Cells */}
                    {columns.map((col) => {
                      const val = row.cells[col.key];

                      let bgStyle = {};
                      let textColor = 'text-stone-800 dark:text-stone-200';

                      if (val === 'H') {
                        bgStyle = { backgroundColor: '#D9EAD3', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };
                        textColor = 'text-[#274E13] font-bold';
                      } else if (val === 'I') {
                        bgStyle = { backgroundColor: '#FCE5CD', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };
                        textColor = 'text-[#783F04] font-bold';
                      } else if (val === 'A') {
                        bgStyle = { backgroundColor: '#F4CCCC', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };
                        textColor = 'text-[#990000] font-bold';
                      }

                      return (
                        <td
                          key={col.key}
                          className={`border-r border-[#8EA9DB] py-1 px-1 text-center font-bold transition-colors ${textColor}`}
                          style={bgStyle}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* ══ SUMMARY ROWS (JUMLAH HADIR, IZIN, ALPA) ══ */}
                <tr
                  className="font-bold border-t-2 border-[#8EA9DB] text-[11px] sm:text-xs"
                  style={{ backgroundColor: '#DCE6F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <td colSpan={2} className="border-r border-[#8EA9DB] py-1.5 px-3 text-center font-extrabold text-stone-900">
                    JUMLAH HADIR
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="border-r border-[#8EA9DB] py-1.5 px-1 font-extrabold text-[#274E13]">
                      {monthData.colTotals.hadir[col.key] || 0}
                    </td>
                  ))}
                </tr>

                <tr
                  className="font-bold border-t border-[#8EA9DB] text-[11px] sm:text-xs"
                  style={{ backgroundColor: '#DCE6F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <td colSpan={2} className="border-r border-[#8EA9DB] py-1.5 px-3 text-center font-extrabold text-stone-900">
                    JUMLAH IZIN
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="border-r border-[#8EA9DB] py-1.5 px-1 font-extrabold text-[#783F04]">
                      {monthData.colTotals.izin[col.key] || 0}
                    </td>
                  ))}
                </tr>

                <tr
                  className="font-bold border-t border-[#8EA9DB] text-[11px] sm:text-xs"
                  style={{ backgroundColor: '#DCE6F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <td colSpan={2} className="border-r border-[#8EA9DB] py-1.5 px-3 text-center font-extrabold text-stone-900">
                    JUMLAH ALPA
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="border-r border-[#8EA9DB] py-1.5 px-1 font-extrabold text-[#990000]">
                      {monthData.colTotals.alpa[col.key] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══ 4. DETAIL PERHITUNGAN SECTION ══ */}
          <div className="pt-2 space-y-4 max-w-xl">

            {/* Poin Keaktifan Table */}
            <div className="border border-[#8EA9DB] rounded-md overflow-hidden shadow-xs print:rounded-none">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {/* Hadir */}
                  <tr className="border-b border-[#8EA9DB]">
                    <td
                      rowSpan={3}
                      className="border-r border-[#8EA9DB] py-2 px-3 font-extrabold text-stone-900 text-center uppercase w-44"
                      style={{ backgroundColor: '#C6D9F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      POIN KEAKTIFAN
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-bold text-stone-800 dark:text-stone-200 w-28">
                      HADIR
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-mono font-bold text-center w-24">
                      {monthData.totals.hadir}
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-mono font-bold text-center w-24">
                      {monthData.totals.poinHadir}
                    </td>
                    <td rowSpan={2} className="py-1.5 px-4 font-mono font-extrabold text-center text-sm text-[#1F497D] bg-stone-50 dark:bg-stone-900/60">
                      {monthData.totals.poin}
                    </td>
                  </tr>

                  {/* Izin */}
                  <tr className="border-b border-[#8EA9DB]">
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-bold text-stone-800 dark:text-stone-200">
                      IZIN
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-mono font-bold text-center">
                      {monthData.totals.izin}
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-mono font-bold text-center">
                      {monthData.totals.poinIzin}
                    </td>
                  </tr>

                  {/* Alpa */}
                  <tr>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-bold text-stone-800 dark:text-stone-200">
                      ALPA
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-mono font-bold text-center">
                      {monthData.totals.alpa}
                    </td>
                    <td className="border-r border-[#8EA9DB] py-1.5 px-4 font-mono font-bold text-center text-stone-400">
                      0
                    </td>
                    <td className="py-1.5 px-4 bg-stone-50 dark:bg-stone-900/60" />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Kegiatan Box */}
            <div className="border border-[#8EA9DB] rounded-md overflow-hidden shadow-xs print:rounded-none">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr>
                    <td
                      className="border-r border-[#8EA9DB] py-2 px-3 font-extrabold text-stone-900 uppercase w-44"
                      style={{ backgroundColor: '#C6D9F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      TOTAL KEGIATAN
                    </td>
                    <td className="py-2 px-4 font-mono font-black text-sm text-center w-28 bg-white dark:bg-stone-900">
                      {monthData.totals.totalKegiatan}
                    </td>
                    <td className="text-[11px] text-stone-500 px-3 italic bg-stone-50/50 dark:bg-stone-950/40">
                      Total akumulasi seluruh sesi kegiatan wajib santri
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Persentase Keaktifan Box */}
            <div className="border border-[#8EA9DB] rounded-md overflow-hidden shadow-xs print:rounded-none">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr>
                    <td
                      className="border-r border-[#8EA9DB] py-2.5 px-3 font-extrabold text-stone-900 uppercase w-44"
                      style={{ backgroundColor: '#C6D9F1', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      PERSENTASE KEAKTIFAN
                    </td>
                    <td className="py-2.5 px-4 font-mono font-black text-base text-center w-28 bg-white dark:bg-stone-900 text-[#1F497D] dark:text-[#8EA9DB]">
                      {monthData.totals.percentage.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="text-[11px] px-3 font-semibold bg-stone-50/50 dark:bg-stone-950/40">
                      {monthData.totals.percentage >= 85 ? (
                        <span className="text-emerald-700 font-bold">⭐ Kategori Mumtaz (Sangat Baik)</span>
                      ) : monthData.totals.percentage >= 70 ? (
                        <span className="text-blue-700 font-bold">✓ Kategori Jayyid (Baik / Memenuhi Standar)</span>
                      ) : (
                        <span className="text-rose-700 font-bold">⚠️ Perlu Pembinaan (&lt; 70%)</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* ══ FOOTER KETERANGAN KELULUSAN ══ */}
          <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p>
              Keterangan: <strong className="text-emerald-700">H</strong> = Hadir (1 poin),{' '}
              <strong className="text-amber-700">I</strong> = Izin (0.5 poin),{' '}
              <strong className="text-rose-700">A</strong> = Alpa (0 poin).
            </p>
            <p className="font-mono text-[10px]">
              Dokumen Resmi Pondok Pesantren Nurul Falah Ketintang, Surabaya
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
