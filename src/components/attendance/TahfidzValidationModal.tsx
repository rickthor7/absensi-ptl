'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceRecord, TahfidzValidationStatus } from '@/types';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  User,
  Calendar,
  Clock,
  FileText,
  BookmarkCheck,
} from 'lucide-react';

interface TahfidzValidationModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onValidate: (params: {
    recordId: string;
    juz?: number;
    halaman?: number;
    status: TahfidzValidationStatus;
    note?: string;
  }) => Promise<unknown> | void;
}

export default function TahfidzValidationModal({
  record,
  onClose,
  onValidate,
}: TahfidzValidationModalProps) {
  const [juz, setJuz] = useState<number>(record.tahfidz_juz || 30);
  const [halaman, setHalaman] = useState<number>(record.tahfidz_halaman || 1);
  const [status, setStatus] = useState<TahfidzValidationStatus>(
    record.tahfidz_status === 'menunggu_validasi' ? 'lancar' : (record.tahfidz_status || 'lancar')
  );
  const [note, setNote] = useState<string>(record.tahfidz_validation_note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onValidate({
        recordId: record.id,
        juz,
        halaman,
        status,
        note: note.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-[#D6A84F]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#D6A84F] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Evaluasi Hafalan Al-Qur&apos;an</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Validasi Setoran Tahfidz
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

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Santri Information Box */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-black shrink-0">
                {record.photo_path ? (
                  <img src={record.photo_path} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-stone-400">
                    Santri
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  {record.student_name}
                </h4>
                <p className="text-[11px] text-stone-400 font-mono">
                  NIS: {record.student_number || '-'} • {record.group_name || 'Santri'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#146B50] dark:text-[#D6A84F] bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              {record.activity_name}
            </span>
          </div>

          {/* Student's initial submission note if any */}
          {record.tahfidz_notes && (
            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                Catatan Input Santri:
              </span>
              <p className="text-stone-700 dark:text-stone-300 italic">
                &quot;{record.tahfidz_notes}&quot;
              </p>
            </div>
          )}

          {/* Juz & Halaman Selectors */}
          <div className="grid grid-cols-2 gap-3">
            {/* Juz Selector (1 - 30) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Juz Al-Qur&apos;an (1 - 30):
              </label>
              <select
                value={juz}
                onChange={(e) => setJuz(Number(e.target.value))}
                className="w-full text-xs font-extrabold p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>
                    Juz {j}
                  </option>
                ))}
              </select>
            </div>

            {/* Halaman Selector (1 - 20) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Halaman ke- (1 - 20):
              </label>
              <select
                value={halaman}
                onChange={(e) => setHalaman(Number(e.target.value))}
                className="w-full text-xs font-extrabold p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    Halaman {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Validasi Options */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
              Hasil Penilaian / Status Kelancaran:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Lancar */}
              <button
                type="button"
                onClick={() => setStatus('lancar')}
                className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                  status === 'lancar'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-extrabold'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 font-semibold'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Lancar / Sah</span>
              </button>

              {/* Perlu Diulang */}
              <button
                type="button"
                onClick={() => setStatus('perlu_diulang')}
                className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                  status === 'perlu_diulang'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md font-extrabold'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 font-semibold'
                }`}
              >
                <RotateCcw className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Perlu Diulang</span>
              </button>

              {/* Tidak Lancar */}
              <button
                type="button"
                onClick={() => setStatus('tidak_lancar')}
                className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                  status === 'tidak_lancar'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md font-extrabold'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 font-semibold'
                }`}
              >
                <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Belum Lancar</span>
              </button>
            </div>
          </div>

          {/* Musyrif Note / Evaluation Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Catatan &amp; Evaluasi Musyrif:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Makharijul huruf fasih, tajwid hukum nun mati diperbaiki sedikit..."
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white text-xs font-extrabold transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Validasi Setoran'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
