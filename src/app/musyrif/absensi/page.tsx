'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { AttendanceRecord, Profile } from '@/types';
import {
  getActivitiesForDate,
  getWibDateStr,
  formatTime24,
  formatIndonesianDate,
} from '@/lib/schedule';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import CorrectionModal from '@/components/attendance/CorrectionModal';
import {
  CheckCircle2,
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Eye,
  CheckSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Camera,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Edit3,
} from 'lucide-react';

export default function MusyrifDataAbsensiPage() {
  const {
    profiles,
    activities,
    attendanceRecords,
    effectiveTime,
    correctAttendance,
  } = useStore();

  const todayStr = getWibDateStr(effectiveTime);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);
  const [correctionRecord, setCorrectionRecord] = useState<AttendanceRecord | null>(null);

  // Santri profiles
  const santriList = useMemo(() => {
    return profiles.filter((p) => p.role === 'santri' && p.is_active);
  }, [profiles]);

  // Dorm groups
  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach((s) => {
      if (s.group_name) set.add(s.group_name);
    });
    return Array.from(set).sort();
  }, [santriList]);

  // Scheduled activities for selected date
  const scheduledActivities = useMemo(() => {
    return getActivitiesForDate(activities, new Date(selectedDate));
  }, [activities, selectedDate]);

  // Records for selected date
  const recordsForDate = useMemo(() => {
    return attendanceRecords.filter((r) => {
      const rDate = r.operational_date || getWibDateStr(r.submitted_at);
      return rDate === selectedDate;
    });
  }, [attendanceRecords, selectedDate]);

  // Filtered attendance records
  const filteredRecords = useMemo(() => {
    return recordsForDate.filter((r) => {
      // Activity filter
      if (selectedActivityId !== 'all' && r.activity_id !== selectedActivityId) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'hadir' && r.status !== 'hadir_valid') return false;
        if (selectedStatus === 'perlu_tinjauan' && r.status !== 'perlu_tinjauan') return false;
        if (
          selectedStatus === 'izin' &&
          r.status !== 'izin_diajukan' &&
          r.status !== 'izin_disetujui' &&
          r.status !== 'izin_ditolak'
        ) {
          return false;
        }
        if (selectedStatus === 'alpa' && r.status !== 'alpa') return false;
      }

      // Group filter
      if (selectedGroup !== 'all') {
        const student = profiles.find((p) => p.id === r.student_id);
        if (student?.group_name !== selectedGroup) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const student = profiles.find((p) => p.id === r.student_id);
        const matchName = (r.student_name || '').toLowerCase().includes(q);
        const matchNis = (student?.student_number || '').includes(q);
        const matchAct = (r.activity_name || '').toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchAct) return false;
      }

      return true;
    });
  }, [recordsForDate, selectedActivityId, selectedStatus, selectedGroup, searchQuery, profiles]);

  // Daily statistics
  const totalRecords = recordsForDate.length;
  const hadirCount = recordsForDate.filter((r) => r.status === 'hadir_valid').length;
  const tinjauanCount = recordsForDate.filter((r) => r.status === 'perlu_tinjauan').length;
  const izinCount = recordsForDate.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
  ).length;
  const alpaCount = recordsForDate.filter((r) => r.status === 'alpa').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-[#061F17] via-[#0B3D2E] to-[#146B50] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D6A84F] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-[#D6A84F] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Pengasuhan Musyrif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-[#D6A84F]" />
              <span>Data Absensi Santri</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Log pemantauan seluruh rekaman kehadiran harian santri, verifikasi foto selfie, titik geotag GPS,
              serta riwayat status per kegiatan pondok.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/musyrif/edit-presensi"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>✏️ Buka Edit Presensi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Total Tercatat</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {totalRecords}
          </div>
          <span className="text-[11px] text-stone-400">Presensi hari terpilih</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs mb-1">
            <span>Hadir Sah</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
            {hadirCount}
          </div>
          <span className="text-[11px] text-emerald-600">Valid kamera &amp; GPS</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs mb-1">
            <span>Perlu Tinjauan</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-200">
            {tinjauanCount}
          </div>
          <span className="text-[11px] text-amber-600">Luar radius / selisih</span>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs mb-1">
            <span>Izin Diajukan</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-800 dark:text-blue-200">
            {izinCount}
          </div>
          <span className="text-[11px] text-blue-600">Sakit / Pulang</span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs mb-1">
            <span>Alpa</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-800 dark:text-rose-200">
            {alpaCount}
          </div>
          <span className="text-[11px] text-rose-600">Tanpa keterangan</span>
        </div>
      </div>

      {/* ── Toolbar & Filter Controls ── */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Tanggal */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Tanggal Operasional:
            </label>
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-stone-800 dark:text-stone-200 outline-none text-xs font-semibold w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Kegiatan */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Sesi Kegiatan:
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none cursor-pointer"
            >
              <option value="all">Semua Kegiatan ({scheduledActivities.length})</option>
              {scheduledActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} ({formatTime24(act.start_time)} WIB)
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Status Kehadiran:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir Sah</option>
              <option value="perlu_tinjauan">Perlu Tinjauan</option>
              <option value="izin">Izin</option>
              <option value="alpa">Alpa</option>
            </select>
          </div>

          {/* Kamar / Asrama */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Kamar / Asrama:
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none cursor-pointer"
            >
              <option value="all">Semua Kamar</option>
              {groupOptions.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          </div>

          {/* Pencarian */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Cari Nama / NIS:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari santri..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#0D7B5F]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Attendance Log Table ── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0D7B5F]" />
            <h2 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Rekaman Data Presensi ({filteredRecords.length} Data)
            </h2>
          </div>
          <span className="text-xs text-stone-400">
            {formatIndonesianDate(new Date(selectedDate))}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-3">
            <CheckCircle2 className="w-8 h-8 mx-auto opacity-30 text-stone-400" />
            <p className="text-xs font-semibold">
              Tidak ada data presensi yang sesuai kriteria filter pada tanggal ini.
            </p>
            <Link
              href="/musyrif/edit-presensi"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D7B5F] text-white text-xs font-bold shadow-xs hover:bg-[#0b6b52] transition"
            >
              <span>+ Input Presensi Massal di Edit Presensi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">Kegiatan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Submit</th>
                  <th className="py-3 px-4">Bukti Presensi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredRecords.map((r, idx) => {
                  const student = profiles.find((p) => p.id === r.student_id);
                  const isHadir = r.status === 'hadir_valid';
                  const isTinjauan = r.status === 'perlu_tinjauan';
                  const isIzin = r.status.includes('izin');
                  const isAlpa = r.status === 'alpa';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {r.student_name}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          NIS: {student?.student_number || '-'} • Kamar: {student?.group_name || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-800 dark:text-stone-200">
                        {r.activity_name}
                      </td>
                      <td className="py-3 px-4">
                        {isHadir && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Hadir Sah</span>
                          </span>
                        )}
                        {isTinjauan && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Perlu Tinjauan</span>
                          </span>
                        )}
                        {isIzin && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Izin</span>
                          </span>
                        )}
                        {isAlpa && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Alpa</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                        {r.submitted_at ? r.submitted_at.substring(11, 16) : '-'} WIB
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {r.photo_path ? (
                            <span
                              title="Foto Selfie Ada"
                              className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]"
                            >
                              <Camera className="w-3 h-3" />
                            </span>
                          ) : (
                            <span
                              title="Tanpa Foto Selfie"
                              className="w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center text-[10px]"
                            >
                              -
                            </span>
                          )}

                          {r.latitude && r.longitude ? (
                            <span
                              title={`GPS: ${r.distance_from_site_m || 0}m dari lokasi pondok`}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                                (r.distance_from_site_m || 0) <= 150
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                            </span>
                          ) : (
                            <span
                              title="Tanpa Koordinat GPS"
                              className="w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center text-[10px]"
                            >
                              -
                            </span>
                          )}

                          {r.tahfidz_juz && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 font-mono">
                              Juz {r.tahfidz_juz}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailRecord(r)}
                            title="Lihat Rincian Presensi"
                            className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setCorrectionRecord(r)}
                            title="Koreksi Status Presensi"
                            className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Detail Presensi ── */}
      {detailRecord && (
        <AttendanceDetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
        />
      )}

      {/* ── Modal Koreksi Presensi ── */}
      {correctionRecord && (
        <CorrectionModal
          record={correctionRecord}
          onClose={() => setCorrectionRecord(null)}
          onSave={async (recordId, newStatus, reason) => {
            await correctAttendance(recordId, newStatus, reason);
            setCorrectionRecord(null);
          }}
        />
      )}
    </div>
  );
}
