'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Activity, AttendanceRecord, Profile } from '@/types';
import ManualAttendanceSheet from '@/components/attendance/ManualAttendanceSheet';
import DiscrepancyVerificationModal from '@/components/attendance/DiscrepancyVerificationModal';
import {
  getActivitiesForDate,
  getWibDateStr,
  formatTime24,
  formatIndonesianDate,
  WIB_TIMEZONE,
} from '@/lib/schedule';
import {
  CheckSquare,
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  CheckCheck,
  UserCheck,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Info,
  User,
} from 'lucide-react';

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
  sessionKey: string;
  originalRecord?: AttendanceRecord;
  initialStatus: TargetStatus;
  currentStatus: TargetStatus;
  isModified: boolean;
  note?: string;
}

export default function MusyrifEditPresensiPage() {
  const {
    profiles,
    activities,
    attendanceRecords,
    effectiveTime,
    updateStudentMonthlyAttendance,
    verifyDiscrepancy,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'kegiatan' | 'santri'>('kegiatan');

  // Discrepancy modal state for Tab 1 (Per Kegiatan)
  const [discrepancyRecord, setDiscrepancyRecord] = useState<AttendanceRecord | null>(null);

  // -------------------------------------------------------------
  // TAB 2: State Edit Presensi Per Santri 1 Bulan Penuh
  // -------------------------------------------------------------
  const currentWibMonth = getWibDateStr(effectiveTime).substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentWibMonth);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const santriList = useMemo(() => {
    return profiles.filter((p) => p.role === 'santri');
  }, [profiles]);

  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach((s) => {
      if (s.group_name) set.add(s.group_name);
    });
    return Array.from(set);
  }, [santriList]);

  const filteredSantriList = useMemo(() => {
    return santriList.filter((s) => {
      if (filterGroup !== 'all' && s.group_name !== filterGroup) return false;
      if (searchStudent) {
        const q = searchStudent.toLowerCase();
        const matchName = s.full_name.toLowerCase().includes(q);
        const matchNis = s.student_number?.toLowerCase().includes(q);
        return matchName || matchNis;
      }
      return true;
    });
  }, [santriList, filterGroup, searchStudent]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return santriList[0]?.id || '';
  });

  const selectedStudent = useMemo(() => {
    return santriList.find((s) => s.id === selectedStudentId) || santriList[0];
  }, [santriList, selectedStudentId]);

  // Status perubahan per sessionKey: `${dateStr}_${activityId}` -> { status, note }
  const [modifiedSessions, setModifiedSessions] = useState<
    Record<string, { status: TargetStatus; note?: string }>
  >({});

  const [statusFilter, setStatusFilter] = useState<'all' | 'alpa' | 'izin' | 'modified'>('all');
  const [auditReason, setAuditReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reset perubahan saat berganti santri atau bulan
  useEffect(() => {
    setModifiedSessions({});
    setFeedbackMsg(null);
  }, [selectedStudentId, selectedMonth]);

  // Daftar opsi bulan dinamis (6 bulan ke belakang sampai 1 bulan ke depan)
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const baseDate = effectiveTime instanceof Date ? effectiveTime : new Date();
    const currYear = baseDate.getFullYear();
    const currMonth = baseDate.getMonth();

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

  // Hitung sesi terjadwal dalam bulan terpilih untuk santri terpilih
  const monthSessions = useMemo(() => {
    if (!selectedStudent) return [];

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
      const dayIndex = dt.getDay();
      const dayName = INDO_DAY_NAMES[dayIndex];

      const scheduledActivities = getActivitiesForDate(activities, dateStr);

      for (const act of scheduledActivities) {
        const sessionKey = `${dateStr}_${act.id}`;

        const originalRecord = attendanceRecords.find(
          (r) =>
            r.student_id === selectedStudent.id &&
            r.activity_id === act.id &&
            r.operational_date === dateStr
        );

        let initialStatus: TargetStatus = 'alpa';
        if (originalRecord) {
          if (
            originalRecord.musyrif_status === 'hadir' ||
            originalRecord.status === 'hadir_valid' ||
            originalRecord.attendance_type === 'hadir'
          ) {
            initialStatus = 'hadir';
          } else if (
            originalRecord.musyrif_status === 'izin' ||
            originalRecord.status === 'izin_disetujui' ||
            originalRecord.status === 'izin_diajukan' ||
            originalRecord.attendance_type === 'izin'
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
  }, [selectedMonth, activities, attendanceRecords, selectedStudent, modifiedSessions]);

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

  // Filter sesi
  const filteredSessions = useMemo(() => {
    return monthSessions.filter((s) => {
      if (statusFilter === 'alpa') return s.currentStatus === 'alpa';
      if (statusFilter === 'izin') return s.currentStatus === 'izin';
      if (statusFilter === 'modified') return s.isModified;
      return true;
    });
  }, [monthSessions, statusFilter]);

  // Kelompokkan sesi per tanggal
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
  const handleSaveMonthly = async () => {
    if (!selectedStudent) return;
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
        studentId: selectedStudent.id,
        monthKey: selectedMonth,
        updates,
        reason:
          auditReason.trim() ||
          `Penyesuaian rekap absensi santri oleh Musyrif untuk bulan ${selectedMonth}`,
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: res.message,
        });
        setModifiedSessions({});
        setAuditReason('');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ── HEADER HALAMAN ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#082F23] to-[#146B50] p-6 text-white shadow-md border border-[#D4A24C]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A24C] text-[#082F23] mb-2 shadow-xs">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Pusat Kendali Presensi Musyrif</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Edit Presensi Santri
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
            Kelola dan koreksi absensi resmi santri: baik per sesi kegiatan harian (batch) maupun per santri dalam 1 bulan penuh.
          </p>
        </div>

        {/* Live WIB Clock Indicator */}
        <div className="bg-black/20 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 shrink-0 text-right">
          <div className="flex items-center gap-2 justify-end text-emerald-300 text-xs font-mono">
            <Clock className="w-4 h-4 text-[#D4A24C]" />
            <span className="font-bold">{formatTime24(effectiveTime)} WIB</span>
          </div>
          <p className="text-[11px] text-emerald-100/70 mt-0.5">
            {formatIndonesianDate(effectiveTime)}
          </p>
        </div>
      </div>

      {/* ── TAB SELECTOR: PER KEGIATAN VS PER SANTRI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('kegiatan')}
          className={`flex items-start gap-3.5 p-4 rounded-3xl border transition cursor-pointer text-left ${
            activeTab === 'kegiatan'
              ? 'bg-white dark:bg-stone-900 border-[#146B50] shadow-md ring-2 ring-[#146B50]/20'
              : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:bg-stone-100 opacity-75'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              activeTab === 'kegiatan'
                ? 'bg-[#146B50] text-white shadow-xs'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Edit Presensi per Kegiatan
              </h3>
              {activeTab === 'kegiatan' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
              Pilih tanggal & sesi kegiatan untuk input atau koreksi kehadiran seluruh santri secara serentak.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('santri')}
          className={`flex items-start gap-3.5 p-4 rounded-3xl border transition cursor-pointer text-left ${
            activeTab === 'santri'
              ? 'bg-white dark:bg-stone-900 border-[#146B50] shadow-md ring-2 ring-[#146B50]/20'
              : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:bg-stone-100 opacity-75'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              activeTab === 'santri'
                ? 'bg-[#146B50] text-white shadow-xs'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Edit Presensi per Santri (1 Bulan)
              </h3>
              {activeTab === 'santri' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
              Pilih satu santri dan bulan tertentu untuk merekap dan mengubah status seluruh hari dalam 1 layar.
            </p>
          </div>
        </button>
      </div>

      {/* ── TAB 1: PER KEGIATAN (SESI HARIAN) ── */}
      {activeTab === 'kegiatan' && (
        <div className="space-y-4">
          <ManualAttendanceSheet
            onOpenDiscrepancyModal={(rec) => setDiscrepancyRecord(rec)}
          />

          {discrepancyRecord && (
            <DiscrepancyVerificationModal
              record={discrepancyRecord}
              onClose={() => setDiscrepancyRecord(null)}
              onVerify={async (recId, finalStatus, note) => {
                await verifyDiscrepancy(recId, finalStatus, note);
                setDiscrepancyRecord(null);
              }}
            />
          )}
        </div>
      )}

      {/* ── TAB 2: PER SANTRI (1 BULAN PENUH) ── */}
      {activeTab === 'santri' && (
        <div className="space-y-5">
          {/* Bar Pemilih Santri & Bulan */}
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              {/* Filter Bulan */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#146B50]" />
                  <span>Pilih Bulan:</span>
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} {m.key === currentWibMonth ? '(Bulan Berjalan)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Kamar & Search Santri */}
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
                >
                  <option value="all">Semua Kamar / Asrama</option>
                  {groupOptions.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Cari santri / NIS..."
                    className="text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50] w-full sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Selector Santri Dropdown */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 whitespace-nowrap">
                Santri yang Diedit:
              </span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs font-black px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-[#146B50] dark:text-emerald-300 outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer flex-1"
              >
                {filteredSantriList.map((st) => (
                  <option key={st.id} value={st.id} className="dark:bg-stone-800 text-stone-900 dark:text-white">
                    {st.full_name} ({st.group_name || 'Santri'} • NIS: {st.student_number || '-'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Student Banner & Live Stats */}
          {selectedStudent && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
              
              {/* Header Santri */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-50 to-stone-100/60 dark:from-stone-800/60 dark:to-stone-800/20 border-b border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#082F23] text-emerald-200 flex items-center justify-center font-black text-lg overflow-hidden shrink-0 shadow-inner">
                    {selectedStudent.avatar_url ? (
                      <img
                        src={selectedStudent.avatar_url}
                        alt={selectedStudent.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedStudent.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
                        {selectedStudent.full_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A24C] text-[#082F23]">
                        {selectedStudent.group_name || 'Kamar Santri'}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        NIS: {selectedStudent.student_number || '-'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Rekapitulasi Absensi: <strong className="text-stone-700 dark:text-stone-300">{selectedMonthLabel}</strong>
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMarkAllMonthHadir}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                    title="Tandai seluruh sesi aktif bulan ini menjadi Hadir"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Set Semua Hadir</span>
                  </button>

                  {stats.modifiedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setModifiedSessions({})}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-200 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Cards Bulan Terpilih */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                <div className="bg-white dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Sesi</p>
                  <p className="text-lg font-black text-stone-800 dark:text-white mt-0.5">{stats.total}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Hadir (x1)</p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.hadir}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Izin (x0.5)</p>
                  <p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">{stats.izin}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-800 text-center">
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Alpa (x0)</p>
                  <p className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">{stats.alpa}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#146B50]/15 to-[#082F23]/25 p-3 rounded-2xl border border-[#146B50]/30 text-center">
                  <p className="text-[10px] text-[#146B50] dark:text-emerald-400 font-bold uppercase tracking-wider">Nilai Skor</p>
                  <p className="text-lg font-black text-[#146B50] dark:text-emerald-300 mt-0.5">{stats.score}%</p>
                </div>
              </div>

              {/* Toolbar Filter Tampilan Sesi */}
              <div className="p-3 sm:px-5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filter Sesi:
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    Semua ({monthSessions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('alpa')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'alpa'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    Alpa ({stats.alpa})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('izin')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'izin'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    Izin ({stats.izin})
                  </button>
                  {stats.modifiedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('modified')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        statusFilter === 'modified'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      Diubah ({stats.modifiedCount})
                    </button>
                  )}
                </div>

                {stats.modifiedCount > 0 && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{stats.modifiedCount} sesi diubah (belum disimpan)</span>
                  </span>
                )}
              </div>

              {/* Feedback Banner */}
              {feedbackMsg && (
                <div
                  className={`p-3 text-xs font-bold flex items-center gap-2 ${
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

              {/* Daftar Sesi per Tanggal */}
              <div className="p-4 sm:p-5 space-y-3 max-h-[600px] overflow-y-auto">
                {groupedByDate.length === 0 ? (
                  <div className="text-center py-10 text-stone-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Tidak ada sesi untuk filter ini.</p>
                  </div>
                ) : (
                  groupedByDate.map((group) => {
                    const allDayHadir = group.sessions.every((s) => s.currentStatus === 'hadir');

                    return (
                      <div
                        key={group.dateStr}
                        className="bg-stone-50/70 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-3 sm:p-4 transition hover:border-[#146B50]/40"
                      >
                        {/* Header Hari */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/60 dark:border-stone-700/60">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xs font-black text-stone-800 dark:text-stone-200 shadow-2xs">
                              {group.dayNumber}
                            </span>
                            <span className="text-xs font-black text-stone-800 dark:text-stone-200">
                              {group.dayName}, {group.dayNumber} {selectedMonthLabel}
                            </span>
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

                        {/* List Sesi */}
                        <div className="space-y-2">
                          {group.sessions.map((item) => {
                            const isModified = item.isModified;

                            return (
                              <div
                                key={item.sessionKey}
                                className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                  isModified
                                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 shadow-xs'
                                    : 'bg-white dark:bg-stone-900 border-stone-200/70 dark:border-stone-800'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-stone-800 dark:text-stone-200">
                                      {item.activity.name}
                                    </span>
                                    <span className="text-[11px] text-stone-400 font-mono">
                                      {formatTime24(item.activity.start_time)} - {formatTime24(item.activity.end_time)} WIB
                                    </span>
                                    {isModified && (
                                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-500 text-white uppercase tracking-wider">
                                        Diubah
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-2">
                                    <span>
                                      Asli:{' '}
                                      <strong className="capitalize text-stone-600 dark:text-stone-300">
                                        {item.originalRecord
                                          ? item.originalRecord.musyrif_status || item.originalRecord.status
                                          : 'Belum Absen (Alpa)'}
                                      </strong>
                                    </span>
                                    {item.note && (
                                      <span className="italic text-stone-400 truncate max-w-xs">
                                        • &quot;{item.note}&quot;
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 3-Way Segmented Control */}
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
                                        : 'text-stone-600 dark:text-stone-400 hover:text-emerald-600'
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
                                        : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
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
                                        : 'text-stone-600 dark:text-stone-400 hover:text-rose-600'
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

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="Catatan / Alasan koreksi musyrif (cth: Surat izin sakit / Dispensasi)..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
                />

                <button
                  type="button"
                  onClick={handleSaveMonthly}
                  disabled={isSubmitting || stats.modifiedCount === 0}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md active:scale-95 cursor-pointer shrink-0 ${
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
          )}
        </div>
      )}

    </div>
  );
}
