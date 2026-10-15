'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus } from '@/types';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CorrectionModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onSave: (recordId: string, newStatus: AttendanceStatus, reason: string) => void;
}

export default function CorrectionModal({ record, onClose, onSave }: CorrectionModalProps) {
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(record.status);
  const [reason, setReason] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const statusOptions: { value: AttendanceStatus; label: string }[] = [
    { value: 'hadir_valid', label: 'Hadir Tervalidasi' },
    { value: 'izin_disetujui', label: 'Izin Disetujui' },
    { value: 'izin_ditolak', label: 'Izin Ditolak' },
    { value: 'perlu_tinjauan', label: 'Perlu Tinjauan' },
    { value: 'ditolak_lokasi', label: 'Ditolak (Di Luar Radius)' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onSave(record.id, newStatus, reason.trim());
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0B3D2E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#D6A84F]" />
            <div>
              <h3 className="font-bold text-base">Koreksi Manual Absensi</h3>
              <p className="text-[11px] text-emerald-200/80">Audit Trail Terpusat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 text-xs space-y-1">
            <p>
              <strong>Santri:</strong> {record.student_name} ({record.student_number})
            </p>
            <p>
              <strong>Kegiatan:</strong> {record.activity_name} ({record.operational_date})
            </p>
            <p>
              <strong>Status Saat Ini:</strong> <span className="font-mono text-[#146B50]">{record.status}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Pilih Status Baru *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Alasan Koreksi Manual (Wajib Audit Log) *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan resmi perubahan status, misalnya: Santri hadir tepat waktu di masjid namun kendala GPS hp santri di area pojok asrama."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D6A84F]" />
              Simpan Koreksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
