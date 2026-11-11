'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Profile, Activity, AttendanceRecord } from '@/types';
import { getActivitiesForDate, getWibDateStr, formatTime24, WIB_TIMEZONE } from '@/lib/schedule';
import {
  X,
  Calendar,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCheck,
  RotateCcw,
  User,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface MonthlyAttendanceEditorModalProps {
  student: Profile;
  initialMonthKey?: string; // Format 'YYYY-MM', misal '2026-11'
  onClose: () => void;
  onSaved?: () => void;
}

const INDO_DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const MONTH_NAMES = [
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

type TargetStatus = 'hadir' | 'izin' | 'alpa';

interface DaySessionItem {
  dateStr: string;
  dayNumber: number;
  dayName: string;
  activity: Activity;
  sessionKey: string; // `${dateStr}_${activity.id}`
  originalRecord?: AttendanceRecord;
  initialStatus: TargetStatus;
  currentStatus: TargetStatus;
  isModified: boolean;
  note?: string;
}

export default function MonthlyAttendanceEditorModal({
  student,
  initialMonthKey,
  onClose,
  onSaved,
}: MonthlyAttendanceEditorModalProps) {
  const {
    activities,
    attendanceRecords,
    effectiveTime,
    updateStudentMonthlyAttendance,
  } = useStore();

  const currentWibMonth = getWibDateStr(effectiveTime).substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonthKey || currentWibMonth
  );

  // Status perubahan per sessionKey: `${dateStr}_${activityId}` -> { status, note }
  const [modifiedSessions, setModifiedSessions] = useState<
    Record<string, { status: TargetStatus; note?: string }>
  >({});

  const [filterType, setFilterType] = useState<
    'all' | 'alpa' | 'izin' | 'modified'
  >('all');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reset modified sessions saat berganti bulan
  useEffect(() => {
    setModifiedSessions({});
    setFeedbackMsg(null);
  }, [selectedMonth]);

  // Bangun daftar bulan yang tersedia (6 bulan ke belakang sampai 1 bulan ke depan)
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const baseDate = new Date();
    const currYear = baseDate.getFullYear();
    const currMonth = baseDate.getMonth(); // 0-indexed

    for (let offset = -5; offset <= 1; offset++) {
      const d = new Date(currYear, currMonth + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[m - 1]} ${y}`;
      list.push({ key, label });
    }
    return list;
  }, []);

  // Hitung sesi terjadwal dalam bulan terpilih
  const monthSessions = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const totalDays = new Date(y, m, 0).getDate();

    const items: DaySessionItem[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayStr}`;

      // Ambil hari dalam WIB
      const dt = new Date(`${dateStr}T12:00:00+07:00`);
      const dayIndex = dt.getDay(); // 0=Ahad..6=Sabtu
      const dayName = INDO_DAY_NAMES[dayIndex];

      // Kegiatan yang aktif di tanggal ini sesuai jadwal
      const scheduledActivities = getActivitiesForDate(activities, dateStr);

      for (const act of scheduledActivities) {
        const sessionKey = `${dateStr}_${act.id}`;

        // Cari record yang ada di store
        const originalRecord = attendanceRecords.find(
          (r) =>
            r.student_id === student.id &&
            r.activity_id === act.id &&
            (r.operational_date?.substring(0, 10) === dateStr.substring(0, 10) ||
             r.session_id?.includes(dateStr.substring(0, 10)))
        );

        let initialStatus: TargetStatus = 'alpa';
        if (originalRecord) {
          if (
            originalRecord.musyrif_status === 'hadir' ||
            originalRecord.status === 'hadir_valid' ||
            originalRecord.attendance_type === 'hadir' ||
            originalRecord.santri_status === 'hadir_valid'
          ) {
            initialStatus = 'hadir';
          } else if (
            originalRecord.musyrif_status === 'izin' ||
            originalRecord.status === 'izin_disetujui' ||
            originalRecord.status === 'izin_diajukan' ||
            originalRecord.attendance_type === 'izin' ||
            originalRecord.santri_status === 'izin_diajukan'
          ) {
            initialStatus = 'izin';
          } else {
            initialStatus = 'alpa';
          }
        }

        const isUserModified = sessionKey in modifiedSessions;
        const currentStatus = isUserModified
          ? modifiedSessions[sessionKey].status
          : initialStatus;
        const note = isUserModified
          ? modifiedSessions[sessionKey].note
          : originalRecord?.review_note || originalRecord?.permission_reason;

        items.push({
          dateStr,
          dayNumber: day,
          dayName,
          activity: act,
          sessionKey,
          originalRecord,
          initialStatus,
          currentStatus,
          isModified: isUserModified && currentStatus !== initialStatus,
          note,
        });
      }
    }

    return items;
  }, [selectedMonth, activities, attendanceRecords, student.id, modifiedSessions]);

  // Statistik bulan ini
  const stats = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let alpa = 0;
    let modifiedCount = 0;

    monthSessions.forEach((s) => {
      if (s.currentStatus === 'hadir') hadir++;
      else if (s.currentStatus === 'izin') izin++;
      else alpa++;

      if (s.isModified) modifiedCount++;
    });

    const total = monthSessions.length;
    const score = total > 0 ? Math.round(((hadir * 1 + izin * 0.5) / total) * 100) : 0;

    return { total, hadir, izin, alpa, score, modifiedCount };
  }, [monthSessions]);

  // Handler ubah 1 sesi
  const handleSetSessionStatus = (
    sessionKey: string,
    newStatus: TargetStatus,
    initialStatus: TargetStatus
  ) => {
    setModifiedSessions((prev) => {
      const next = { ...prev };
      if (newStatus === initialStatus) {
        delete next[sessionKey];
      } else {
        next[sessionKey] = {
          ...(next[sessionKey] || {}),
          status: newStatus,
        };
      }
      return next;
    });
  };

  // Handler tandai semua sesi di 1 hari menjadi Hadir
  const handleMarkDayAllHadir = (dateStr: string) => {
    const daySessions = monthSessions.filter((s) => s.dateStr === dateStr);
    setModifiedSessions((prev) => {
      const next = { ...prev };
      daySessions.forEach((s) => {
        if (s.initialStatus === 'hadir') {
          delete next[s.sessionKey];
        } else {
          next[s.sessionKey] = {
            ...(next[s.sessionKey] || {}),
            status: 'hadir',
          };
        }
      });
      return next;
    });
  };

  // Handler bulk: Tandai semua sesi dalam 1 bulan menjadi Hadir
  const handleMarkAllMonthHadir = () => {
    setModifiedSessions((prev) => {
      const next = { ...prev };
      monthSessions.forEach((s) => {
        if (s.initialStatus === 'hadir') {
          delete next[s.sessionKey];
        } else {
          next[s.sessionKey] = {
            ...(next[s.sessionKey] || {}),
            status: 'hadir',
          };
        }
      });
      return next;
    });
  };

  // Handler Reset semua perubahan yang belum disimpan
  const handleResetModifications = () => {
    setModifiedSessions({});
  };

  // Filter tampilan sesi
  const filteredSessions = useMemo(() => {
    return monthSessions.filter((s) => {
      if (filterType === 'alpa') return s.currentStatus === 'alpa';
      if (filterType === 'izin') return s.currentStatus === 'izin';
      if (filterType === 'modified') return s.isModified;
      return true;
    });
  }, [monthSessions, filterType]);

  // Kelompokkan sesi per tanggal untuk tampilan yang teratur
  const groupedByDate = useMemo(() => {
    const groups: {
      dateStr: string;
      dayNumber: number;
      dayName: string;
      sessions: DaySessionItem[];
    }[] = [];

    filteredSessions.forEach((item) => {
      let g = groups.find((grp) => grp.dateStr === item.dateStr);
      if (!g) {
        g = {
          dateStr: item.dateStr,
          dayNumber: item.dayNumber,
          dayName: item.dayName,
          sessions: [],
        };
        groups.push(g);
      }
      g.sessions.push(item);
    });

    return groups;
  }, [filteredSessions]);

  // Simpan perubahan ke Store & Supabase
  const handleSave = async () => {
    const sessionKeysToUpdate = Object.keys(modifiedSessions);
    if (sessionKeysToUpdate.length === 0) {
      setFeedbackMsg({
        type: 'error',
        text: 'Tidak ada perubahan status absensi yang perlu disimpan.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const updates = sessionKeysToUpdate.map((key) => {
      const [dateStr, activityId] = key.split('_');
      return {
        dateStr,
        activityId,
        status: modifiedSessions[key].status,
        note: modifiedSessions[key].note,
      };
    });

    try {
      const res = await updateStudentMonthlyAttendance({
        studentId: student.id,
        monthKey: selectedMonth,
        updates,
        reason:
          reason.trim() ||
          `Penyesuaian data absensi santri oleh Musyrif untuk bulan ${selectedMonth}`,
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: res.message,
        });
        setModifiedSessions({});
        if (onSaved) onSaved();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.message || 'Gagal menyimpan pembaruan absensi.',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan sistem saat menyimpan data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMonthObj = availableMonths.find((m) => m.key === selectedMonth);
  const selectedMonthLabel = selectedMonthObj ? selectedMonthObj.label : selectedMonth;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[92vh] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#082F23] to-[#146B50] text-white flex items-start justify-between relative shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg text-emerald-200 shadow-inner overflow-hidden shrink-0">
              {student.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={student.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-emerald-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {student.full_name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A24C] text-[#082F23]">
                  {student.group_name || 'Kamar Santri'}
                </span>
                <span className="text-xs text-emerald-200/80 font-mono">
                  NIS: {student.student_number || '-'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Panel Koreksi Absensi Bulanan Musyrif (Full 1 Bulan)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer ml-2"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Selector Bulan */}
        <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 shrink-0 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 px-3 py-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs">
              <Calendar className="w-4 h-4 text-[#146B50]" />
              <label htmlFor="month-select" className="text-xs font-bold text-stone-500 sr-only">
                Pilih Bulan
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold bg-transparent text-stone-800 dark:text-stone-200 outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="dark:bg-stone-800 text-stone-900 dark:text-white">
                    {m.label} {m.key === currentWibMonth ? '(Bulan Berjalan)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Bulk Month Action */}
            <button
              onClick={handleMarkAllMonthHadir}
              type="button"
              className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="Tandai seluruh sesi aktif bulan ini menjadi Hadir"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Set Semua Hadir</span>
              <span className="sm:hidden">Semua Hadir</span>
            </button>

            {stats.modifiedCount > 0 && (
              <button
                onClick={handleResetModifications}
                type="button"
                className="flex items-center gap-1 px-2.5 py-2 rounded-2xl border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition active:scale-95 cursor-pointer"
                title="Batalkan perubahan yang belum disimpan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Filter Status Sesi */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                  : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300'
              }`}
            >
              Semua ({monthSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('alpa')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'alpa'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              Alpa ({stats.alpa})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('izin')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'izin'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
              }`}
            >
              Izin ({stats.izin})
            </button>
            {stats.modifiedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('modified')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterType === 'modified'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200'
                }`}
              >
                Diubah ({stats.modifiedCount})
              </button>
            )}
          </div>
        </div>

        {/* Live Monthly Stats KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:px-5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-2xl border border-stone-100 dark:border-stone-800 text-center">
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Total Sesi</p>
            <p className="text-base sm:text-lg font-black text-stone-800 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Hadir (x1)</p>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {stats.hadir}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-center">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Izin (x0.5)</p>
            <p className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
              {stats.izin}
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-center">
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Alpa (x0)</p>
            <p className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">
              {stats.alpa}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#146B50]/15 to-[#082F23]/20 p-2.5 rounded-2xl border border-[#146B50]/30 text-center">
            <p className="text-[10px] text-[#146B50] dark:text-emerald-400 font-bold uppercase tracking-wider">Skor Akhir</p>
            <p className="text-base sm:text-lg font-black text-[#146B50] dark:text-emerald-300 mt-0.5">
              {stats.score}%
            </p>
          </div>
        </div>

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Scrollable Day-by-Day Sessions Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {groupedByDate.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-40 text-stone-400" />
              <p className="text-sm font-bold">Tidak ada data sesi untuk filter ini.</p>
              <p className="text-xs text-stone-500 mt-1">
                Ubah filter status atau pilih bulan lain.
              </p>
            </div>
          ) : (
            groupedByDate.map((group) => {
              const allDayHadir = group.sessions.every(
                (s) => s.currentStatus === 'hadir'
              );

              return (
                <div
                  key={group.dateStr}
                  className="bg-stone-50/70 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-3 sm:p-4 transition hover:border-[#146B50]/40"
                >
                  {/* Header Tanggal */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-200/60 dark:border-stone-700/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center font-bold shadow-2xs">
                        <span className="text-[9px] uppercase text-stone-400 font-bold leading-none">
                          {group.dayName.substring(0, 3)}
                        </span>
                        <span className="text-xs text-stone-800 dark:text-stone-200 font-black leading-none mt-0.5">
                          {group.dayNumber}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-stone-800 dark:text-stone-200">
                          {group.dayName}, {group.dayNumber} {selectedMonthLabel}
                        </h4>
                        <p className="text-[10px] text-stone-500">
                          {group.sessions.length} kegiatan terjadwal
                        </p>
                      </div>
                    </div>

                    {!allDayHadir && (
                      <button
                        type="button"
                        onClick={() => handleMarkDayAllHadir(group.dateStr)}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-100/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95"
                      >
                        ✓ Hadirkan Hari Ini
                      </button>
                    )}
                  </div>

                  {/* Sesi-Sesi Kegiatan Pada Hari Ini */}
                  <div className="space-y-2">
                    {group.sessions.map((item) => {
                      const isModified = item.isModified;

                      return (
                        <div
                          key={item.sessionKey}
                          className={`p-2.5 sm:p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isModified
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                              : 'bg-white dark:bg-stone-900 border-stone-200/70 dark:border-stone-800'
                          }`}
                        >
                          {/* Info Kegiatan */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-stone-800 dark:text-stone-200">
                                {item.activity.name}
                              </span>
                              <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {formatTime24(item.activity.start_time)} - {formatTime24(item.activity.end_time)} WIB
                              </span>
                              {isModified && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-500 text-white uppercase tracking-wider">
                                  Diubah
                                </span>
                              )}
                            </div>

                            {/* Status Awal / Catatan */}
                            <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>
                                Asli:{' '}
                                <strong className="capitalize text-stone-600 dark:text-stone-300">
                                  {item.originalRecord
                                    ? item.originalRecord.musyrif_status || item.originalRecord.status
                                    : 'Belum Ada Data (Alpa)'}
                                </strong>
                              </span>
                              {item.note && (
                                <span className="italic text-stone-400 truncate max-w-xs">
                                  • &quot;{item.note}&quot;
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Segmented Control 3-Way: Hadir / Izin / Alpa */}
                          <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0 sm:w-64">
                            <button
                              type="button"
                              onClick={() =>
                                handleSetSessionStatus(
                                  item.sessionKey,
                                  'hadir',
                                  item.initialStatus
                                )
                              }
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                item.currentStatus === 'hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Hadir</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSetSessionStatus(
                                  item.sessionKey,
                                  'izin',
                                  item.initialStatus
                                )
                              }
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                item.currentStatus === 'izin'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>Izin</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSetSessionStatus(
                                  item.sessionKey,
                                  'alpa',
                                  item.initialStatus
                                )
                              }
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                item.currentStatus === 'alpa'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Alpa</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal: Audit Note & Action Buttons */}
        <div className="p-3 sm:p-5 bg-stone-50 dark:bg-stone-800/70 border-t border-stone-200 dark:border-stone-800 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Audit Note Input */}
          <div className="flex-1">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Catatan / Alasan koreksi musyrif (cth: Surat izin sakit / Dispensasi lomba)..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || stats.modifiedCount === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md active:scale-95 cursor-pointer ${
                stats.modifiedCount > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39]'
                  : 'bg-stone-400 dark:bg-stone-700 cursor-not-allowed opacity-70'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : `Simpan Perubahan (${stats.modifiedCount})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
