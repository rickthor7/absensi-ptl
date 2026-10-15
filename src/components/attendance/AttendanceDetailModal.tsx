'use client';

import React, { useEffect } from 'react';
import { AttendanceRecord } from '@/types';
import { STATUS_META } from '@/lib/constants';
import { X, MapPin, Clock, Calendar, ShieldCheck, User } from 'lucide-react';

interface AttendanceDetailModalProps {
  record: AttendanceRecord;
  onClose: () => void;
}

export default function AttendanceDetailModal({ record, onClose }: AttendanceDetailModalProps) {
  const meta = STATUS_META[record.status];

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
            <h3 className="font-bold text-base">Detail Catatan Absensi</h3>
            <p className="text-xs text-emerald-200/80">
              ID: {record.id}
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
          {/* Status Badge Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-stone-50 dark:bg-stone-800/40">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Status Absensi</span>
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{meta.label}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
            >
              {record.status}
            </span>
          </div>

          {/* Photo & GPS */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-stone-300 dark:border-stone-700 shadow-sm bg-black shrink-0">
              <img
                src={record.photo_path}
                alt="Selfie"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-xs space-y-2 flex-1 w-full">
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <User className="w-3.5 h-3.5 text-[#146B50]" />
                <span className="font-bold">{record.student_name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{record.activity_name} • {record.operational_date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Waktu Kirim: {new Date(record.submitted_at).toLocaleTimeString('id-ID')} WIB</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-[#146B50]" />
                <span>Jarak ke Titik: {Math.round(record.distance_from_site_m)} meter</span>
              </div>
              <div className="font-mono text-[10px] text-stone-500 bg-stone-200/50 dark:bg-stone-700/50 p-1.5 rounded-lg">
                Koordinat: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)} (±{Math.round(record.gps_accuracy_m)}m)
              </div>
            </div>
          </div>

          {/* Permission Reason if any */}
          {record.permission_reason && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                Alasan Pengajuan Izin:
              </span>
              <p className="text-stone-700 dark:text-stone-300 italic">
                &quot;{record.permission_reason}&quot;
              </p>
            </div>
          )}

          {/* Musyrif Review Note if any */}
          {record.review_note && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Catatan Keputusan Musyrif ({record.reviewed_by_name || 'Musyrif'}):</span>
              </div>
              <p className="text-stone-700 dark:text-stone-300">{record.review_note}</p>
            </div>
          )}

          {/* Audit Corrections History if any */}
          {record.audit_corrections && record.audit_corrections.length > 0 && (
            <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-stone-700 dark:text-stone-300 block">
                Histori Koreksi Manual:
              </span>
              {record.audit_corrections.map((corr, idx) => (
                <div key={idx} className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span>{corr.corrected_by}</span>
                    <span className="text-stone-400">{new Date(corr.corrected_at).toLocaleTimeString('id-ID')}</span>
                  </div>
                  <p className="text-stone-500">
                    Status: <span className="line-through">{corr.original_status}</span> &rarr; <span className="font-bold text-emerald-600">{corr.corrected_status}</span>
                  </p>
                  <p className="italic text-stone-600 dark:text-stone-400">&quot;{corr.reason}&quot;</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-300 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
