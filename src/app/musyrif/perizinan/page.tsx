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
  Filter,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <FileText className="w-4 h-4 text-[#D6A84F]" />
            <span>Tinjauan Permohonan Izin</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Perizinan Santri & Udzur Syar’i
          </h1>
          <p className="text-xs text-stone-500">
            Tinjau foto bukti, surat/alasan udzur, lokasi geotag, dan putuskan izin santri
          </p>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-stone-900 text-amber-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Menunggu Tinjauan</span>
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'approved'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Disetujui</span>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
              {approvedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-white dark:bg-stone-900 text-rose-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Ditolak</span>
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px]">
              {rejectedList.length}
            </span>
          </button>
        </div>
      </div>

      {/* List of Permissions */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-400 text-xs">
            Tidak ada permohonan izin pada kategori ini.
          </div>
        ) : (
          currentList.map((rec) => {
            const meta = STATUS_META[rec.status];
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={rec.photo_path}
                    alt="Selfie Izin"
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {rec.student_name}
                      </h3>
                      <span className="text-[11px] text-stone-400">
                        NIS: {rec.student_number} • {rec.group_name}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#146B50]">
                      {rec.activity_name} ({rec.operational_date})
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(rec.submitted_at).toLocaleTimeString('id-ID')} WIB
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#146B50]" />
                        Jarak {Math.round(rec.distance_from_site_m)}m dari pondok
                      </span>
                    </div>

                    {rec.permission_reason && (
                      <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl text-xs text-amber-900 dark:text-amber-200 border border-amber-200/80 mt-2">
                        <strong>Alasan Izin:</strong> &quot;{rec.permission_reason}&quot;
                      </div>
                    )}

                    {rec.review_note && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-xs text-blue-900 dark:text-blue-200 border border-blue-200/80 mt-1">
                        <strong>Keputusan Musyrif ({rec.reviewed_by_name}):</strong> {rec.review_note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 self-end md:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                  >
                    {meta.label}
                  </span>

                  <button
                    onClick={() => setDetailRecord(rec)}
                    className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                    title="Detail Lengkap"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {rec.status === 'izin_diajukan' && (
                    <button
                      onClick={() => setReviewRecord(rec)}
                      className="px-4 py-2 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Tinjau & Putuskan
                    </button>
                  )}
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
