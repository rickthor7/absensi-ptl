'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/types';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import CorrectionModal from '@/components/attendance/CorrectionModal';
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
} from 'lucide-react';

export default function MusyrifAbsensiPage() {
  const { attendanceRecords, activities, correctAttendance } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctRecord, setCorrectRecord] = useState<AttendanceRecord | null>(null);

  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

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
            <span>Verifikasi Presensi Santri</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Monitoring & Audit Kehadiran
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Pantau foto selfie, koordinat satelit GPS, radius pondok, serta koreksi manual status presensi.
          </p>
        </div>

        <div className="relative z-10 self-start sm:self-auto">
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-[#146B50] dark:text-emerald-300 font-extrabold px-3.5 py-1.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800">
            Total: {filteredRecords.length} Catatan
          </span>
        </div>
      </div>

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
            const meta = STATUS_META[r.status];
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

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-200 transition active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#146B50]" />
                    <span>Lihat Bukti Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCorrectRecord(r)}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                    title="Koreksi manual"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Koreksi</span>
                  </button>
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
                  const meta = STATUS_META[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition">
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
                        {r.activity_name}
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
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-[#146B50] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            title="Lihat Detail Foto & Koordinat"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCorrectRecord(r)}
                            className="p-2 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                            title="Koreksi Manual Status"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
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
    </div>
  );
}
