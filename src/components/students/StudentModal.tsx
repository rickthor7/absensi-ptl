'use client';

import React, { useState } from 'react';
import { Profile } from '@/types';
import { X, UserPlus, Save, Lock, Mail, Eye, EyeOff, Key, Shield, User, Sparkles } from 'lucide-react';

interface StudentModalProps {
  student?: Profile | null;
  onClose: () => void;
  onSave: (data: {
    full_name: string;
    student_number: string;
    group_name: string;
    phone: string;
    is_active: boolean;
    email: string;
    password?: string;
  }) => void;
}

export default function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [fullName, setFullName] = useState(student?.full_name || '');
  const [studentNumber, setStudentNumber] = useState(student?.student_number || '');
  const [email, setEmail] = useState(
    student?.email ||
      (student?.student_number
        ? `${student.student_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.nurulfalah.ac.id`
        : '')
  );
  const [groupName, setGroupName] = useState(student?.group_name || 'Kamar Al-Fatih 01');
  const [phone, setPhone] = useState(student?.phone || '');
  const [isActive, setIsActive] = useState(student ? student.is_active : true);

  // Password management
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auto-generate suggested email based on student number or name if empty
  const handleStudentNumberChange = (value: string) => {
    setStudentNumber(value);
    if (!student && (!email || email.includes('@santri.nurulfalah.ac.id'))) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (slug) {
        setEmail(`${slug}@santri.nurulfalah.ac.id`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentNumber.trim()) return;

    const finalEmail =
      email.trim() ||
      `${studentNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.nurulfalah.ac.id`;

    onSave({
      full_name: fullName.trim(),
      student_number: studentNumber.trim(),
      group_name: groupName.trim(),
      phone: phone.trim(),
      is_active: isActive,
      email: finalEmail,
      password: password.trim() ? password.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] text-white p-5 flex items-center justify-between border-b border-[#D6A84F]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D6A84F]/40 flex items-center justify-center text-[#D6A84F]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {student ? 'Edit Santri & Akses Login' : 'Tambah Santri & Akun Login'}
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Kelola biodata santri dan kredensial login (username & sandi)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Section: Biodata Santri */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#146B50] dark:text-[#D6A84F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Data Identitas Santri</span>
            </span>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Nama Lengkap Santri <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Muhammad Ali Hasan"
                className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nomor Induk Santri (NIS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentNumber}
                  onChange={(e) => handleStudentNumberChange(e.target.value)}
                  placeholder="STR-2026-050"
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Kamar / Kelompok Asrama
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Kamar Al-Fatih 01"
                  className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Nomor Kontak / WhatsApp Santri / Wali
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none"
              />
            </div>
          </div>

          {/* Section: Akses Login & Kredensial */}
          <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#146B50] dark:text-[#D6A84F] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Akses Login & Kredensial Pengguna</span>
            </span>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Email / Username Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@santri.nurulfalah.ac.id"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Santri dapat login menggunakan <strong>Email ini</strong> ATAU <strong>NIS ({studentNumber || '...'})</strong>.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300">
                  {student ? 'Ubah Kata Sandi (Password)' : 'Kata Sandi Awal (Password)'}
                </label>
                {student && (
                  <span className="text-[10px] text-stone-400 italic">
                    (Kosongkan bila sandi tidak diubah)
                  </span>
                )}
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={student ? 'Masukkan sandi baru jika ingin diubah...' : 'Contoh: password123'}
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!student && !password && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  *Bila dikosongkan, kata sandi bawaan adalah: <strong className="font-mono">password123</strong>
                </p>
              )}
            </div>
          </div>

          {/* Status Aktif Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#146B50] rounded border-stone-300 focus:ring-[#146B50]"
            />
            <label htmlFor="isActive" className="font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
              Akun Aktif (Santri diizinkan masuk dan melakukan absensi)
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/30"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              <span>Simpan & Perbarui Akun</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
