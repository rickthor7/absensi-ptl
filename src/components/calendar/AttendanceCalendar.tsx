'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord, AttendanceStatus, Activity } from '@/types';
import { STATUS_META } from '@/lib/constants';
import {
  formatTime24,
  getWibDateStr,
  getActivitiesForDate,
  getWibTimeParts,
  timeStringToMinutes,
  formatIndonesianDate,
} from '@/lib/schedule';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MapPin,
  List,
  Grid,
  Info,
  Sparkles,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export default function AttendanceCalendar() {
  const { currentUser, attendanceRecords, effectiveTime, activities } = useStore();

  const [currentYear, setCurrentYear] = useState(effectiveTime.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(effectiveTime.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getWibDateStr(effectiveTime)
  );
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const todayStr = getWibDateStr(effectiveTime);
  const currentWibTime = getWibTimeParts(effectiveTime);
  const currentMinutesWib = currentWibTime.hours * 60 + currentWibTime.minutes;

  // Filter records for current student
  const studentRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.student_id === currentUser.id);
  }, [attendanceRecords, currentUser.id]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

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

  // Calendar matrix calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sunday
  const startingCol = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Monthly summary stats calculation
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthRecords = useMemo(() => {
    return studentRecords.filter((r) => r.operational_date?.startsWith(monthPrefix));
  }, [studentRecords, monthPrefix]);

  // Evaluasi seluruh sesi terjadwal lampau di bulan ini untuk menghitung Alpa otomatis
  const monthlyStats = useMemo(() => {
    let validCount = 0;
    let izinCount = 0;
    let alpaCount = 0;
    let reviewCount = 0;

    // Batas hari yang sudah lewat
    let maxDayToCheck = 0;
    const currentMonthWib = todayStr.substring(0, 7);
    if (monthPrefix < currentMonthWib) {
      maxDayToCheck = daysInMonth;
    } else if (monthPrefix === currentMonthWib) {
      maxDayToCheck = parseInt(todayStr.substring(8, 10), 10);
    } else {
      maxDayToCheck = 0;
    }

    const matchedRecordIds = new Set<string>();

    for (let d = 1; d <= maxDayToCheck; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const scheduled = getActivitiesForDate(activities, dateStr);

      for (const act of scheduled) {
        const isPastDay = dateStr < todayStr;
        const isPastToday =
          dateStr === todayStr &&
          timeStringToMinutes(act.end_time) <= currentMinutesWib;

        if (!isPastDay && !isPastToday) continue;

        const rec = monthRecords.find(
          (r) =>
            r.activity_id === act.id &&
            (r.operational_date?.substring(0, 10) === dateStr ||
             r.session_id?.includes(dateStr))
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

          if (isHadir) validCount++;
          else if (isIzin) izinCount++;
          else alpaCount++;

          if (rec.status === 'perlu_tinjauan') reviewCount++;
        } else {
          // Tidak absen pada sesi lampau -> OTOMATIS ALPA
          alpaCount++;
        }
      }
    }

    // Hitung record sisa yang belum dicocokkan (misal sesi hari ini yang sudah absen sebelum batas waktu)
    monthRecords.forEach((rec) => {
      if (matchedRecordIds.has(rec.id)) return;

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

      if (isHadir) validCount++;
      else if (isIzin) izinCount++;
      else alpaCount++;

      if (rec.status === 'perlu_tinjauan') reviewCount++;
    });

    return { validCount, izinCount, alpaCount, reviewCount };
  }, [activities, currentMinutesWib, daysInMonth, monthPrefix, monthRecords, todayStr]);

  // Evaluasi rincian untuk tanggal terpilih
  const selectedDayItems = useMemo(() => {
    const scheduled = getActivitiesForDate(activities, selectedDateStr);
    const dayRecords = studentRecords.filter(
      (r) =>
        r.operational_date?.substring(0, 10) === selectedDateStr ||
        r.session_id?.includes(selectedDateStr)
    );

    const isPastDay = selectedDateStr < todayStr;
    const isToday = selectedDateStr === todayStr;

    return scheduled.map((act) => {
      const rec = dayRecords.find((r) => r.activity_id === act.id);
      const isPastSession =
        isPastDay ||
        (isToday && timeStringToMinutes(act.end_time) <= currentMinutesWib);

      let effectiveStatus: 'hadir' | 'izin' | 'alpa' | 'upcoming';
      if (rec) {
        if (
          rec.musyrif_status === 'hadir' ||
          rec.status === 'hadir_valid' ||
          (rec.attendance_type === 'hadir' &&
            rec.status !== 'ditolak_lokasi' &&
            rec.status !== 'alpa' &&
            rec.status !== 'izin_ditolak')
        ) {
          effectiveStatus = 'hadir';
        } else if (
          rec.musyrif_status === 'izin' ||
          rec.status === 'izin_disetujui' ||
          rec.status === 'izin_diajukan' ||
          rec.attendance_type === 'izin'
        ) {
          effectiveStatus = 'izin';
        } else {
          effectiveStatus = 'alpa';
        }
      } else {
        // Tidak ada record
        effectiveStatus = isPastSession ? 'alpa' : 'upcoming';
      }

      return {
        activity: act,
        record: rec,
        isPastSession,
        effectiveStatus,
      };
    });
  }, [activities, currentMinutesWib, selectedDateStr, studentRecords, todayStr]);

  return (
    <div className="space-y-5">
      {/* Month Navigation & Mode Switcher */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#146B50] to-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold shadow-xs">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-stone-500">
              Riwayat kehadiran: <strong className="text-stone-700 dark:text-stone-300">{currentUser.full_name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* View mode toggle */}
          <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-stone-700 text-[#146B50] dark:text-[#D6A84F] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-stone-700 text-[#146B50] dark:text-[#D6A84F] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition cursor-pointer active:scale-95"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition cursor-pointer active:scale-95"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold block text-emerald-700 dark:text-emerald-400">Hadir Valid</span>
          <div className="text-2xl font-extrabold mt-0.5">{monthlyStats.validCount}</div>
          <span className="text-[10px] text-emerald-600/80">Kehadiran Sah</span>
        </div>

        <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-xs">
          <span className="text-[11px] font-bold block text-amber-700 dark:text-amber-400">Izin Udzur</span>
          <div className="text-2xl font-extrabold mt-0.5">{monthlyStats.izinCount}</div>
          <span className="text-[10px] text-amber-600/80">Pengajuan Izin</span>
        </div>

        <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-xs">
          <span className="text-[11px] font-bold block text-rose-700 dark:text-rose-400">Alpa (Tidak Absen)</span>
          <div className="text-2xl font-extrabold mt-0.5">{monthlyStats.alpaCount}</div>
          <span className="text-[10px] text-rose-600/80">Otomatis Terakumulasi</span>
        </div>

        <div className="p-4 rounded-3xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 text-sky-900 dark:text-sky-200 shadow-xs">
          <span className="text-[11px] font-bold block text-sky-700 dark:text-sky-400">Perlu Review</span>
          <div className="text-2xl font-extrabold mt-0.5">{monthlyStats.reviewCount}</div>
          <span className="text-[10px] text-sky-600/80">Menunggu Musyrif</span>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] p-3 sm:p-6 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-600 dark:text-stone-300 mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'].map((d, i) => (
              <div key={i} className="py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-300">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: startingCol }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dateStr;
              const isToday = todayStr === dateStr;
              const isPastDay = dateStr < todayStr;

              // Kegiatan terjadwal pada hari ini
              const scheduled = getActivitiesForDate(activities, dateStr);
              const dayRecords = studentRecords.filter(
                (r) =>
                  r.operational_date?.substring(0, 10) === dateStr ||
                  r.session_id?.includes(dateStr)
              );

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`aspect-square p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col items-center justify-between cursor-pointer relative active:scale-95 ${
                    isSelected
                      ? 'border-[#0D7B5F] bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-600/30 shadow-md'
                      : isToday
                      ? 'border-[#D4A24C] bg-amber-50/70 dark:bg-amber-950/30 shadow-xs'
                      : 'border-stone-200 dark:border-[#1C3A2E] hover:border-[#0D7B5F] bg-white dark:bg-[#162B22]/40 hover:bg-emerald-50/30'
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-extrabold ${
                      isSelected
                        ? 'text-[#0D7B5F] dark:text-[#D4A24C]'
                        : isToday
                        ? 'text-amber-800 dark:text-amber-300 font-black'
                        : 'text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Dot Indicators: Hadir (Hijau), Izin (Kuning), Alpa / Tidak Absen (Merah) */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center max-w-full pb-0.5">
                    {scheduled.map((act) => {
                      const rec = dayRecords.find((r) => r.activity_id === act.id);
                      const isPastSession =
                        isPastDay ||
                        (isToday && timeStringToMinutes(act.end_time) <= currentMinutesWib);

                      if (rec) {
                        const meta = STATUS_META[rec.status] || STATUS_META.hadir_valid;
                        return (
                          <span
                            key={rec.id}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${meta.dotClass} shadow-xs`}
                            title={`${act.name}: ${meta.label}`}
                          />
                        );
                      }

                      // Tidak ada record presensi
                      if (isPastSession) {
                        // OTOMATIS ALPA KARENA TIDAK ABSEN
                        return (
                          <span
                            key={`alpa-${act.id}`}
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 shadow-xs"
                            title={`${act.name}: Alpa (Tidak Absen)`}
                          />
                        );
                      }

                      return null;
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] p-4 sm:p-6 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 mb-2">
            Seluruh Catatan Bulan Ini
          </h3>
          {monthRecords.length === 0 ? (
            <div className="p-8 text-center text-stone-500 dark:text-stone-400 text-xs">
              Belum ada riwayat absensi pada bulan ini.
            </div>
          ) : (
            <div className="space-y-2">
              {monthRecords.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.hadir_valid;
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-[#1C3A2E] flex items-center justify-between gap-3 text-xs bg-stone-50/80 dark:bg-[#162B22]/40"
                  >
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {r.activity_name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {r.operational_date} • {formatTime24(r.submitted_at)} WIB
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Day Details Panel */}
      <div className="bg-white dark:bg-[#0F1E18] rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0D7B5F] dark:text-[#D6A84F]" />
            <span>Detail Presensi: {formatIndonesianDate(selectedDateStr)}</span>
          </h3>
          <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
            {selectedDayItems.length} Sesi Terjadwal
          </span>
        </div>

        {selectedDayItems.length === 0 ? (
          <div className="p-6 text-center text-stone-500 dark:text-stone-400 text-xs bg-stone-50/80 dark:bg-[#162B22]/40 rounded-2xl border border-stone-200/60 dark:border-[#1C3A2E]">
            Tidak ada jadwal kegiatan pondok pada tanggal ini (Hari Libur).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayItems.map((item) => {
              const { activity, record, isPastSession, effectiveStatus } = item;

              if (record) {
                const meta = STATUS_META[record.status] || STATUS_META.hadir_valid;
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl border border-stone-200/80 dark:border-[#1C3A2E] bg-stone-50/70 dark:bg-[#162B22]/40 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {record.activity_name || activity.name}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Jadwal: {activity.start_time} - {activity.end_time} WIB • Diabsen {formatTime24(record.submitted_at)} WIB
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {record.photo_path && (
                        <img
                          src={record.photo_path}
                          alt="Bukti Selfie"
                          className="w-14 h-14 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 bg-black shrink-0"
                        />
                      )}
                      <div className="text-[11px] space-y-1 text-stone-700 dark:text-stone-300">
                        <div className="flex items-center gap-1.5 font-bold text-[#0D7B5F] dark:text-[#D6A84F]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Jarak: {Math.round(record.distance_from_site_m || 0)}m dari radius</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Akurasi GPS: ±{Math.round(record.gps_accuracy_m || 10)}m</span>
                        </div>
                      </div>
                    </div>

                    {record.permission_reason && (
                      <div className="p-2.5 bg-amber-50/90 dark:bg-amber-950/40 rounded-xl text-xs text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
                        <strong>Alasan Izin:</strong> &ldquo;{record.permission_reason}&rdquo;
                      </div>
                    )}

                    {record.review_note && (
                      <div className="p-2.5 bg-sky-50/90 dark:bg-sky-950/40 rounded-xl text-xs text-sky-950 dark:text-sky-200 border border-sky-200 dark:border-sky-900">
                        <strong>Catatan Musyrif:</strong> {record.review_note}
                      </div>
                    )}
                  </div>
                );
              }

              // Jika tidak ada record:
              if (effectiveStatus === 'alpa') {
                return (
                  <div
                    key={`missed-${activity.id}`}
                    className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {activity.name}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Jadwal: {activity.start_time} - {activity.end_time} WIB
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Alpa (Tidak Absen)</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-stone-900/60 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Santri tidak melakukan presensi hingga sesi berakhir. Otomatis tercatat Alpa.</span>
                    </div>
                  </div>
                );
              }

              // Jika kegiatan belum berjalan (hari ini atau akan datang)
              return (
                <div
                  key={`upcoming-${activity.id}`}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {activity.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Jadwal: {activity.start_time} - {activity.end_time} WIB
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700">
                      Belum Dibuka / Berjalan
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Sesi presensi belum diabsen. Santri dapat melakukan selfie saat sesi telah dibuka oleh Musyrif.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
