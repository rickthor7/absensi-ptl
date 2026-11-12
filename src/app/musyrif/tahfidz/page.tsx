'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { TAHFIDZ_CLASSES } from '@/lib/constants';
import { TahfidzClassId, AttendanceRecord, Profile } from '@/types';
import TahfidzWhatsAppModal from '@/components/attendance/TahfidzWhatsAppModal';
import TahfidzValidationModal from '@/components/attendance/TahfidzValidationModal';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import { getWibDateStr } from '@/lib/schedule';
import {
  BookOpen,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Calendar,
  Users,
  ChevronRight,
  Eye,
  MessageSquare,
  ShieldCheck,
  Send,
  Plus,
} from 'lucide-react';

export default function MusyrifTahfidzPage() {
  const {
    currentUser,
    profiles,
    attendanceRecords,
    activities,
    effectiveTime,
    validateTahfidzSetoran,
  } = useStore();

  const todayStr = getWibDateStr(effectiveTime);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'menunggu' | 'sudah' | 'belum'>('all');

  // Determine initial active class: user's assigned class or the first class
  const initialClassId: TahfidzClassId = useMemo(() => {
    if (currentUser?.tahfidz_assigned_class) {
      return currentUser.tahfidz_assigned_class as TahfidzClassId;
    }
    const matchedClass = TAHFIDZ_CLASSES.find(
      (c) => c.ustadzId === currentUser?.id || c.ustadzNickname === currentUser?.nickname
    );
    if (matchedClass) {
      return matchedClass.id;
    }
    return 'tahfidz_pagi_a';
  }, [currentUser]);

  const [activeClassId, setActiveClassId] = useState<TahfidzClassId>(initialClassId);

  // Modals state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [validatingRecord, setValidatingRecord] = useState<AttendanceRecord | null>(null);
  const [viewingDetailRecord, setViewingDetailRecord] = useState<AttendanceRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const activeClassConfig = TAHFIDZ_CLASSES.find((c) => c.id === activeClassId)!;
  const currentActivity = activities.find((a) => a.code === activeClassConfig?.activityCode);

  // List santri belonging to this tahfidz class
  const santriList = useMemo(() => {
    // 1. Santri explicitly assigned to this class letter in profiles
    const assigned = profiles.filter((p) => {
      if (p.role !== 'santri') return false;
      const letter =
        activeClassConfig.session === 'pagi'
          ? (p.class_tahfidz_pagi || '').trim().toUpperCase()
          : (p.class_tahfidz_malam || '').trim().toUpperCase();
      return letter === activeClassConfig.classLetter;
    });

    if (assigned.length > 0) {
      return assigned.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    // Fallback: only if no santri has halaqoh set in profiles yet, distribute evenly so page isn't empty
    const allSantri = profiles.filter((p) => p.role === 'santri');
    const hasAnyAssignments = profiles.some((p) => {
      const val =
        activeClassConfig.session === 'pagi'
          ? (p.class_tahfidz_pagi || '').trim()
          : (p.class_tahfidz_malam || '').trim();
      return val && val !== '-';
    });

    if (!hasAnyAssignments && allSantri.length > 0) {
      const isClassA = activeClassConfig.classLetter === 'A';
      const half = Math.ceil(allSantri.length / 2);
      const splitList = isClassA ? allSantri.slice(0, half) : allSantri.slice(half);
      return splitList.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    return assigned;
  }, [profiles, activeClassConfig]);

  // Attendance records for this class and date
  const classAttendanceRecords = useMemo(() => {
    const actCode = activeClassConfig.activityCode.toLowerCase();
    const classStudentIds = new Set(santriList.map((s) => s.id));

    return attendanceRecords.filter((r) => {
      // Must be a santri belonging strictly to this class
      if (!classStudentIds.has(r.student_id)) return false;

      // Must match selected operational date
      const rDate = r.operational_date || getWibDateStr(r.submitted_at);
      if (rDate !== selectedDate) return false;

      // If record specifies a tahfidz_class that belongs to another class, exclude it
      if (r.tahfidz_class && r.tahfidz_class !== activeClassId) return false;

      const matchesActivity =
        (currentActivity && r.activity_id === currentActivity.id) ||
        (r.session_id && r.session_id.toLowerCase().includes(actCode)) ||
        (activeClassConfig.session === 'pagi' &&
          (r.activity_name?.toLowerCase().includes('setoran pagi') ||
            r.session_id?.toLowerCase().includes('setoran_pagi') ||
            r.activity_id === 'act-3')) ||
        (activeClassConfig.session === 'malam' &&
          (r.activity_name?.toLowerCase().includes('setoran malam') ||
            r.session_id?.toLowerCase().includes('setoran_malam') ||
            r.activity_id === 'act-7'));

      return matchesActivity;
    });
  }, [attendanceRecords, currentActivity, activeClassConfig, selectedDate, activeClassId, santriList]);

  // Map each santri to their attendance record (if any)
  const santriSetoranData = useMemo(() => {
    return santriList.map((santri) => {
      const studentRecords = classAttendanceRecords.filter((r) => r.student_id === santri.id);
      const record =
        studentRecords.length > 0 ? studentRecords[studentRecords.length - 1] : undefined;
      return {
        santri,
        record,
      };
    });
  }, [santriList, classAttendanceRecords]);

  // Filtered by search and status
  const filteredData = useMemo(() => {
    return santriSetoranData.filter(({ santri, record }) => {
      const matchSearch =
        santri.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (santri.student_number || '').includes(searchQuery) ||
        (santri.nickname && santri.nickname.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      const isAcc =
        record &&
        (record.tahfidz_status === 'lancar' || record.tahfidz_status === 'perlu_diulang');
      const isMenunggu =
        record &&
        !isAcc &&
        (record.tahfidz_status === 'menunggu_validasi' ||
          record.status === 'perlu_tinjauan' ||
          (record.status === 'hadir_valid' && record.tahfidz_status !== 'tidak_lancar'));
      const isBelum = !record || record.tahfidz_status === 'tidak_lancar' || record.status === 'alpa';

      if (statusFilter === 'all') return true;
      if (statusFilter === 'menunggu') return isMenunggu;
      if (statusFilter === 'sudah') return isAcc;
      if (statusFilter === 'belum') return isBelum;
      return true;
    });
  }, [santriSetoranData, searchQuery, statusFilter]);

  // Metrics
  const totalSantri = santriList.length;
  const sudahSetorCount = santriSetoranData.filter(
    ({ record }) =>
      record &&
      (record.tahfidz_status === 'lancar' || record.tahfidz_status === 'perlu_diulang')
  ).length;
  const menungguCount = santriSetoranData.filter(
    ({ record }) =>
      record &&
      (record.tahfidz_status === 'menunggu_validasi' ||
        (!record.tahfidz_status && !!record.tahfidz_juz) ||
        (record.status === 'hadir_valid' &&
          record.tahfidz_status !== 'lancar' &&
          record.tahfidz_status !== 'perlu_diulang' &&
          record.tahfidz_status !== 'tidak_lancar'))
  ).length;
  const belumCount = Math.max(0, totalSantri - sudahSetorCount - menungguCount);

  // 1-Click Fast ACC
  const handleFastAcc = async (record: AttendanceRecord) => {
    await validateTahfidzSetoran({
      recordId: record.id,
      status: 'lancar',
      note: 'Telah disimak dan di-ACC',
    });
    setActionSuccessMsg(`Alhamdulillah! Setoran ananda ${record.student_name} berhasil di-ACC.`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Open input setoran modal for santri without attendance record yet
  const handleOpenNewSetoran = (santri: Profile) => {
    const draftRecord: AttendanceRecord = {
      id: `draft-tahfidz-${Date.now()}-${santri.id}`,
      student_id: santri.id,
      student_name: santri.full_name,
      activity_id: currentActivity?.id || (activeClassConfig.session === 'pagi' ? 'act-3' : 'act-7'),
      activity_name: activeClassConfig.activityName,
      session_id: activeClassConfig.session === 'pagi' ? 'ses-setoran-pagi' : 'ses-setoran-malam',
      operational_date: selectedDate,
      submitted_at: `${selectedDate}T06:00:00+07:00`,
      status: 'hadir_valid',
      attendance_type: 'hadir',
      photo_path: santri.avatar_url || '',
      latitude: 0,
      longitude: 0,
      gps_accuracy_m: 0,
      location_captured_at: `${selectedDate}T06:00:00+07:00`,
      distance_from_site_m: 0,
      is_verified: true,
      tahfidz_mode: 'ziyadah',
      tahfidz_juz: 30,
      tahfidz_halaman: 1,
      tahfidz_halaman_end: 1,
      tahfidz_class: activeClassId,
      tahfidz_ustadz_name: activeClassConfig.ustadzName,
      tahfidz_status: 'lancar',
    };
    setValidatingRecord(draftRecord);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D6A84F] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-[#D6A84F] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Musyrif Tahfidz Al-Qur'an</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Halaqoh & Validasi Setoran
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Tinjau dan ACC absensi setoran mandiri santri. Data yang telah di-ACC dapat langsung
              direkap dan dibagikan ke grup WhatsApp wali santri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-950/30 transition cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4 text-stone-950" />
              <span>📲 Rekap & Kirim WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Class Switcher Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TAHFIDZ_CLASSES.map((cls) => {
          const isActive = cls.id === activeClassId;
          const isMyClass =
            cls.ustadzId === currentUser?.id || cls.ustadzNickname === currentUser?.nickname;
          const enrolledCount = profiles.filter((p) => {
            if (p.role !== 'santri') return false;
            const ltr =
              cls.session === 'pagi'
                ? (p.class_tahfidz_pagi || '').trim().toUpperCase()
                : (p.class_tahfidz_malam || '').trim().toUpperCase();
            return ltr === cls.classLetter;
          }).length;

          return (
            <button
              key={cls.id}
              onClick={() => setActiveClassId(cls.id)}
              className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                isActive
                  ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-[#D6A84F]/40'
                  : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-emerald-200'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {cls.session === 'pagi' ? 'Pagi (Subuh)' : 'Malam (Isya)'}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-600'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {enrolledCount} Santri
                  </span>
                  {isMyClass && (
                    <span className="text-[10px] font-extrabold bg-[#D6A84F] text-stone-900 px-2 py-0.5 rounded-full shadow-sm">
                      Kelas Anda
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base">{cls.name}</h3>
              <p
                className={`text-xs mt-1 ${
                  isActive ? 'text-emerald-200' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Pengampu: <strong>{cls.ustadzName}</strong>
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Class Controls & Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Total Santri</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-800 dark:text-stone-100">
            {totalSantri}
          </div>
          <span className="text-[11px] text-stone-400">Terdaftar di kelas ini</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs mb-1">
            <span>Menunggu ACC Ust.</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-200">
            {menungguCount}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">Siap disimak &amp; di-ACC</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs mb-1">
            <span>Disimak Sah (ACC)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
            {sudahSetorCount}
          </div>
          <span className="text-[11px] text-emerald-600">Disimak &amp; disahkan ustadz</span>
        </div>

        <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 text-xs mb-1">
            <span>Belum Setor</span>
            <AlertCircle className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-800 dark:text-stone-100">
            {belumCount}
          </div>
          <span className="text-[11px] text-stone-400">Belum ada rekaman sesi</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama santri atau NIS..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-stone-700 text-[#146B50] dark:text-emerald-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Semua ({santriSetoranData.length})
            </button>
            <button
              onClick={() => setStatusFilter('menunggu')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'menunggu'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Menunggu ACC ({menungguCount})
            </button>
            <button
              onClick={() => setStatusFilter('sudah')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'sudah'
                  ? 'bg-white dark:bg-stone-700 text-emerald-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Disimak / Sah ({sudahSetorCount})
            </button>
            <button
              onClick={() => setStatusFilter('belum')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'belum'
                  ? 'bg-white dark:bg-stone-700 text-rose-600 shadow-sm'
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

      {/* Santri List Table / Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#146B50]" />
            <h2 className="text-sm font-extrabold text-stone-800 dark:text-stone-100">
              Daftar Setoran {activeClassConfig.name} ({filteredData.length} Santri)
            </h2>
          </div>
          <span className="text-xs text-stone-400">
            Tanggal: <strong>{selectedDate}</strong>
          </span>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-semibold">Tidak ada data santri yang sesuai kriteria pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredData.map(({ santri, record }) => {
              const isAcc =
                record &&
                (record.tahfidz_status === 'lancar' ||
                  record.tahfidz_status === 'perlu_diulang');
              const isMenunggu =
                record &&
                !isAcc &&
                (record.tahfidz_status === 'menunggu_validasi' ||
                  record.status === 'perlu_tinjauan' ||
                  (record.status === 'hadir_valid' && record.tahfidz_status !== 'tidak_lancar'));
              const isBelumSetor = !record || record.tahfidz_status === 'tidak_lancar' || record.status === 'alpa';

              return (
                <div
                  key={santri.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
                >
                  {/* Left: Santri Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {santri.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">
                          {santri.full_name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                          NIS: {santri.student_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                          Kamar: {santri.group_name || '-'}
                        </span>
                      </div>

                      {/* Setoran Detail Content */}
                      {record ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-[#146B50] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                            <BookOpen className="w-3 h-3" />
                            {record.tahfidz_mode === 'murojaah' ? 'Murojaah' : 'Ziyadah'}: Juz{' '}
                            {record.tahfidz_juz || '-'} Hal.{' '}
                            {record.tahfidz_halaman}
                            {record.tahfidz_halaman_end &&
                            record.tahfidz_halaman_end !== record.tahfidz_halaman
                              ? ` - ${record.tahfidz_halaman_end}`
                              : ''}
                          </span>

                          {record.tahfidz_notes && (
                            <span className="text-stone-500 text-[11px] italic">
                              "{record.tahfidz_notes}"
                            </span>
                          )}

                          <span className="text-[10px] text-stone-400">
                            Jam: {record.submitted_at.substring(11, 16)} WIB
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-rose-500 font-medium">
                          Santri belum melakukan presensi & setoran untuk sesi ini.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
                    {/* Status Badge */}
                    <div>
                      {isAcc ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-[#146B50] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Disimak Sah • {record.tahfidz_status === 'perlu_diulang' ? 'Perlu Diulang' : 'Lancar'}
                          </span>
                        </span>
                      ) : isMenunggu ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                          <span>Menunggu Ditinjau Ust.</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
                          <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                          <span>Belum Setor</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {!record && (
                        <button
                          onClick={() => handleOpenNewSetoran(santri)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#146B50] hover:bg-[#0E5B44] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                          title="Input setoran santri secara langsung"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Input Setoran</span>
                        </button>
                      )}

                      {isMenunggu && record && (
                        <button
                          onClick={() => handleFastAcc(record)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                          title="ACC langsung bahwa setoran telah disimak & lancar"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACC Setoran</span>
                        </button>
                      )}

                      {record && (
                        <button
                          onClick={() => setViewingDetailRecord(record)}
                          title="Lihat Selfie & Lokasi"
                          className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {record && (
                        <button
                          onClick={() => setValidatingRecord(record)}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        >
                          {isAcc ? 'Koreksi Nilai' : 'Koreksi / Detail'}
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

      {/* WhatsApp Modal */}
      {isWhatsAppModalOpen && (
        <TahfidzWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          classNameTitle={activeClassConfig.name}
          ustadzName={activeClassConfig.ustadzName}
          dateStr={selectedDate}
          records={classAttendanceRecords}
          santriList={santriList}
        />
      )}

      {/* Detailed Validation Modal */}
      {validatingRecord && (
        <TahfidzValidationModal
          record={validatingRecord}
          onClose={() => setValidatingRecord(null)}
          onValidate={async (params) => {
            const isDraft = params.recordId.startsWith('draft-tahfidz-');
            const studentId = isDraft ? params.recordId.split('-').pop() : undefined;
            const res = await validateTahfidzSetoran({
              recordId: params.recordId,
              studentId,
              activityId:
                currentActivity?.id ||
                (activeClassConfig.session === 'pagi' ? 'act-3' : 'act-7'),
              sessionId:
                activeClassConfig.session === 'pagi'
                  ? 'ses-setoran-pagi'
                  : 'ses-setoran-malam',
              operationalDate: selectedDate,
              tahfidzClass: activeClassId,
              mode: params.mode,
              juz: params.juz,
              halaman: params.halaman,
              halamanEnd: params.halamanEnd,
              status: params.status,
              note: params.note,
            });
            setValidatingRecord(null);
            setActionSuccessMsg(
              res.message || 'Status setoran santri berhasil diperbarui.'
            );
            setTimeout(() => setActionSuccessMsg(null), 3500);
          }}
        />
      )}

      {/* Attendance Record Inspection Modal */}
      {viewingDetailRecord && (
        <AttendanceDetailModal
          record={viewingDetailRecord}
          onClose={() => setViewingDetailRecord(null)}
        />
      )}
    </div>
  );
}
