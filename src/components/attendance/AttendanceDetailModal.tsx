'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AttendanceRecord } from '@/types';
import { useStore } from '@/lib/store';
import { STATUS_META } from '@/lib/constants';
import { X, MapPin, Clock, Calendar, ShieldCheck, User, BookOpen, CheckCircle2, AlertCircle, Trash2, RotateCcw } from 'lucide-react';

interface AttendanceDetailModalProps {
  record: AttendanceRecord;
  onClose: () => void;
}

export default function AttendanceDetailModal({ record, onClose }: AttendanceDetailModalProps) {
  const router = useRouter();
  const { currentUser, deleteSantriAttendance } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const meta = STATUS_META[record.status];

  const canDelete =
    currentUser.id === record.student_id ||
    currentUser.role === 'admin' ||
    currentUser.role === 'musyrif';

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

          {/* Setoran Tahfidz Details if present */}
          {record.tahfidz_juz && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-emerald-950 dark:text-emerald-100">
                      Data Setoran Tahfidz
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      Rekaman setoran hafalan santri
                    </p>
                  </div>
                </div>

                {record.tahfidz_status === 'lancar' && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Lancar
                  </span>
                )}
                {record.tahfidz_status === 'perlu_diulang' && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Perlu Diulang
                  </span>
                )}
                {record.tahfidz_status === 'tidak_lancar' && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Tidak Lancar
                  </span>
                )}
                {(!record.tahfidz_status || record.tahfidz_status === 'menunggu_validasi') && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                    Menunggu Validasi Musyrif
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Tipe &amp; Juz</span>
                  <span className="text-sm font-extrabold text-[#146B50] dark:text-[#D6A84F] block">
                    {record.tahfidz_mode === 'murojaah' ? 'Muroja\'ah' : 'Ziyadah'} • Juz {record.tahfidz_juz}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Rentang Halaman</span>
                  <span className="text-sm font-extrabold text-[#146B50] dark:text-[#D6A84F] block">
                    {record.tahfidz_halaman_end && record.tahfidz_halaman_end !== record.tahfidz_halaman
                      ? `Hal ${record.tahfidz_halaman} - ${record.tahfidz_halaman_end}`
                      : `Halaman ${record.tahfidz_halaman || 1}`}
                  </span>
                </div>
              </div>

              {record.tahfidz_notes && (
                <div className="text-[11px] text-stone-700 dark:text-stone-300 bg-white/70 dark:bg-stone-900/70 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="font-bold block text-[10px] text-stone-400 mb-0.5">Catatan Santri:</span>
                  &quot;{record.tahfidz_notes}&quot;
                </div>
              )}

              {record.tahfidz_validated_at && (
                <div className="text-[10px] text-stone-500 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2 flex items-center justify-between">
                  <span>
                    Divalidasi oleh: <strong className="text-stone-700 dark:text-stone-300">{record.tahfidz_validated_by_name || 'Musyrif'}</strong>
                  </span>
                  <span>
                    {new Date(record.tahfidz_validated_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              )}

              {record.tahfidz_validation_note && (
                <div className="text-[11px] text-stone-700 dark:text-stone-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                  <span className="font-bold block text-[10px] text-amber-800 dark:text-amber-300 mb-0.5">Catatan Evaluasi Musyrif:</span>
                  &quot;{record.tahfidz_validation_note}&quot;
                </div>
              )}
            </div>
          )}

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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
            {canDelete ? (
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (
                    window.confirm(
                      `Apakah Anda yakin ingin menghapus data presensi kegiatan "${record.activity_name}" tanggal ${record.operational_date} untuk keperluan retake (ambil ulang)?`
                    )
                  ) {
                    setIsDeleting(true);
                    const res = await deleteSantriAttendance(record.id);
                    setIsDeleting(false);
                    if (res.success) {
                      onClose();
                      if (currentUser.role === 'santri') {
                        router.push('/santri/absensi');
                      }
                    } else {
                      alert(res.message);
                    }
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/80 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Hapus & Retake Absen'}</span>
              </button>
            ) : <div />}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-300 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
