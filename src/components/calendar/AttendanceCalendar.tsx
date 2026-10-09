'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord, AttendanceStatus } from '@/types';
import { STATUS_META } from '@/lib/constants';
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
} from 'lucide-react';

export default function AttendanceCalendar() {
  const { currentUser, attendanceRecords, effectiveTime } = useStore();

  const [currentYear, setCurrentYear] = useState(effectiveTime.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(effectiveTime.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    effectiveTime.toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Filter records for current student
  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);

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
  // Adjust to Monday start (1=Mon, ..., 7=Sun)
  const startingCol = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Monthly summary stats
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthRecords = studentRecords.filter((r) => r.operational_date.startsWith(monthPrefix));

  const validCount = monthRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinCount = monthRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
  ).length;
  const reviewCount = monthRecords.filter((r) => r.status === 'perlu_tinjauan').length;
  const rejectCount = monthRecords.filter(
    (r) => r.status === 'ditolak_lokasi' || r.status === 'izin_ditolak'
  ).length;

  // Details for selected date
  const selectedRecords = studentRecords.filter((r) => r.operational_date === selectedDateStr);

  return (
    <div className="space-y-6">
      {/* Month Header & View Switcher */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#146B50] flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5 text-[#D6A84F]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-stone-500">
              Riwayat absensi pribadi: {currentUser.full_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch calendar / list mode */}
          <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-stone-700 text-[#146B50] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Kalender</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-stone-700 text-[#146B50] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Daftar</span>
            </button>
          </div>

          {/* Month buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 text-stone-600 transition"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 text-stone-600 transition"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
          <span className="text-[11px] font-semibold block text-emerald-600 dark:text-emerald-400">Hadir Valid</span>
          <div className="text-2xl font-extrabold mt-0.5">{validCount}</div>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/70">Tervalidasi radius & foto</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          <span className="text-[11px] font-semibold block text-amber-600 dark:text-amber-400">Izin</span>
          <div className="text-2xl font-extrabold mt-0.5">{izinCount}</div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-300/70">Pengajuan izin santri</span>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200">
          <span className="text-[11px] font-semibold block text-orange-600 dark:text-orange-400">Perlu Review</span>
          <div className="text-2xl font-extrabold mt-0.5">{reviewCount}</div>
          <span className="text-[10px] text-orange-700/80 dark:text-orange-300/70">Akurasi GPS rendah</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
          <span className="text-[11px] font-semibold block text-rose-600 dark:text-rose-400">Ditolak</span>
          <div className="text-2xl font-extrabold mt-0.5">{rejectCount}</div>
          <span className="text-[10px] text-rose-700/80 dark:text-rose-300/70">Luar radius / izin ditolak</span>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'].map((d, i) => (
              <div key={i} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty padding slots before first day */}
            {Array.from({ length: startingCol }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const dayRecords = studentRecords.filter((r) => r.operational_date === dateStr);
              const isSelected = selectedDateStr === dateStr;
              const isToday =
                effectiveTime.toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`aspect-square p-1.5 sm:p-2 rounded-2xl border transition flex flex-col items-center justify-between cursor-pointer relative ${
                    isSelected
                      ? 'border-[#146B50] bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-600/30'
                      : isToday
                      ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-stone-100 dark:border-stone-800 hover:border-emerald-200 bg-stone-50/50 dark:bg-stone-800/30'
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected
                        ? 'text-[#146B50]'
                        : isToday
                        ? 'text-amber-700'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Status Indicator Dots */}
                  <div className="flex items-center gap-1 flex-wrap justify-center max-w-full">
                    {dayRecords.map((rec) => {
                      const meta = STATUS_META[rec.status];
                      return (
                        <span
                          key={rec.id}
                          className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${meta.dotClass}`}
                          title={`${rec.activity_name}: ${meta.label}`}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-2">
            Seluruh Catatan Bulan Ini
          </h3>
          {monthRecords.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              Belum ada riwayat absensi pada bulan ini.
            </div>
          ) : (
            <div className="space-y-2">
              {monthRecords.map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {r.activity_name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {r.operational_date} • {new Date(r.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
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
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#146B50]" />
            Detail Kegiatan: {selectedDateStr}
          </h3>
          <span className="text-xs text-stone-500">
            {selectedRecords.length} Catatan Absensi
          </span>
        </div>

        {selectedRecords.length === 0 ? (
          <div className="p-6 text-center text-stone-400 text-xs bg-stone-50 dark:bg-stone-800/40 rounded-2xl">
            Tidak ada riwayat absensi pada tanggal ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedRecords.map((rec) => {
              const meta = STATUS_META[rec.status];
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {rec.activity_name}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Waktu Kirim: {new Date(rec.submitted_at).toLocaleTimeString('id-ID')} WIB
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={rec.photo_path}
                      alt="Selfie"
                      className="w-14 h-14 rounded-xl object-cover border border-stone-300"
                    />
                    <div className="text-[11px] space-y-1 text-stone-600 dark:text-stone-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#146B50]" />
                        <span>Jarak: {Math.round(rec.distance_from_site_m)}m</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Akurasi GPS: ±{Math.round(rec.gps_accuracy_m)}m</span>
                      </div>
                    </div>
                  </div>

                  {rec.permission_reason && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 border border-amber-200">
                      <strong>Alasan Izin:</strong> {rec.permission_reason}
                    </div>
                  )}

                  {rec.review_note && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-[11px] text-blue-800 dark:text-blue-200 border border-blue-200">
                      <strong>Catatan Musyrif:</strong> {rec.review_note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
