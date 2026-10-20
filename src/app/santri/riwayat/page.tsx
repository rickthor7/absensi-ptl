'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/types';
import { STATUS_META } from '@/lib/constants';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Filter,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';

export default function SantriRiwayatPage() {
  const router = useRouter();
  const { currentUser, attendanceRecords, activities, effectiveTime, deleteSantriAttendance } = useStore();
  const todayStr = effectiveTime.toISOString().split('T')[0];

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

  const totalHadir = studentRecords.filter((r) => r.status === 'hadir_valid').length;
  const totalIzin = studentRecords.filter((r) => r.status.startsWith('izin')).length;
  const totalTinjau = studentRecords.filter((r) => r.status === 'perlu_tinjauan' || r.status === 'ditolak_lokasi').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 via-[#D6A84F]/5 to-transparent rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#146B50] dark:text-[#D6A84F]">
            <History className="w-4 h-4" />
            <span>Histori Presensi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Riwayat Kehadiran Santri
          </h1>
          <p className="text-xs text-stone-500">
            Daftar presensi foto selfie dan verifikasi radius: <strong className="text-stone-700 dark:text-stone-300">{currentUser.full_name}</strong>
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="relative z-10 flex items-center gap-2 self-start sm:self-center">
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 text-[#146B50] dark:text-emerald-300 text-xs font-extrabold">
            {totalHadir} Hadir Valid
          </div>
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
            {totalIzin} Izin
          </div>
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
            placeholder="Cari kegiatan, tanggal (YYYY-MM-DD), atau alasan..."
            className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none text-stone-800 dark:text-stone-200"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
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

      {/* List of Records - Mobile First Card Layout */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-400 text-xs space-y-2">
            <History className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="font-semibold">Belum ada rekaman absensi yang sesuai filter ini.</p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const meta = STATUS_META[rec.status];
            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRecord(rec)}
                className="group relative bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/90 dark:border-stone-800 hover:border-[#146B50] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  {/* Photo thumbnail */}
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-xs shrink-0 group-hover:scale-105 transition bg-black">
                    <img
                      src={rec.photo_path}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Record details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#146B50] transition">
                        {rec.activity_name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                        • {rec.attendance_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {rec.operational_date}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(rec.submitted_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[#146B50] dark:text-[#D6A84F]">
                        <MapPin className="w-3.5 h-3.5" />
                        {Math.round(rec.distance_from_site_m)}m
                      </span>
                    </div>

                    {rec.permission_reason && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 italic line-clamp-1 bg-amber-50/60 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg inline-block border border-amber-200/50">
                        Alasan: {rec.permission_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge & Eye Action */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                  >
                    {meta.label}
                  </span>
                  {rec.operational_date === todayStr && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Hapus data absensi kegiatan "${rec.activity_name}" untuk keperluan retake (ambil ulang)?`
                          )
                        ) {
                          const res = await deleteSantriAttendance(rec.id);
                          if (res.success) {
                            router.push('/santri/absensi');
                          } else {
                            alert(res.message);
                          }
                        }
                      }}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 transition cursor-pointer"
                      title="Retake / Ambil Ulang Absensi"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-[#146B50] group-hover:text-white transition"
                    title="Lihat detail absensi"
                  >
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
