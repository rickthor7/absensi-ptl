'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/types';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import CorrectionModal from '@/components/attendance/CorrectionModal';
import TahfidzValidationModal from '@/components/attendance/TahfidzValidationModal';
import {
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Eye,
  SlidersHorizontal,
  FileCheck,
  Shield,
  Sparkles,
  AlertTriangle,
  History,
  Camera,
  UserCheck,
  UserX,
  FileText,
  BookOpen,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';

export default function MusyrifAbsensiPage() {
  const {
    attendanceRecords,
    activities,
    profiles,
    effectiveTime,
    correctAttendance,
    validateTahfidzSetoran,
  } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecord | null>(null);
  const [selectedTahfidzRecord, setSelectedTahfidzRecord] = useState<AttendanceRecord | null>(null);

  const todayStr = effectiveTime.toISOString().split('T')[0];

  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered records based on controls
  const filteredRecords = attendanceRecords.filter((r) => {
    if (filterActivity !== 'all' && r.activity_id !== filterActivity) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterDate && r.operational_date !== filterDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.student_name.toLowerCase().includes(q) ||
        (r.student_number && r.student_number.toLowerCase().includes(q)) ||
        (r.group_name && r.group_name.toLowerCase().includes(q)) ||
        (r.activity_name && r.activity_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate quick stats for the filtered date / view
  const baseRecords = filterDate
    ? attendanceRecords.filter((r) => r.operational_date === filterDate)
    : attendanceRecords;

  const totalHadir = baseRecords.filter((r) => r.status === 'hadir_valid').length;
  const totalIzin = baseRecords.filter(
    (r) => r.status === 'izin_disetujui' || r.status === 'izin_diajukan'
  ).length;
  const totalAlpa = baseRecords.filter((r) => r.status === 'alpa').length;
  const totalReview = baseRecords.filter(
    (r) => r.status === 'perlu_tinjauan' || r.status === 'ditolak_lokasi'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 via-[#D6A84F]/5 to-transparent rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#146B50] dark:text-[#D6A84F]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sistem Presensi Mandiri Santri (Selfie &amp; GPS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Monitoring &amp; Koreksi Presensi Santri
          </h1>
          <p className="text-xs text-stone-500 max-w-2xl">
            Seluruh kehadiran dilakukan mandiri oleh santri via kamera selfie dan verifikasi radius geotag GPS pondok. Musyrif bertugas memantau hasil rekaman dan memiliki hak penuh untuk mengoreksi/mengedit data presensi santri jika diperlukan.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-[#146B50] dark:text-emerald-300 font-extrabold px-3 py-1.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800">
            {totalHadir} Hadir Valid
          </span>
          <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-extrabold px-3 py-1.5 rounded-2xl border border-amber-200/80 dark:border-amber-800">
            {totalIzin} Izin
          </span>
          <span className="text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-extrabold px-3 py-1.5 rounded-2xl border border-rose-200/80 dark:border-rose-800">
            {totalAlpa} Alpa
          </span>
          {totalReview > 0 && (
            <span className="text-xs bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 font-extrabold px-3 py-1.5 rounded-2xl border border-orange-200/80 dark:border-orange-800 animate-pulse">
              {totalReview} Perlu Tinjauan
            </span>
          )}
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama santri, NIS, kamar, atau nama kegiatan..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none text-stone-800 dark:text-stone-200"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs font-semibold p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
              title="Filter Tanggal Kegiatan"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="text-[10px] font-bold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-1.5 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Tampilkan Semua Tanggal"
              >
                Reset
              </button>
            )}
          </div>

          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="text-xs font-semibold p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
          >
            <option value="all">Semua Kegiatan</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="hadir_valid">Hadir Valid (Selfie &amp; GPS)</option>
            <option value="izin_diajukan">Izin Menunggu</option>
            <option value="izin_disetujui">Izin Disetujui</option>
            <option value="izin_ditolak">Izin Ditolak</option>
            <option value="perlu_tinjauan">Perlu Tinjauan</option>
            <option value="ditolak_lokasi">Ditolak Lokasi (Luar Radius)</option>
            <option value="alpa">Alpa / Tidak Hadir</option>
          </select>
        </div>
      </div>

      {/* ── MOBILE FEED (Screen < sm) ── */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-400 text-xs">
            Tidak ada rekaman presensi yang cocok dengan filter.
          </div>
        ) : (
          filteredRecords.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META.belum_absen;
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-3">
                  {r.photo_path ? (
                    <img
                      src={r.photo_path}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 bg-black shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {r.student_name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        {meta.label.split('—')[0].trim()}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono">
                      NIS: {r.student_number || '-'} • {r.group_name || 'Santri'}
                    </p>
                    <p className="text-xs font-bold text-[#146B50] dark:text-emerald-400 mt-0.5">
                      {r.activity_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-2xl text-stone-600 dark:text-stone-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {r.operational_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {new Date(r.submitted_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#146B50] dark:text-[#D6A84F]">
                    <MapPin className="w-3.5 h-3.5" />
                    {Math.round(r.distance_from_site_m)}m
                  </span>
                </div>

                {/* Tahfidz Section if present */}
                {r.tahfidz_juz && (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#146B50] dark:text-[#D6A84F]">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Juz {r.tahfidz_juz} Hal {r.tahfidz_halaman || 1}
                      </span>
                      {r.tahfidz_status === 'lancar' && (
                        <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-800">
                          Lancar
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTahfidzRecord(r)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold"
                    >
                      Validasi Tahfidz
                    </button>
                  </div>
                )}

                {/* Action Buttons: Detail & Edit */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-200 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#146B50]" />
                    <span>Detail &amp; Bukti</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCorrectRecord(r)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#146B50] hover:bg-[#0D523D] text-white text-xs font-bold transition shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#D6A84F]" />
                    <span>Edit / Koreksi</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DESKTOP TABLE (Screen >= sm) ── */}
      <div className="hidden sm:block bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 bg-stone-50/60 dark:bg-stone-800/40">
                <th className="py-3.5 px-4 font-bold">Foto Selfie</th>
                <th className="py-3.5 px-4 font-bold">Santri &amp; Kamar</th>
                <th className="py-3.5 px-4 font-bold">Kegiatan</th>
                <th className="py-3.5 px-4 font-bold">Tanggal &amp; Waktu</th>
                <th className="py-3.5 px-4 font-bold">Jarak GPS</th>
                <th className="py-3.5 px-4 font-bold">Status Sistem</th>
                <th className="py-3.5 px-4 font-bold text-right">Tindakan Musyrif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Tidak ada rekaman presensi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.belum_absen;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        {r.photo_path ? (
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="relative group cursor-pointer"
                            title="Klik untuk perbesar foto selfie"
                          >
                            <img
                              src={r.photo_path}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-stone-700 bg-black group-hover:ring-2 group-hover:ring-[#146B50] transition"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Santri Name & Dorm */}
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-stone-900 dark:text-stone-100">
                          {r.student_name}
                        </p>
                        <p className="text-[11px] text-stone-400 font-mono">
                          NIS: {r.student_number || '-'} • {r.group_name || 'Santri'}
                        </p>
                      </td>

                      {/* Activity */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {r.activity_name}
                        </span>
                        {r.tahfidz_juz && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            📖 Juz {r.tahfidz_juz} Hal {r.tahfidz_halaman || 1}
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <p className="font-mono text-stone-700 dark:text-stone-300">
                          {r.operational_date}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {new Date(r.submitted_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </p>
                      </td>

                      {/* GPS Distance */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-bold font-mono">
                          <MapPin className="w-3.5 h-3.5 text-[#146B50] dark:text-[#D6A84F]" />
                          <span>{Math.round(r.distance_from_site_m)}m</span>
                        </div>
                        <span className="text-[10px] text-stone-400">dari pusat pondok</span>
                      </td>

                      {/* System Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          <span>{meta.label.split('—')[0].trim()}</span>
                        </span>
                        {r.permission_reason && (
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 italic mt-0.5 max-w-[150px] truncate">
                            &quot;{r.permission_reason}&quot;
                          </p>
                        )}
                      </td>

                      {/* Musyrif Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.tahfidz_juz && (
                            <button
                              type="button"
                              onClick={() => setSelectedTahfidzRecord(r)}
                              className="p-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-[#146B50] dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                              title="Validasi Setoran Tahfidz"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-[#146B50] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            title="Lihat Detail Foto Selfie & Peta GPS"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCorrectRecord(r)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#146B50] hover:bg-[#0D523D] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Koreksi / Ubah Status Presensi Santri Ini"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D6A84F]" />
                            <span>Edit / Koreksi</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALS ── */}
      {selectedRecord && (
        <AttendanceDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {correctRecord && (
        <CorrectionModal
          record={correctRecord}
          onClose={() => setCorrectRecord(null)}
          onSave={async (id, newStatus, reason) => {
            await correctAttendance(id, newStatus, reason);
            setCorrectRecord(null);
          }}
        />
      )}

      {selectedTahfidzRecord && (
        <TahfidzValidationModal
          record={selectedTahfidzRecord}
          onClose={() => setSelectedTahfidzRecord(null)}
          onValidate={async (params) => {
            await validateTahfidzSetoran(params);
            setSelectedTahfidzRecord(null);
          }}
        />
      )}

    </div>
  );
}
