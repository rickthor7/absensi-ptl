'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/types';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import CorrectionModal from '@/components/attendance/CorrectionModal';
import DiscrepancyVerificationModal from '@/components/attendance/DiscrepancyVerificationModal';
import ManualAttendanceSheet from '@/components/attendance/ManualAttendanceSheet';
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
  ClipboardList,
  AlertTriangle,
  History,
  Camera,
  UserCheck,
  UserX,
  FileText,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

export default function MusyrifAbsensiPage() {
  const {
    attendanceRecords,
    activities,
    correctAttendance,
    verifyDiscrepancy,
    validateTahfidzSetoran,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'manual' | 'discrepancy' | 'history'>('manual');

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecord | null>(null);
  const [discrepancyRecord, setDiscrepancyRecord] = useState<AttendanceRecord | null>(null);
  const [selectedTahfidzRecord, setSelectedTahfidzRecord] = useState<AttendanceRecord | null>(null);

  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Discrepancy records (where santri self-attendance != musyrif manual mark)
  const discrepancyRecords = attendanceRecords.filter((r) => r.has_discrepancy);

  // Filtered records for Tab 3 (Riwayat)
  const filteredRecords = attendanceRecords.filter((r) => {
    if (filterActivity !== 'all' && r.activity_id !== filterActivity) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterDate && r.operational_date !== filterDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.student_name.toLowerCase().includes(q) ||
        (r.student_number && r.student_number.toLowerCase().includes(q)) ||
        (r.group_name && r.group_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 via-[#D6A84F]/5 to-transparent rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#146B50] dark:text-[#D6A84F]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Presensi Terpadu & Verifikasi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Absensi Santri & Kontrol Musyrif
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Santri melakukan absen mandiri (selfie & GPS), musyrif melakukan absen manual massal,
            serta verifikasi ketidaksamaan data secara instan.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {discrepancyRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('discrepancy')}
              className="text-xs bg-amber-500/15 text-amber-800 dark:text-amber-300 font-extrabold px-3 py-1.5 rounded-2xl border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/25 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{discrepancyRecords.length} Ketidaksamaan</span>
            </button>
          )}

          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-[#146B50] dark:text-emerald-300 font-extrabold px-3 py-1.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800">
            Total {attendanceRecords.length} Catatan
          </span>
        </div>
      </div>

      {/* Discrepancy Alert Banner */}
      {discrepancyRecords.length > 0 && activeTab !== 'discrepancy' && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/80 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-amber-950 dark:text-amber-100">
                Terdapat {discrepancyRecords.length} santri dengan data presensi tidak sama!
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Ada perbedaan antara rekaman absen selfie mandiri santri dan catatan manual musyrif.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('discrepancy')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-extrabold transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            Cek Bukti & Verifikasi Sekarang →
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl w-full sm:w-fit overflow-x-auto">
        {/* Tab 1: Manual Attendance */}
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-stone-900 text-[#146B50] dark:text-[#D6A84F] shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Absen Manual Seluruh Santri</span>
        </button>

        {/* Tab 2: Discrepancy Resolution */}
        <button
          type="button"
          onClick={() => setActiveTab('discrepancy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeTab === 'discrepancy'
              ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Ketidaksamaan Data</span>
          {discrepancyRecords.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {discrepancyRecords.length}
            </span>
          )}
        </button>

        {/* Tab 3: History & Log */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log & Riwayat Lengkap</span>
        </button>
      </div>

      {/* TAB 1: MANUAL BATCH ATTENDANCE */}
      {activeTab === 'manual' && (
        <ManualAttendanceSheet
          onOpenDiscrepancyModal={(rec) => setDiscrepancyRecord(rec)}
          onSaved={() => {
            // Optional callback
          }}
        />
      )}

      {/* TAB 2: DISCREPANCY VERIFICATION LIST */}
      {activeTab === 'discrepancy' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Daftar Ketidaksamaan Data Santri vs Musyrif</span>
              </h2>
              <p className="text-xs text-stone-500">
                Pemeriksaan foto bukti, lokasi satelit GPS, serta verifikasi akhir oleh musyrif.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 self-start sm:self-auto">
              {discrepancyRecords.length} Perlu Tindakan
            </span>
          </div>

          {discrepancyRecords.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-[#146B50] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Alhamdulillah, Semua Data Presensi Sinkron!
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Tidak ada perbedaan status antara absensi mandiri santri dan catatan manual musyrif.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {discrepancyRecords.map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-amber-200 dark:border-amber-800/80 shadow-xs space-y-4 hover:border-amber-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-black shrink-0">
                        {r.photo_path ? (
                          <img
                            src={r.photo_path}
                            alt={r.student_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-stone-500 font-bold">
                            Foto
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                          {r.student_name}
                        </h3>
                        <p className="text-xs text-stone-400 font-mono">
                          NIS: {r.student_number || '-'} • {r.group_name || 'Santri'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-bold text-[#146B50] dark:text-[#D6A84F] bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        {r.activity_name} • {r.operational_date}
                      </span>
                    </div>
                  </div>

                  {/* Discrepancy Reason Banner */}
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Alasan Ketidaksamaan:</span>
                      <p className="text-amber-800 dark:text-amber-300">
                        {r.discrepancy_reason ||
                          'Data presensi mandiri santri berbeda dengan catatan musyrif.'}
                      </p>
                    </div>
                  </div>

                  {/* Side-by-Side Status Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Absen Mandiri Santri
                      </span>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#146B50]" />
                        <span className="font-extrabold text-stone-800 dark:text-stone-200">
                          {r.santri_status === 'hadir_valid'
                            ? 'Selfie Hadir (Valid)'
                            : r.santri_status === 'izin_diajukan'
                            ? 'Pengajuan Izin'
                            : r.santri_status === 'belum_absen'
                            ? 'Belum Selfie Mandiri'
                            : r.santri_status || r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono">
                        Kirim:{' '}
                        {new Date(r.submitted_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB • Jarak: {Math.round(r.distance_from_site_m)}m
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Catatan Manual Musyrif
                      </span>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#D6A84F]" />
                        <span className="font-extrabold text-stone-800 dark:text-stone-200">
                          Dicatat: {r.musyrif_status ? r.musyrif_status.toUpperCase() : 'HADIR'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono">
                        Oleh: {r.reviewed_by_name || 'Musyrif'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button: Cek Bukti & Verifikasi */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setDiscrepancyRecord(r)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Cek Bukti & Verifikasi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETE HISTORY & LOG */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari santri, NIS, atau kamar asrama..."
                className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none text-stone-800 dark:text-stone-200"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs font-semibold p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
                title="Filter Tanggal"
              />

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
                <option value="hadir_valid">Hadir Tervalidasi</option>
                <option value="izin_diajukan">Izin Menunggu</option>
                <option value="izin_disetujui">Izin Disetujui</option>
                <option value="izin_ditolak">Izin Ditolak</option>
                <option value="perlu_tinjauan">Perlu Tinjauan</option>
                <option value="ditolak_lokasi">Ditolak Lokasi</option>
                <option value="alpa">Alpa / Tidak Hadir</option>
              </select>
            </div>
          </div>

          {/* MOBILE FEED (Tampilan Card Khusus Layar HP < sm) */}
          <div className="sm:hidden space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-400 text-xs">
                Tidak ada catatan yang cocok dengan filter.
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
                      <img
                        src={r.photo_path}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 bg-black shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 truncate">
                            {r.student_name}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-mono">
                          NIS: {r.student_number} • {r.group_name}
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

                    {/* Tahfidz Setoran Info if available */}
                    {r.tahfidz_juz && (
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#146B50] dark:text-[#D6A84F] flex-wrap">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[10px] bg-white/80 dark:bg-stone-900/80 px-1.5 py-0.5 rounded border border-emerald-300">
                            {r.tahfidz_mode === 'murojaah' ? 'Muroja\'ah' : 'Ziyadah'}
                          </span>
                          <span>
                            Juz {r.tahfidz_juz} Hal{' '}
                            {r.tahfidz_halaman_end && r.tahfidz_halaman_end !== r.tahfidz_halaman
                              ? `${r.tahfidz_halaman}-${r.tahfidz_halaman_end}`
                              : (r.tahfidz_halaman || 1)}
                          </span>
                          {r.tahfidz_status === 'lancar' && (
                            <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900 px-1.5 py-0.5 rounded-md text-emerald-800 dark:text-emerald-200">
                              Lancar
                            </span>
                          )}
                          {r.tahfidz_status === 'perlu_diulang' && (
                            <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900 px-1.5 py-0.5 rounded-md text-amber-800 dark:text-amber-200">
                              Ulang
                            </span>
                          )}
                          {r.tahfidz_status === 'tidak_lancar' && (
                            <span className="text-[10px] bg-rose-200/80 dark:bg-rose-900 px-1.5 py-0.5 rounded-md text-rose-800 dark:text-rose-200">
                              Belum Lancar
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTahfidzRecord(r)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-bold cursor-pointer transition shadow-xs shrink-0"
                        >
                          {r.tahfidz_status && r.tahfidz_status !== 'menunggu_validasi' ? 'Ubah Nilai' : 'Validasi'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-200 transition active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#146B50]" />
                        <span>Lihat Bukti Foto</span>
                      </button>

                      {r.has_discrepancy ? (
                        <button
                          type="button"
                          onClick={() => setDiscrepancyRecord(r)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Verifikasi</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCorrectRecord(r)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                          title="Koreksi manual"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Koreksi</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE (Tampilan Layar Tablet & Laptop >= sm) */}
          <div className="hidden sm:block bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 bg-stone-50/60 dark:bg-stone-800/40">
                    <th className="py-3.5 px-4 font-bold">Foto</th>
                    <th className="py-3.5 px-4 font-bold">Santri & Kamar</th>
                    <th className="py-3.5 px-4 font-bold">Kegiatan</th>
                    <th className="py-3.5 px-4 font-bold">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4 font-bold">Jarak Geodesik</th>
                    <th className="py-3.5 px-4 font-bold">Status Verifikasi</th>
                    <th className="py-3.5 px-4 font-bold text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        Tidak ada catatan absensi yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const meta = STATUS_META[r.status] || STATUS_META.belum_absen;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition"
                        >
                          <td className="py-3 px-4">
                            <img
                              src={r.photo_path}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-stone-700 bg-black"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-stone-900 dark:text-stone-100">
                              {r.student_name}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono">
                              NIS: {r.student_number} • {r.group_name}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-800 dark:text-stone-200">
                            <div>{r.activity_name}</div>
                            {r.tahfidz_juz && (
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#146B50] dark:text-[#D6A84F] flex-wrap">
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[9px] bg-white/80 dark:bg-stone-900/80 px-1.5 py-0.2 rounded border border-emerald-300">
                                  {r.tahfidz_mode === 'murojaah' ? 'Muroja\'ah' : 'Ziyadah'}
                                </span>
                                <span>
                                  Juz {r.tahfidz_juz} Hal{' '}
                                  {r.tahfidz_halaman_end && r.tahfidz_halaman_end !== r.tahfidz_halaman
                                    ? `${r.tahfidz_halaman}-${r.tahfidz_halaman_end}`
                                    : (r.tahfidz_halaman || 1)}
                                </span>
                                {r.tahfidz_status === 'lancar' && (
                                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300">
                                    Lancar
                                  </span>
                                )}
                                {r.tahfidz_status === 'perlu_diulang' && (
                                  <span className="text-[9px] bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-300">
                                    Ulang
                                  </span>
                                )}
                                {r.tahfidz_status === 'tidak_lancar' && (
                                  <span className="text-[9px] bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded border border-rose-300">
                                    Belum Lancar
                                  </span>
                                )}
                                {(!r.tahfidz_status || r.tahfidz_status === 'menunggu_validasi') && (
                                  <span className="text-[9px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-300">
                                    Menunggu
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                            {r.operational_date}
                            <span className="block text-[10px]">
                              {new Date(r.submitted_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              WIB
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="font-bold text-[#146B50] dark:text-[#D6A84F]">
                              {Math.round(r.distance_from_site_m)}m
                            </span>
                            <span className="block text-[10px] text-stone-400">
                              ±{Math.round(r.gps_accuracy_m)}m GPS
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block w-fit ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                              >
                                {meta.label}
                              </span>
                              {r.has_discrepancy && (
                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Ketidaksamaan Data</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.tahfidz_juz && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTahfidzRecord(r)}
                                  className="p-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-[#146B50] dark:text-emerald-300 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
                                  title="Validasi Setoran Tahfidz"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedRecord(r)}
                                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-[#146B50] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                                title="Lihat Detail Foto & Koordinat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {r.has_discrepancy ? (
                                <button
                                  type="button"
                                  onClick={() => setDiscrepancyRecord(r)}
                                  className="p-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                                  title="Verifikasi Ketidaksamaan"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setCorrectRecord(r)}
                                  className="p-2 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                                  title="Koreksi Manual Status"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        </div>
      )}

      {/* Modals */}
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
          onSave={(id, newStatus, reason) => correctAttendance(id, newStatus, reason)}
        />
      )}

      {discrepancyRecord && (
        <DiscrepancyVerificationModal
          record={discrepancyRecord}
          onClose={() => setDiscrepancyRecord(null)}
          onVerify={async (recordId, finalStatus, note) => {
            await verifyDiscrepancy(recordId, finalStatus, note);
          }}
        />
      )}

      {selectedTahfidzRecord && (
        <TahfidzValidationModal
          record={selectedTahfidzRecord}
          onClose={() => setSelectedTahfidzRecord(null)}
          onValidate={async (params) => {
            await validateTahfidzSetoran(params);
          }}
        />
      )}
    </div>
  );
}
