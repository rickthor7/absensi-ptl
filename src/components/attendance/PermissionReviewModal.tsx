'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '@/types';
import { useStore } from '@/lib/store';
import { X, CheckCircle, XCircle, MapPin, Clock, Layers, CheckCheck } from 'lucide-react';

interface PermissionReviewModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onApprove: (recordId: string, note: string, applyToBatch?: boolean) => void;
  onReject: (recordId: string, note: string, applyToBatch?: boolean) => void;
}

export default function PermissionReviewModal({
  record,
  onClose,
  onApprove,
  onReject,
}: PermissionReviewModalProps) {
  const { attendanceRecords } = useStore();
  const [note, setNote] = useState('');

  // Find all sibling records in the same batch
  const batchRecords = record.permission_batch_id
    ? attendanceRecords.filter(
        (r) =>
          r.permission_batch_id === record.permission_batch_id &&
          r.student_id === record.student_id
      )
    : [];
  const isMultiBatch = batchRecords.length > 1;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0B3D2E] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Tinjau Permohonan Izin Santri</h3>
            <p className="text-xs text-emerald-200/80">
              {record.student_name} • {record.group_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Photo & GPS Geotag metadata */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
            <img
              src={record.photo_path}
              alt="Foto Bukti Izin"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
            />
            <div className="text-xs space-y-1.5 flex-1 w-full">
              <p>
                <strong>Kegiatan:</strong> {record.activity_name} ({record.operational_date})
              </p>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Pengajuan: {new Date(record.submitted_at).toLocaleTimeString('id-ID')} WIB</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-[#146B50]" />
                <span>
                  Jarak: {Math.round(record.distance_from_site_m)}m (Akurasi: ±{Math.round(record.gps_accuracy_m)}m)
                </span>
              </div>
              <p className="font-mono text-[10px] text-stone-400">
                Lat: {record.latitude.toFixed(6)}, Lng: {record.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Student reason */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
              Alasan Udzur / Izin yang Disampaikan Santri:
            </span>
            <p className="text-stone-700 dark:text-stone-300 italic">
              &quot;{record.permission_reason || 'Tidak ada catatan alasan tambahan'}&quot;
            </p>
          </div>

          {/* Multi-Activity Batch Card if this belongs to a batch */}
          {isMultiBatch && (
            <div className="p-3.5 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent border border-amber-500/30 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Pengajuan Multi-Kegiatan ({batchRecords.length} Sesi Bersamaan)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                  Batch Izin
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                Santri mengajukan izin sekaligus untuk kegiatan berikut dalam 1 pengiriman:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {batchRecords.map((br) => (
                  <div
                    key={br.id}
                    className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${
                      br.id === record.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500/30'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100">{br.activity_name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{br.operational_date}</p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        br.status === 'izin_disetujui'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : br.status === 'izin_ditolak'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      {br.status === 'izin_diajukan' ? 'Menunggu' : br.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Musyrif note input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Catatan Musyrif (Disertakan dalam balasan ke Santri)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Disetujui, semoga lekas sembuh / Ditolak, santri wajib melampirkan surat dokter"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap gap-2">
                {/* Single Reject */}
                <button
                  type="button"
                  onClick={() => {
                    onReject(record.id, note || 'Izin ditolak oleh musyrif.', false);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak Sesi Ini</span>
                </button>

                {/* Single Approve */}
                <button
                  type="button"
                  onClick={() => {
                    onApprove(record.id, note || 'Izin disetujui oleh musyrif.', false);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-300 dark:border-emerald-800"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Setujui Sesi Ini</span>
                </button>

                {/* Batch Approve All if multi-activity */}
                {isMultiBatch && (
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(
                        record.id,
                        note || `Izin multi-kegiatan (${batchRecords.length} sesi) disetujui oleh musyrif.`,
                        true
                      );
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white text-xs font-bold transition shadow-md cursor-pointer border border-[#D6A84F]/40 active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4 text-[#D6A84F]" />
                    <span>Setujui SEMUA ({batchRecords.length} Sesi)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
