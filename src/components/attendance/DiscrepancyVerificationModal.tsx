'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus } from '@/types';
import { STATUS_META } from '@/lib/constants';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  MapPin,
  Camera,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Eye,
  ZoomIn,
} from 'lucide-react';

interface DiscrepancyVerificationModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onVerify: (recordId: string, finalStatus: AttendanceStatus, note?: string) => Promise<unknown> | void;
}

export default function DiscrepancyVerificationModal({
  record,
  onClose,
  onVerify,
}: DiscrepancyVerificationModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    record.status === 'perlu_tinjauan' ? 'hadir_valid' : record.status
  );
  const [verificationNote, setVerificationNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirm = async (statusToSet: AttendanceStatus) => {
    setIsSubmitting(true);
    try {
      await onVerify(record.id, statusToSet, verificationNote.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const santriStatusMeta = record.santri_status ? STATUS_META[record.santri_status] : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-200 font-bold">
                <span>Pemeriksaan Ketidaksamaan Presensi</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Verifikasi Bukti & Status Akhir
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Santri Info Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div>
              <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {record.student_name}
              </h4>
              <p className="text-xs text-stone-500 font-mono">
                NIS: {record.student_number || '-'} • {record.group_name || 'Santri Pondok'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-[#146B50] dark:text-[#D6A84F] block">
                {record.activity_name}
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {record.operational_date}
              </span>
            </div>
          </div>

          {/* Mismatch Alert Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Ditemukan Ketidaksamaan Data Presensi:</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 pl-6 leading-relaxed">
              {record.discrepancy_reason ||
                'Terdapat perbedaan antara data absensi mandiri santri dan catatan manual musyrif pada kegiatan ini.'}
            </p>
          </div>

          {/* Comparison Cards: Santri vs Musyrif */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Data Mandiri Santri */}
            <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#146B50]" />
                  <span>Absen Mandiri Santri</span>
                </span>
                {santriStatusMeta ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${santriStatusMeta.bgClass} ${santriStatusMeta.textClass} ${santriStatusMeta.borderClass}`}
                  >
                    {santriStatusMeta.label}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-stone-100 text-stone-500">
                    {record.santri_status === 'belum_absen' ? 'Belum Absen' : record.status}
                  </span>
                )}
              </div>

              {/* Photo Evidence with Zoom */}
              <div className="relative group rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-black aspect-video flex items-center justify-center">
                {record.photo_path ? (
                  <>
                    <img
                      src={record.photo_path}
                      alt="Selfie Bukti Santri"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPhotoZoomed(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Perbesar Bukti Foto</span>
                    </button>
                  </>
                ) : (
                  <div className="text-stone-400 text-xs text-center p-4">
                    Tidak ada foto selfie mandiri
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-300 font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Waktu Kirim:</span>
                  <span className="font-mono">
                    {new Date(record.submitted_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Jarak Geodesik:</span>
                  <span className="font-bold text-[#146B50] dark:text-[#D6A84F] font-mono">
                    {Math.round(record.distance_from_site_m)} meter
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Akurasi GPS:</span>
                  <span className="font-mono text-stone-500">
                    ±{Math.round(record.gps_accuracy_m)}m
                  </span>
                </div>
                {record.permission_reason && (
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                    <span className="text-stone-400 block text-[10px]">Alasan Izin:</span>
                    <p className="font-semibold text-stone-800 dark:text-stone-200 italic">
                      &quot;{record.permission_reason}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Catatan Manual Musyrif */}
            <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/30 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#D6A84F]" />
                    <span>Catatan Manual Musyrif</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      record.musyrif_status === 'hadir'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : record.musyrif_status === 'izin'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    Dicatat:{' '}
                    {record.musyrif_status === 'hadir'
                      ? 'HADIR'
                      : record.musyrif_status === 'izin'
                      ? 'IZIN'
                      : 'ALPA'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Dicatat:{' '}
                      {record.reviewed_at
                        ? new Date(record.reviewed_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) + ' WIB'
                        : 'Saat absensi manual kegiatan'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#146B50]" />
                    <span>Musyrif: {record.reviewed_by_name || 'Musyrif Piket'}</span>
                  </div>
                  {record.review_note && (
                    <div className="text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 p-2 rounded-lg">
                      Catatan: &quot;{record.review_note}&quot;
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <p>
                    💡 <strong>Saran Musyrif:</strong> Jika santri memang ada di tempat (misal HP
                    lowbat atau foto di luar radius sedikit), silakan verifikasi Hadir. Jika santri
                    tidak terlihat di barisan, Anda berhak menetapkan Alpa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Decision Area */}
          <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div>
              <label className="block text-xs font-extrabold text-stone-800 dark:text-stone-200 mb-1.5">
                Catatan Verifikasi Musyrif (Opsional)
              </label>
              <input
                type="text"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="Contoh: Dikonfirmasi hadir di shaf belakang / Selfie valid meski radius toleransi..."
                className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
              />
            </div>

            <div>
              <span className="block text-xs font-extrabold text-stone-800 dark:text-stone-200 mb-2">
                Pilih Keputusan Akhir Verifikasi:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Button 1: HADIR */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirm('hadir_valid')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Verifikasi HADIR</span>
                </button>

                {/* Button 2: IZIN */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirm('izin_disetujui')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Verifikasi IZIN</span>
                </button>

                {/* Button 3: ALPA */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirm('alpa')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  <span>Tetapkan ALPA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Modal for Deep Zoom */}
      {isPhotoZoomed && record.photo_path && (
        <div
          onClick={() => setIsPhotoZoomed(false)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={record.photo_path}
              alt="Zoomed Selfie"
              className="max-h-[85vh] w-auto rounded-3xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
