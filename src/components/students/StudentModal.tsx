'use client';

import React, { useState } from 'react';
import { Profile } from '@/types';
import { X, UserPlus, Save } from 'lucide-react';

interface StudentModalProps {
  student?: Profile | null;
  onClose: () => void;
  onSave: (data: {
    full_name: string;
    student_number: string;
    group_name: string;
    phone: string;
    is_active: boolean;
  }) => void;
}

export default function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [fullName, setFullName] = useState(student?.full_name || '');
  const [studentNumber, setStudentNumber] = useState(student?.student_number || '');
  const [groupName, setGroupName] = useState(student?.group_name || 'Kamar Al-Fatih 01');
  const [phone, setPhone] = useState(student?.phone || '');
  const [isActive, setIsActive] = useState(student ? student.is_active : true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentNumber.trim()) return;

    onSave({
      full_name: fullName.trim(),
      student_number: studentNumber.trim(),
      group_name: groupName.trim(),
      phone: phone.trim(),
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0B3D2E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#D6A84F]" />
            <h3 className="font-bold text-base">
              {student ? 'Edit Data Santri' : 'Tambah Santri Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Nama Lengkap Santri *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Muhammad Ali Hasan"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Nomor Induk Santri (NIS) *
            </label>
            <input
              type="text"
              required
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="Contoh: STR-2026-050"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Kamar / Kelompok Asrama
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Contoh: Kamar Al-Fatih 01"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              No. Kontak / Wali Santri
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 0812-3456-7890"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#146B50] rounded border-stone-300 focus:ring-[#146B50]"
            />
            <label htmlFor="isActive" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Akun Aktif (Dapat melakukan absensi)
            </label>
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
