'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { TAHFIDZ_CLASSES } from '@/lib/constants';
import { AttendanceRecord, Profile, TahfidzMode, TahfidzValidationStatus } from '@/types';
import { getWibDateStr, formatIndonesianDate } from '@/lib/schedule';
import {
  BookOpen,
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Edit3,
  Trash2,
  Plus,
  X,
  Share2,
  Check,
  ArrowLeft,
  Clock,
  BookmarkCheck,
  User,
} from 'lucide-react';
import TahfidzWhatsAppModal from '@/components/attendance/TahfidzWhatsAppModal';

export default function MusyrifEditSetoranPage() {
  const {
    currentUser,
    profiles,
    attendanceRecords,
    activities,
    effectiveTime,
    validateTahfidzSetoran,
    deleteSantriAttendance,
  } = useStore();

  const todayStr = getWibDateStr(effectiveTime);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lancar' | 'perlu_diulang' | 'belum'>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Modal Edit Setoran State
  const [editingSantri, setEditingSantri] = useState<Profile | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form Fields inside Edit Modal
  const [formMode, setFormMode] = useState<TahfidzMode>('ziyadah');
  const [formJuz, setFormJuz] = useState<number>(30);
  const [formHalaman, setFormHalaman] = useState<number>(1);
  const [formHalamanEnd, setFormHalamanEnd] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<TahfidzValidationStatus>('lancar');
  const [formNote, setFormNote] = useState<string>('');
  const [formSession, setFormSession] = useState<'pagi' | 'malam'>('pagi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WhatsApp Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Active class config if a specific class is selected
  const activeClassConfig = useMemo(() => {
    return TAHFIDZ_CLASSES.find((c) => c.id === selectedClassId) || null;
  }, [selectedClassId]);

  // All active santri
  const allSantri = useMemo(() => {
    return profiles
      .filter((p) => p.role === 'santri' && p.is_active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [profiles]);

  // Filter santri strictly based on selected class
  const classSantriList = useMemo(() => {
    if (selectedClassId === 'all') {
      return allSantri;
    }
    const cls = TAHFIDZ_CLASSES.find((c) => c.id === selectedClassId);
    if (!cls) return allSantri;

    return allSantri.filter((p) => {
      const letter =
        cls.session === 'pagi'
          ? (p.class_tahfidz_pagi || '').trim().toUpperCase()
          : (p.class_tahfidz_malam || '').trim().toUpperCase();
      return letter === cls.classLetter;
    });
  }, [allSantri, selectedClassId]);

  // Attendance records for the selected date matching tahfidz setoran
  const tahfidzRecordsToday = useMemo(() => {
    const classStudentIds = new Set(classSantriList.map((s) => s.id));

    return attendanceRecords.filter((r) => {
      // Must be in class student set
      if (!classStudentIds.has(r.student_id)) return false;

      // Must match selected operational date
      const rDate = r.operational_date || getWibDateStr(r.submitted_at);
      if (rDate !== selectedDate) return false;

      // Must be setoran record (activity code SETORAN_PAGI / SETORAN_MALAM or has tahfidz_juz)
      const isTahfidz =
        r.tahfidz_juz !== undefined ||
        r.activity_id === 'act-3' ||
        r.activity_id === 'act-7' ||
        (r.activity_name && r.activity_name.toLowerCase().includes('setoran')) ||
        (r.session_id && r.session_id.toLowerCase().includes('setoran'));

      if (!isTahfidz) return false;

      // If specific class selected, ensure it doesn't contradict
      if (activeClassConfig) {
        if (r.tahfidz_class && r.tahfidz_class !== activeClassConfig.id) return false;
        if (activeClassConfig.session === 'pagi') {
          const isMalam =
            r.activity_id === 'act-7' ||
            (r.activity_name && r.activity_name.toLowerCase().includes('malam')) ||
            (r.session_id && r.session_id.toLowerCase().includes('malam'));
          if (isMalam) return false;
        } else if (activeClassConfig.session === 'malam') {
          const isPagi =
            r.activity_id === 'act-3' ||
            (r.activity_name && r.activity_name.toLowerCase().includes('pagi')) ||
            (r.session_id && r.session_id.toLowerCase().includes('pagi'));
          if (isPagi) return false;
        }
      }

      return true;
    });
  }, [attendanceRecords, classSantriList, selectedDate, activeClassConfig]);

  // Pair each santri with their latest setoran record today
  const santriRows = useMemo(() => {
    return classSantriList.map((santri) => {
      const records = tahfidzRecordsToday.filter((r) => r.student_id === santri.id);
      const record = records.length > 0 ? records[records.length - 1] : undefined;
      return {
        santri,
        record,
      };
    });
  }, [classSantriList, tahfidzRecordsToday]);

  // Filtered rows by search and status
  const filteredRows = useMemo(() => {
    return santriRows.filter(({ santri, record }) => {
      // Search filter
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        santri.full_name.toLowerCase().includes(q) ||
        (santri.student_number || '').includes(q) ||
        (santri.group_name || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'lancar') {
        return record && record.tahfidz_status === 'lancar';
      }
      if (statusFilter === 'perlu_diulang') {
        return record && record.tahfidz_status === 'perlu_diulang';
      }
      if (statusFilter === 'belum') {
        return !record || record.tahfidz_status === 'tidak_lancar' || record.status === 'alpa';
      }

      return true;
    });
  }, [santriRows, searchQuery, statusFilter]);

  // Statistics
  const totalSantriInView = classSantriList.length;
  const lancarCount = santriRows.filter(({ record }) => record?.tahfidz_status === 'lancar').length;
  const perluDiulangCount = santriRows.filter(({ record }) => record?.tahfidz_status === 'perlu_diulang').length;
  const belumCount = Math.max(0, totalSantriInView - lancarCount - perluDiulangCount);

  // Open modal to edit existing or add new setoran
  const handleOpenEditModal = (santri: Profile, record?: AttendanceRecord) => {
    setEditingSantri(santri);
    setEditingRecord(record || null);

    if (record) {
      setFormMode(record.tahfidz_mode || 'ziyadah');
      setFormJuz(record.tahfidz_juz || 30);
      setFormHalaman(record.tahfidz_halaman || 1);
      setFormHalamanEnd(record.tahfidz_halaman_end || record.tahfidz_halaman || 1);
      setFormStatus(record.tahfidz_status || 'lancar');
      setFormNote(record.tahfidz_validation_note || record.tahfidz_notes || '');
      setFormSession(
        record.activity_id === 'act-7' || (record.session_id && record.session_id.includes('malam'))
          ? 'malam'
          : 'pagi'
      );
    } else {
      // Default for new setoran
      const defaultSess = activeClassConfig?.session || 'pagi';
      setFormMode('ziyadah');
      setFormJuz(30);
      setFormHalaman(1);
      setFormHalamanEnd(1);
      setFormStatus('lancar');
      setFormNote('');
      setFormSession(defaultSess);
    }

    setIsEditModalOpen(true);
  };

  // Save changes from modal
  const handleSaveModal = async () => {
    if (!editingSantri) return;
    setIsSubmitting(true);

    try {
      const targetSession = formSession;
      const targetActivityId = targetSession === 'malam' ? 'act-7' : 'act-3';
      const targetSessionId = targetSession === 'malam' ? 'ses-setoran-malam' : 'ses-setoran-pagi';

      // Resolve tahfidz class ID
      let resolvedClassId = selectedClassId !== 'all' ? selectedClassId : undefined;
      if (!resolvedClassId) {
        if (targetSession === 'pagi') {
          const ltr = (editingSantri.class_tahfidz_pagi || 'A').trim().toUpperCase();
          resolvedClassId = ltr === 'A' ? 'tahfidz_pagi_a' : 'tahfidz_pagi_b';
        } else {
          const ltr = (editingSantri.class_tahfidz_malam || 'A').trim().toUpperCase();
          resolvedClassId = ltr === 'A' ? 'tahfidz_malam_a' : 'tahfidz_malam_b';
        }
      }

      const recordId = editingRecord
        ? editingRecord.id
        : `rec-tahfidz-manual-${Date.now()}-${editingSantri.id}`;

      const res = await validateTahfidzSetoran({
        recordId,
        studentId: editingSantri.id,
        activityId: targetActivityId,
        sessionId: targetSessionId,
        operationalDate: selectedDate,
        tahfidzClass: resolvedClassId,
        mode: formMode,
        juz: formJuz,
        halaman: formHalaman,
        halamanEnd: formHalamanEnd,
        status: formStatus,
        note: formNote.trim() || undefined,
      });

      setIsEditModalOpen(false);
      setActionSuccessMsg(res.message || `Setoran ${editingSantri.full_name} berhasil disimpan.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-Click Fast ACC
  const handleFastAcc = async (santri: Profile, record?: AttendanceRecord) => {
    const sess = activeClassConfig?.session || 'pagi';
    const targetActivityId = sess === 'malam' ? 'act-7' : 'act-3';
    const targetSessionId = sess === 'malam' ? 'ses-setoran-malam' : 'ses-setoran-pagi';

    let resolvedClassId = selectedClassId !== 'all' ? selectedClassId : undefined;
    if (!resolvedClassId) {
      if (sess === 'pagi') {
        const ltr = (santri.class_tahfidz_pagi || 'A').trim().toUpperCase();
        resolvedClassId = ltr === 'A' ? 'tahfidz_pagi_a' : 'tahfidz_pagi_b';
      } else {
        const ltr = (santri.class_tahfidz_malam || 'A').trim().toUpperCase();
        resolvedClassId = ltr === 'A' ? 'tahfidz_malam_a' : 'tahfidz_malam_b';
      }
    }

    const recId = record?.id || `rec-tahfidz-fast-${Date.now()}-${santri.id}`;
    const res = await validateTahfidzSetoran({
      recordId: recId,
      studentId: santri.id,
      activityId: targetActivityId,
      sessionId: targetSessionId,
      operationalDate: selectedDate,
      tahfidzClass: resolvedClassId,
      mode: record?.tahfidz_mode || 'ziyadah',
      juz: record?.tahfidz_juz || 30,
      halaman: record?.tahfidz_halaman || 1,
      halamanEnd: record?.tahfidz_halaman_end || 1,
      status: 'lancar',
      note: 'ACC cepat oleh musyrif (Lancar)',
    });

    setActionSuccessMsg(res.message || `Setoran ${santri.full_name} berhasil di-ACC (Lancar).`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Delete Setoran
  const handleDeleteRecord = async (record: AttendanceRecord) => {
    if (!window.confirm(`Yakin ingin menghapus data setoran ${record.student_name}?`)) {
      return;
    }
    const res = await deleteSantriAttendance(record.id);
    setActionSuccessMsg(res.message || 'Data setoran berhasil dihapus.');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-[#061F17] via-[#0B3D2E] to-[#146B50] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D6A84F] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-[#D6A84F] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Musyrif Tahfidz</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Edit3 className="w-7 h-7 text-[#D6A84F]" />
              <span>Edit Data Setoran Tahfidz</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Koreksi, perbarui, dan validasi data hafalan santri (Juz, Halaman, Mode Ziyadah/Murojaah, Status
              Lancar/Perlu Diulang). Data otomatis tersinkronisasi dengan raport mutabaah dan WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/musyrif/tahfidz"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Halaqoh Hari Ini</span>
            </Link>

            {selectedClassId !== 'all' && activeClassConfig && (
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 text-xs font-extrabold shadow-md transition active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-stone-900" />
                <span>Rekap WA Kelas</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ── Filter Kelas Switcher Tabs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <button
          onClick={() => setSelectedClassId('all')}
          className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
            selectedClassId === 'all'
              ? 'bg-[#0D7B5F] text-white border-emerald-600 shadow-md ring-2 ring-[#D6A84F]/40'
              : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                selectedClassId === 'all'
                  ? 'bg-white/20 text-emerald-100'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              Semua Sesi
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                selectedClassId === 'all'
                  ? 'bg-emerald-900/60 text-emerald-100'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
              }`}
            >
              {allSantri.length} Santri
            </span>
          </div>
          <h3 className="font-extrabold text-xs sm:text-sm">Semua Kelas</h3>
          <p
            className={`text-[11px] mt-0.5 ${
              selectedClassId === 'all' ? 'text-emerald-200' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            Pagi &amp; Malam
          </p>
        </button>

        {TAHFIDZ_CLASSES.map((cls) => {
          const isActive = cls.id === selectedClassId;
          const isMyClass =
            cls.ustadzId === currentUser?.id || cls.ustadzNickname === currentUser?.nickname;

          const enrolledCount = profiles.filter((p) => {
            if (p.role !== 'santri' || !p.is_active) return false;
            const ltr =
              cls.session === 'pagi'
                ? (p.class_tahfidz_pagi || '').trim().toUpperCase()
                : (p.class_tahfidz_malam || '').trim().toUpperCase();
            return ltr === cls.classLetter;
          }).length;

          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                isActive
                  ? 'bg-[#0D7B5F] text-white border-emerald-600 shadow-md ring-2 ring-[#D6A84F]/40'
                  : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-emerald-100'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {cls.session === 'pagi' ? 'Pagi (Subuh)' : 'Malam (Isya)'}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-emerald-900/60 text-emerald-100'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  {enrolledCount} Santri
                </span>
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm truncate">{cls.name}</h3>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  isActive ? 'text-emerald-200' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {cls.ustadzName} {isMyClass && '• Anda'}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Total Santri</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {totalSantriInView}
          </div>
          <span className="text-[11px] text-stone-400">Dalam filter kelas aktif</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs mb-1">
            <span>Setoran Lancar (ACC)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
            {lancarCount}
          </div>
          <span className="text-[11px] text-emerald-600">Disimak &amp; disahkan</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs mb-1">
            <span>Perlu Diulang</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-200">
            {perluDiulangCount}
          </div>
          <span className="text-[11px] text-amber-600">Perlu murajaah ulang</span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs mb-1">
            <span>Belum Setor</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-800 dark:text-rose-200">
            {belumCount}
          </div>
          <span className="text-[11px] text-rose-600">Belum ada catatan setoran</span>
        </div>
      </div>

      {/* ── Toolbar Search & Filters ── */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri berdasarkan nama, NIS, atau kamar..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#0D7B5F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-stone-700 text-[#0D7B5F] dark:text-emerald-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Semua ({santriRows.length})
            </button>
            <button
              onClick={() => setStatusFilter('lancar')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'lancar'
                  ? 'bg-white dark:bg-stone-700 text-emerald-600 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Lancar ({lancarCount})
            </button>
            <button
              onClick={() => setStatusFilter('perlu_diulang')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'perlu_diulang'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Perlu Diulang ({perluDiulangCount})
            </button>
            <button
              onClick={() => setStatusFilter('belum')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'belum'
                  ? 'bg-white dark:bg-stone-700 text-rose-600 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Belum ({belumCount})
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-stone-800 dark:text-stone-200 outline-none text-xs font-semibold cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Table of Santri Setoran ── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0D7B5F]" />
            <h2 className="text-sm font-extrabold text-stone-800 dark:text-stone-100">
              Daftar Santri &amp; Data Setoran ({filteredRows.length} Santri)
            </h2>
          </div>
          <span className="text-xs text-stone-400">
            Tanggal: <strong>{formatIndonesianDate(new Date(selectedDate))}</strong>
          </span>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-semibold">Tidak ada santri yang sesuai kriteria pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredRows.map(({ santri, record }, idx) => {
              const hasSetoran = !!record && record.tahfidz_juz !== undefined;
              const isLancar = hasSetoran && record.tahfidz_status === 'lancar';
              const isPerluDiulang = hasSetoran && record.tahfidz_status === 'perlu_diulang';

              return (
                <div
                  key={santri.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
                >
                  {/* Left: Info Santri & Detail Setoran */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-stone-400 w-6 shrink-0">
                      {idx + 1}.
                    </span>

                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {santri.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                          {santri.full_name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                          NIS: {santri.student_number || '-'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                          Kamar: {santri.group_name || '-'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/50 dark:border-emerald-800/40">
                          Pagi: {santri.class_tahfidz_pagi || '-'} • Malam: {santri.class_tahfidz_malam || '-'}
                        </span>
                      </div>

                      {/* Detail Data Setoran */}
                      {hasSetoran ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-[#0D7B5F] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                            <BookOpen className="w-3 h-3" />
                            {record.tahfidz_mode === 'murojaah' ? 'Murojaah' : 'Ziyadah'}: Juz{' '}
                            {record.tahfidz_juz} Hal. {record.tahfidz_halaman}
                            {record.tahfidz_halaman_end && record.tahfidz_halaman_end !== record.tahfidz_halaman
                              ? ` - ${record.tahfidz_halaman_end}`
                              : ''}
                          </span>

                          {record.tahfidz_validation_note && (
                            <span className="text-stone-500 dark:text-stone-400 text-[11px] italic">
                              &quot;{record.tahfidz_validation_note}&quot;
                            </span>
                          )}

                          <span className="text-[10px] text-stone-400">
                            Penyimak: {record.tahfidz_ustadz_name || 'Ustadz'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-500 font-medium">
                          Belum ada data setoran hafalan tercatat untuk tanggal ini.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Badge & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
                    {/* Status Badge */}
                    <div>
                      {isLancar ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lancar (Sah)</span>
                        </span>
                      ) : isPerluDiulang ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Perlu Diulang</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
                          <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                          <span>Belum Setor</span>
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Fast ACC */}
                      {!isLancar && (
                        <button
                          onClick={() => handleFastAcc(santri, record)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                          title="ACC langsung bahwa setoran telah disimak & lancar"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ACC Lancar</span>
                        </button>
                      )}

                      {/* Edit / Koreksi Button */}
                      <button
                        onClick={() => handleOpenEditModal(santri, record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{hasSetoran ? 'Edit Setoran' : '+ Input Setoran'}</span>
                      </button>

                      {/* Delete Record if exists */}
                      {record && (
                        <button
                          onClick={() => handleDeleteRecord(record)}
                          title="Hapus rekaman setoran ini"
                          className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL EDIT / INPUT SETORAN ── */}
      {isEditModalOpen && editingSantri && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#061F17] via-[#0B3D2E] to-[#146B50] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-[#D6A84F]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {editingRecord ? 'Koreksi Data Setoran' : 'Input Setoran Baru'}
                  </h3>
                  <p className="text-xs text-emerald-100/80">
                    {editingSantri.full_name} • NIS: {editingSantri.student_number || '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Sesi Kegiatan */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Sesi Waktu Setoran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSession('pagi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formSession === 'pagi'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-[#0D7B5F] dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Setoran Pagi (Subuh)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSession('malam')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formSession === 'malam'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-[#0D7B5F] dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Setoran Malam (Isya)</span>
                  </button>
                </div>
              </div>

              {/* Mode Setoran (Ziyadah / Murojaah) */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Jenis Setoran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMode('ziyadah')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formMode === 'ziyadah'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-[#0D7B5F] dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ziyadah (Hafalan Baru)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode('murojaah')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formMode === 'murojaah'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-[#0D7B5F] dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Murojaah (Mengulang)</span>
                  </button>
                </div>
              </div>

              {/* Input Juz & Halaman */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Juz (1 - 30):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formJuz}
                    onChange={(e) => setFormJuz(Math.min(30, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Hal. Mulai:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={formHalaman}
                    onChange={(e) => {
                      const v = Math.min(604, Math.max(1, Number(e.target.value)));
                      setFormHalaman(v);
                      if (formHalamanEnd < v) setFormHalamanEnd(v);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Hal. Akhir:
                  </label>
                  <input
                    type="number"
                    min={formHalaman}
                    max={604}
                    value={formHalamanEnd}
                    onChange={(e) => setFormHalamanEnd(Math.min(604, Math.max(formHalaman, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  />
                </div>
              </div>

              {/* Status Evaluasi */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Hasil Evaluasi Ustadz:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('lancar')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                      formStatus === 'lancar'
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-400/40'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lancar (Sah)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('perlu_diulang')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                      formStatus === 'perlu_diulang'
                        ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400/40'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>Perlu Diulang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('tidak_lancar')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                      formStatus === 'tidak_lancar'
                        ? 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-800 dark:text-rose-300 ring-2 ring-rose-400/40'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Tidak Lancar</span>
                  </button>
                </div>
              </div>

              {/* Catatan Ustadz */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Catatan Evaluasi / Catatan Ustadz (Opsional):
                </label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Contoh: Lancar, tajwid makhraj huruf sangat baik..."
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Setoran'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp Modal ── */}
      {isWhatsAppModalOpen && activeClassConfig && (
        <TahfidzWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          classNameTitle={activeClassConfig.name}
          ustadzName={activeClassConfig.ustadzName}
          dateStr={selectedDate}
          records={tahfidzRecordsToday}
          santriList={classSantriList}
        />
      )}
    </div>
  );
}

