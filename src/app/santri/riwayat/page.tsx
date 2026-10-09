'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/types';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import {
  History,
  Search,
  Filter,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function SantriRiwayatPage() {
  const { currentUser, attendanceRecords, activities } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter records for this student only
  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);

  const filteredRecords = studentRecords.filter((r) => {
    if (filterActivity !== 'all' && r.activity_id !== filterActivity) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.activity_name.toLowerCase().includes(q) ||
        r.operational_date.includes(q) ||
        (r.permission_reason && r.permission_reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <History className="w-4 h-4 text-[#D6A84F]" />
            <span>Histori Kehadiran</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Riwayat Absensi Pribadi
          </h1>
          <p className="text-xs text-stone-500">
            Daftar lengkap rekaman kehadiran selfie dan geotag milik {currentUser.full_name}
          </p>
        </div>

        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-[#146B50] font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
          Total: {filteredRecords.length} Catatan
        </span>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kegiatan, tanggal (YYYY-MM-DD), atau alasan..."
            className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
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

      {/* List / Table of Records */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-400 text-xs">
            Tidak ada catatan absensi yang sesuai filter.
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const meta = STATUS_META[rec.status];
            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRecord(rec)}
                className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 hover:border-[#146B50] shadow-xs hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={rec.photo_path}
                    alt="Selfie"
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 shadow-xs shrink-0 group-hover:scale-105 transition"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#146B50] transition">
                        {rec.activity_name}
                      </h3>
                      <span className="text-[11px] uppercase font-bold text-stone-400">
                        • {rec.attendance_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {rec.operational_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(rec.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#146B50]" />
                        Jarak {Math.round(rec.distance_from_site_m)}m
                      </span>
                    </div>

                    {rec.permission_reason && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 italic mt-1 line-clamp-1">
                        Alasan: {rec.permission_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                  >
                    {meta.label}
                  </span>
                  <button className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-[#146B50] hover:text-white transition">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail */}
      {selectedRecord && (
        <AttendanceDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
