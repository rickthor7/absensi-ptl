'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/types';
import { X, UserPlus, Save, Lock, Mail, Eye, EyeOff, Key, Shield, User, Sparkles, AlertCircle } from 'lucide-react';

interface StudentModalProps {
  student?: Profile | null;
  onClose: () => void;
  onSave: (data: {
    full_name: string;
    nickname?: string;
    student_number: string;
    group_name: string;
    generation?: string | number;
    class_tahfidz_pagi?: string;
    class_tahfidz_malam?: string;
    lid?: string;
    phone: string;
    is_active: boolean;
    email: string;
    password?: string;
  }) => void;
}

export default function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [fullName, setFullName] = useState(student?.full_name || '');
  const [nickname, setNickname] = useState(student?.nickname || '');
  const [studentNumber, setStudentNumber] = useState(student?.student_number || '');
  const [generation, setGeneration] = useState(String(student?.generation || '2026'));
  const [classTahfidzPagi, setClassTahfidzPagi] = useState(student?.class_tahfidz_pagi || 'A');
  const [classTahfidzMalam, setClassTahfidzMalam] = useState(student?.class_tahfidz_malam || 'A');
  const [lid, setLid] = useState(student?.lid || '');
  const [email, setEmail] = useState(
    student?.email ||
      (student?.student_number
        ? `${student.student_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.nurulfalah.ac.id`
        : '')
  );
  const [groupName, setGroupName] = useState(student?.group_name || 'Angkatan 2026');
  const [phone, setPhone] = useState(student?.phone || '');
  const [isActive, setIsActive] = useState(student ? student.is_active : true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever student prop changes
  useEffect(() => {
    setFullName(student?.full_name || '');
    setNickname(student?.nickname || '');
    setStudentNumber(student?.student_number || '');
    setGeneration(String(student?.generation || '2026'));
    setClassTahfidzPagi(student?.class_tahfidz_pagi || 'A');
    setClassTahfidzMalam(student?.class_tahfidz_malam || 'A');
    setLid(student?.lid || '');
    setEmail(
      student?.email ||
        (student?.student_number
          ? `${student.student_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.nurulfalah.ac.id`
          : '')
    );
    setGroupName(student?.group_name || 'Angkatan 2026');
    setPhone(student?.phone || '');
    setIsActive(student ? student.is_active : true);
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
  }, [student]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap santri wajib diisi.');
      return;
    }
    if (!studentNumber.trim()) {
      setErrorMsg('Nomor Induk Santri (NIS) wajib diisi.');
      return;
    }

    const finalEmail =
      email.trim() ||
      `${studentNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.nurulfalah.ac.id`;

    onSave({
      full_name: fullName.trim(),
      nickname: nickname.trim(),
      student_number: studentNumber.trim(),
      group_name: groupName.trim(),
      generation: generation.trim(),
      class_tahfidz_pagi: classTahfidzPagi,
      class_tahfidz_malam: classTahfidzMalam,
      lid: lid.trim(),
      phone: phone.trim(),
      is_active: isActive,
      email: finalEmail,
      password: password.trim() ? password.trim() : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-[#1C3A2E] overflow-hidden my-8 animate-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] text-white p-5 flex items-center justify-between border-b border-[#D6A84F]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D6A84F]/40 flex items-center justify-center text-[#D6A84F] shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                {student ? 'Edit Santri & Akses Login' : 'Tambah Santri & Akun Login'}
              </h3>
              <p className="text-[11px] text-emerald-200/90">
                Kelola biodata santri dan kredensial login (username & sandi)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          {/* Section: Biodata Santri */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D7B5F] dark:text-[#D6A84F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Data Identitas Santri</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Nama Lengkap Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: MUHAMMAD DLIYAAUL HAQ SHIDQEY"
                  className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="DLIYA'"
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-[#D6A84F]/40 dark:border-[#D6A84F]/30 bg-white dark:bg-[#162B22] text-[#0D7B5F] dark:text-[#D6A84F] focus:ring-2 focus:ring-[#D6A84F]/30 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Nomor Induk Santri (NIS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentNumber}
                  onChange={(e) => handleStudentNumberChange(e.target.value)}
                  placeholder="STR-2023-001"
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Angkatan (Tahun Masuk)
                </label>
                <select
                  value={generation}
                  onChange={(e) => setGeneration(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 outline-none transition"
                >
                  <option value="2023">Angkatan 2023</option>
                  <option value="2024">Angkatan 2024</option>
                  <option value="2025">Angkatan 2025</option>
                  <option value="2026">Angkatan 2026</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Kelas Tahfidz Pagi
                </label>
                <select
                  value={classTahfidzPagi}
                  onChange={(e) => setClassTahfidzPagi(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 outline-none transition"
                >
                  <option value="A">Kelas A</option>
                  <option value="B">Kelas B</option>
                  <option value="-">- (Tidak Ada)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Kelas Tahfidz Malam
                </label>
                <select
                  value={classTahfidzMalam}
                  onChange={(e) => setClassTahfidzMalam(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 outline-none transition"
                >
                  <option value="A">Kelas A</option>
                  <option value="B">Kelas B</option>
                  <option value="-">- (Tidak Ada)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Nomor HP / WhatsApp Santri
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6282143863964"
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Nomor LID (WhatsApp ID)
                </label>
                <input
                  type="text"
                  value={lid}
                  onChange={(e) => setLid(e.target.value)}
                  placeholder="181041662808088@lid"
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section: Akses Login & Kredensial */}
          <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-[#1C3A2E]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D7B5F] dark:text-[#D6A84F] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Akses Login & Kredensial Pengguna</span>
            </span>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
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
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                />
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                Santri dapat login menggunakan <strong>Email ini</strong> ATAU <strong>NIS ({studentNumber || '...'})</strong>.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-stone-800 dark:text-stone-200">
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
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!student && !password && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
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
              className="w-4 h-4 text-[#0D7B5F] rounded border-stone-300 focus:ring-[#0D7B5F]"
            />
            <label htmlFor="isActive" className="font-semibold text-stone-800 dark:text-stone-200 cursor-pointer select-none">
              Akun Aktif (Santri diizinkan masuk dan melakukan absensi)
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-[#1C3A2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0D7B5F] via-[#096B52] to-[#082F23] hover:from-[#096B52] hover:to-[#051A13] text-white font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/30"
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
