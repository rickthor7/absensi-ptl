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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#D6A84F]" />
            <span>Verifikasi Kehadiran</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Daftar Seluruh Absensi Santri
          </h1>
          <p className="text-xs text-stone-500">
            Pantau foto selfie, koordinat GPS, jarak radius pondok, dan koreksi data manual
          </p>
        </div>

        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-[#146B50] font-bold px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
          Ditemukan: {filteredRecords.length} Catatan
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari santri, NIS, atau kamar..."
            className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs font-medium p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            title="Filter Tanggal"
          />

          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="text-xs font-medium p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
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
            className="text-xs font-medium p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
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

      {/* Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 bg-stone-50/50 dark:bg-stone-800/30">
                <th className="py-3 px-4 font-bold">Foto</th>
                <th className="py-3 px-4 font-bold">Santri & Kamar</th>
                <th className="py-3 px-4 font-bold">Kegiatan</th>
                <th className="py-3 px-4 font-bold">Tanggal & Waktu</th>
                <th className="py-3 px-4 font-bold">Jarak Geodesik</th>
                <th className="py-3 px-4 font-bold">Status Verifikasi</th>
                <th className="py-3 px-4 font-bold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredRecords.map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <tr key={r.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="py-3 px-4">
                      <img
                        src={r.photo_path}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {r.student_name}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        NIS: {r.student_number} • {r.group_name}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800 dark:text-stone-200">
                      {r.activity_name}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {r.operational_date}
                      <span className="block text-[10px]">
                        {new Date(r.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {Math.round(r.distance_from_site_m)}m
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
                          onClick={() => setSelectedRecord(r)}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-[#146B50] hover:bg-emerald-50 transition cursor-pointer"
                          title="Lihat Detail Foto & Koordinat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCorrectRecord(r)}
                          className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          title="Koreksi Manual Status"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
