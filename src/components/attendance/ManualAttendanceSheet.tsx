'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Activity, AttendanceRecord, Profile } from '@/types';
import { checkDiscrepancy } from '@/lib/store';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Save,
  Sparkles,
  Camera,
  RotateCcw,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';

interface ManualAttendanceSheetProps {
  initialActivityId?: string;
  onSaved?: () => void;
  onOpenDiscrepancyModal?: (record: AttendanceRecord) => void;
}

export default function ManualAttendanceSheet({
  initialActivityId,
  onSaved,
  onOpenDiscrepancyModal,
}: ManualAttendanceSheetProps) {
  const {
    activities,
    profiles,
    attendanceRecords,
    effectiveTime,
    submitManualBatchAttendance,
  } = useStore();

  const todayStr = effectiveTime.toISOString().split('T')[0];

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    initialActivityId || activities[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Santri aktif
  const santriList = useMemo(() => {
    return profiles.filter((p) => p.role === 'santri' && p.is_active);
  }, [profiles]);

  // Unique kamar / kelompok list
  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach((s) => {
      if (s.group_name) set.add(s.group_name);
    });
    return Array.from(set);
  }, [santriList]);

  // Existing records for selected activity & date
  const existingRecordsForSession = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.activity_id === selectedActivityId && r.operational_date === selectedDate
    );
  }, [attendanceRecords, selectedActivityId, selectedDate]);

  // Map student_id -> existing attendance record
  const studentRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    existingRecordsForSession.forEach((r) => {
      map.set(r.student_id, r);
    });
    return map;
  }, [existingRecordsForSession]);

  // Musyrif attendance selections state: student_id -> 'hadir' | 'izin' | 'alpa'
  // Default is 'hadir' for everyone!
  const [selections, setSelections] = useState<Record<string, 'hadir' | 'izin' | 'alpa'>>(() => {
    const initial: Record<string, 'hadir' | 'izin' | 'alpa'> = {};
    santriList.forEach((s) => {
      const existing = studentRecordMap.get(s.id);
      if (existing?.musyrif_status) {
        initial[s.id] = existing.musyrif_status;
      } else {
        // Default is HADIR as requested!
        initial[s.id] = 'hadir';
      }
    });
    return initial;
  });

  // When activity or date changes, re-initialize selections based on existing or default 'hadir'
  const handleActivityOrDateChange = (newActId: string, newDate: string) => {
    setSelectedActivityId(newActId);
    setSelectedDate(newDate);

    const relevant = attendanceRecords.filter(
      (r) => r.activity_id === newActId && r.operational_date === newDate
    );
    const recMap = new Map<string, AttendanceRecord>();
    relevant.forEach((r) => recMap.set(r.student_id, r));

    const newSelections: Record<string, 'hadir' | 'izin' | 'alpa'> = {};
    santriList.forEach((s) => {
      const rec = recMap.get(s.id);
      if (rec?.musyrif_status) {
        newSelections[s.id] = rec.musyrif_status;
      } else {
        newSelections[s.id] = 'hadir'; // DEFAULT HADIR
      }
    });
    setSelections(newSelections);
    setFeedbackMessage(null);
  };

  const handleSetAllHadir = () => {
    const updated: Record<string, 'hadir' | 'izin' | 'alpa'> = {};
    santriList.forEach((s) => {
      updated[s.id] = 'hadir';
    });
    setSelections(updated);
  };

  const handleSingleSelect = (studentId: string, status: 'hadir' | 'izin' | 'alpa') => {
    setSelections((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Filtered santri list based on search and group
  const filteredSantri = useMemo(() => {
    return santriList.filter((s) => {
      if (filterGroup !== 'all' && s.group_name !== filterGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.full_name.toLowerCase().includes(q);
        const matchNick = s.nickname && s.nickname.toLowerCase().includes(q);
        const matchNis = s.student_number && s.student_number.toLowerCase().includes(q);
        return matchName || matchNick || matchNis;
      }
      return true;
    });
  }, [santriList, filterGroup, searchQuery]);

  // Statistics calculation for current selections
  const stats = useMemo(() => {
    let hadirCount = 0;
    let izinCount = 0;
    let alpaCount = 0;
    let discrepancyCount = 0;

    santriList.forEach((s) => {
      const st = selections[s.id] || 'hadir';
      if (st === 'hadir') hadirCount++;
      else if (st === 'izin') izinCount++;
      else if (st === 'alpa') alpaCount++;

      const existing = studentRecordMap.get(s.id);
      const santriStatus = existing?.santri_status || existing?.status || 'belum_absen';
      const disc = checkDiscrepancy(santriStatus, st);
      if (disc.hasDiscrepancy) {
        discrepancyCount++;
      }
    });

    return {
      total: santriList.length,
      hadir: hadirCount,
      izin: izinCount,
      alpa: alpaCount,
      discrepancies: discrepancyCount,
    };
  }, [santriList, selections, studentRecordMap]);

  // Save batch attendance
  const handleSave = async () => {
    if (!selectedActivityId) return;

    setIsSubmitting(true);
    setFeedbackMessage(null);

    const entries = santriList.map((s) => ({
      studentId: s.id,
      status: selections[s.id] || 'hadir',
    }));

    try {
      const res = await submitManualBatchAttendance({
        activityId: selectedActivityId,
        operationalDate: selectedDate,
        entries,
      });

      if (res.success) {
        setFeedbackMessage({
          type: res.discrepancyCount > 0 ? 'warning' : 'success',
          text: res.message,
        });
        if (onSaved) onSaved();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan presensi manual.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  return (
    <div className="space-y-5">
      {/* Selector & Controls Bar */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#146B50] dark:text-[#D6A84F] mb-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Formulir Presensi Manual Musyrif</span>
            </div>
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
              Absen Massal Seluruh Santri
            </h2>
            <p className="text-xs text-stone-500">
              Default status adalah <strong>Hadir</strong>. Ubah ke <strong>Izin</strong> atau{' '}
              <strong>Alpa</strong> untuk santri yang berhalangan atau tidak terlihat di tempat.
            </p>
          </div>

          {/* Quick Action: Set All Hadir */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSetAllHadir}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Setel Semua Hadir</span>
            </button>
          </div>
        </div>

        {/* Filters: Activity, Date, Search, Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          {/* Activity Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              Pilih Kegiatan:
            </label>
            <div className="relative">
              <select
                value={selectedActivityId}
                onChange={(e) => handleActivityOrDateChange(e.target.value, selectedDate)}
                className="w-full text-xs font-bold p-2.5 pr-8 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 appearance-none outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer"
              >
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name} ({act.start_time} - {act.end_time})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              Tanggal Kegiatan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleActivityOrDateChange(selectedActivityId, e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
            />
          </div>

          {/* Search Santri */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">Cari Santri:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama atau NIS santri..."
                className="w-full text-xs pl-8 pr-3 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
              />
            </div>
          </div>

          {/* Filter Kamar / Kelompok */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              Kamar / Angkatan:
            </label>
            <div className="relative">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full text-xs font-bold p-2.5 pr-8 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 appearance-none outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer"
              >
                <option value="all">Semua Kamar / Angkatan</option>
                {groupOptions.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <span className="font-bold text-stone-500 mr-1">Rekap Pilihan:</span>
          <span className="px-3 py-1 rounded-full font-extrabold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            Total: {stats.total} Santri
          </span>
          <span className="px-3 py-1 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Hadir: {stats.hadir}
          </span>
          <span className="px-3 py-1 rounded-full font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Izin: {stats.izin}
          </span>
          <span className="px-3 py-1 rounded-full font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Alpa: {stats.alpa}
          </span>
          {stats.discrepancies > 0 && (
            <span className="px-3 py-1 rounded-full font-extrabold bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{stats.discrepancies} Ketidaksamaan dengan Santri</span>
            </span>
          )}
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-3xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : feedbackMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Santri Attendance List */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {filteredSantri.length === 0 ? (
            <div className="p-10 text-center text-xs text-stone-400">
              Tidak ada santri yang sesuai filter atau pencarian.
            </div>
          ) : (
            filteredSantri.map((santri, idx) => {
              const currentChoice = selections[santri.id] || 'hadir';
              const existingRecord = studentRecordMap.get(santri.id);

              const santriStatus =
                existingRecord?.santri_status || existingRecord?.status || 'belum_absen';
              const disc = checkDiscrepancy(santriStatus, currentChoice);

              return (
                <div
                  key={santri.id}
                  className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                    disc.hasDiscrepancy
                      ? 'bg-amber-50/40 dark:bg-amber-950/15 border-l-4 border-amber-500'
                      : 'hover:bg-stone-50/60 dark:hover:bg-stone-800/40'
                  }`}
                >
                  {/* Left: Santri Information */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-stone-400 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>

                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 flex items-center justify-center font-extrabold text-xs text-stone-600 dark:text-stone-300">
                      {santri.avatar_url ? (
                        <img
                          src={santri.avatar_url}
                          alt={santri.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        santri.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                          {santri.full_name}
                        </h4>
                        {santri.nickname && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                            {santri.nickname}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-400 font-mono mt-0.5">
                        <span>NIS: {santri.student_number || '-'}</span>
                        <span>•</span>
                        <span>{santri.group_name || 'Santri'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Santri Self-Attendance Badge */}
                  <div className="flex items-center gap-2 self-start md:self-auto pl-8 md:pl-0">
                    {existingRecord &&
                    existingRecord.santri_status &&
                    existingRecord.santri_status !== 'belum_absen' ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {existingRecord.photo_path && (
                          <img
                            src={existingRecord.photo_path}
                            alt=""
                            className="w-5 h-5 rounded-md object-cover border border-stone-300"
                          />
                        )}
                        <span className="font-bold text-[#146B50] dark:text-[#D6A84F]">
                          {existingRecord.santri_status === 'hadir_valid'
                            ? 'Selfie Hadir'
                            : existingRecord.santri_status === 'izin_diajukan'
                            ? 'Izin Mandiri'
                            : existingRecord.santri_status === 'ditolak_lokasi'
                            ? 'Ditolak Lokasi'
                            : 'Perlu Tinjauan'}
                        </span>
                        <span className="text-stone-400 text-[10px] font-mono">
                          ({new Date(existingRecord.submitted_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-stone-400 border border-stone-200/60 dark:border-stone-700/60">
                        Belum Absen Selfie
                      </span>
                    )}

                    {/* Discrepancy indicator tag */}
                    {disc.hasDiscrepancy && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold border border-amber-300 dark:border-amber-700"
                        title={disc.reason}
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Beda Data</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Musyrif 3-Way Choice Pills */}
                  <div className="flex items-center gap-1.5 self-end md:self-auto pl-8 md:pl-0">
                    {/* Hadir Pill */}
                    <button
                      type="button"
                      onClick={() => handleSingleSelect(santri.id, 'hadir')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        currentChoice === 'hadir'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Hadir</span>
                    </button>

                    {/* Izin Pill */}
                    <button
                      type="button"
                      onClick={() => handleSingleSelect(santri.id, 'izin')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        currentChoice === 'izin'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      <span>Izin</span>
                    </button>

                    {/* Alpa Pill */}
                    <button
                      type="button"
                      onClick={() => handleSingleSelect(santri.id, 'alpa')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        currentChoice === 'alpa'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Alpa</span>
                    </button>

                    {/* Cek Bukti Button if Discrepancy or Existing record */}
                    {existingRecord && onOpenDiscrepancyModal && (
                      <button
                        type="button"
                        onClick={() => onOpenDiscrepancyModal(existingRecord)}
                        className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-[#146B50] hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer ml-1"
                        title="Cek Bukti & Detail Absensi Santri Ini"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-stone-900 dark:text-stone-100">
            <span>Konfirmasi Presensi Musyrif:</span>
            <span className="text-[#146B50] dark:text-[#D6A84F]">
              {selectedActivity?.name || 'Kegiatan'}
            </span>
            <span className="text-stone-400 font-mono">({selectedDate})</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Total {stats.hadir} Hadir • {stats.izin} Izin • {stats.alpa} Alpa
            {stats.discrepancies > 0 && (
              <span className="text-amber-600 font-bold ml-1">
                ({stats.discrepancies} perlu diverifikasi)
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:brightness-110 active:scale-95 text-white font-extrabold text-xs transition shadow-lg cursor-pointer border border-[#D6A84F]/40 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-[#D6A84F]" />
          <span>{isSubmitting ? 'Menyimpan Presensi...' : 'Simpan Presensi Musyrif'}</span>
        </button>
      </div>
    </div>
  );
}
