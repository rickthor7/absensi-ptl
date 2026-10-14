'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/types';
import PermissionReviewModal from '@/components/attendance/PermissionReviewModal';
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal';
import { STATUS_META } from '@/lib/constants';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export default function MusyrifPerizinanPage() {
  const { attendanceRecords, reviewPermission } = useStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [reviewRecord, setReviewRecord] = useState<AttendanceRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);

  // All izin records
  const izinRecords = attendanceRecords.filter((r) => r.attendance_type === 'izin');

  const pendingList = izinRecords.filter((r) => r.status === 'izin_diajukan');
  const approvedList = izinRecords.filter((r) => r.status === 'izin_disetujui');
  const rejectedList = izinRecords.filter((r) => r.status === 'izin_ditolak');

  const currentList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'approved'
      ? approvedList
      : rejectedList;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 via-emerald-500/5 to-transparent rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#146B50] dark:text-[#D6A84F]">
            <FileText className="w-4 h-4" />
            <span>Dispensasi & Udzur Syar’i</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Tinjauan Perizinan Santri
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Tinjau foto bukti pengajuan, alasan udzur, geotag GPS, dan tentukan persetujuan dispensasi.
          </p>
        </div>

        {/* Tab Badges */}
        <div className="relative z-10 flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span>Menunggu</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
              {pendingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'approved'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span>Disetujui</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
              {approvedList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'rejected'
                ? 'bg-white dark:bg-stone-900 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span>Ditolak</span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold">
              {rejectedList.length}
            </span>
          </button>
        </div>
      </div>

      {/* List of Permissions */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-400 text-xs space-y-2">
            <FileText className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="font-semibold">Tidak ada permohonan izin pada kategori ini.</p>
          </div>
        ) : (
          currentList.map((rec) => {
            const meta = STATUS_META[rec.status];
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 w-full">
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-xs shrink-0 bg-black">
                    <img
                      src={rec.photo_path}
                      alt="Selfie Izin"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                        {rec.student_name}
                      </h3>
                      <span className="text-[11px] text-stone-400 font-mono">
                        NIS: {rec.student_number} • {rec.group_name}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#146B50] dark:text-emerald-400">
                      {rec.activity_name} ({rec.operational_date})
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
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
                        Jarak {Math.round(rec.distance_from_site_m)}m dari pondok
                      </span>
                    </div>

                    {rec.permission_reason && (
                      <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl text-xs text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 mt-1">
                        <strong className="block text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-300">
                          Alasan Izin Santri:
                        </strong>
                        <p className="mt-0.5 italic leading-relaxed">&ldquo;{rec.permission_reason}&rdquo;</p>
                      </div>
                    )}

                    {rec.review_note && (
                      <div className="p-2.5 bg-sky-50/80 dark:bg-sky-950/30 rounded-2xl text-xs text-sky-900 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/80 mt-1">
                        <strong className="block text-[10px] uppercase font-bold tracking-wider text-sky-800 dark:text-sky-300">
                          Catatan Keputusan ({rec.reviewed_by_name}):
                        </strong>
                        <p className="mt-0.5 leading-relaxed">{rec.review_note}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                  >
                    {meta.label}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailRecord(rec)}
                      className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
                      title="Detail Lengkap & Geotag"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {rec.status === 'izin_diajukan' && (
                      <button
                        type="button"
                        onClick={() => setReviewRecord(rec)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/30"
                      >
                        Tinjau & Putuskan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {reviewRecord && (
        <PermissionReviewModal
          record={reviewRecord}
          onClose={() => setReviewRecord(null)}
          onApprove={(id, note) => reviewPermission(id, 'izin_disetujui', note)}
          onReject={(id, note) => reviewPermission(id, 'izin_ditolak', note)}
        />
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <AttendanceDetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
        />
      )}
    </div>
  );
}
