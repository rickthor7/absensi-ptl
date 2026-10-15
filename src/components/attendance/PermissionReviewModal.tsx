'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '@/types';
import { X, CheckCircle, XCircle, MapPin, Clock } from 'lucide-react';

interface PermissionReviewModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onApprove: (recordId: string, note: string) => void;
  onReject: (recordId: string, note: string) => void;
}

export default function PermissionReviewModal({
  record,
  onClose,
  onApprove,
  onReject,
}: PermissionReviewModalProps) {
  const [note, setNote] = useState('');

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
              className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <div className="text-xs space-y-1.5 flex-1">
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

          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onReject(record.id, note || 'Izin ditolak oleh musyrif.');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Tolak Izin
              </button>

              <button
                type="button"
                onClick={() => {
                  onApprove(record.id, note || 'Izin disetujui oleh musyrif.');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-[#D6A84F]" />
                Setujui Izin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
