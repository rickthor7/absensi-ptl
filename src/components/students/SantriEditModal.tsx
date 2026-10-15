'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  X,
  User,
  GraduationCap,
  Building,
  Phone,
  Mail,
  Key,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SantriEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ROOMS = [
  'Kamar Al-Fatih 01',
  'Kamar Al-Fatih 02',
  'Kamar Al-Ghazali 01',
  'Kamar Al-Ghazali 02',
  'Kamar Ibnu Sina 01',
  'Kamar Abu Bakar 01',
];

export default function SantriEditModal({ isOpen, onClose }: SantriEditModalProps) {
  const { currentUser, updateCurrentUserCredentials } = useStore();

  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [studentNumber, setStudentNumber] = useState(currentUser.student_number || '');
  const [groupName, setGroupName] = useState(currentUser.group_name || 'Kamar Al-Fatih 01');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.full_name || '');
      setStudentNumber(currentUser.student_number || '');
      setGroupName(currentUser.group_name || 'Kamar Al-Fatih 01');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, currentUser]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap santri wajib diisi.');
      return;
    }

    if (!studentNumber.trim()) {
      setErrorMsg('Nomor Induk Santri (NIS) wajib diisi.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Alamat email / username login wajib diisi.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateCurrentUserCredentials({
        fullName: fullName.trim(),
        studentNumber: studentNumber.trim(),
        groupName: groupName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      });

      if (result.success) {
        setSuccessMsg(result.message);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui data santri.');
    } finally {
      setIsLoading(false);
    }
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
        <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#D6A84F]/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D6A84F]/40 flex items-center justify-center text-[#D6A84F] shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Edit Data Santri
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D6A84F]/20 text-[#D6A84F] border border-[#D6A84F]/30">
                  Mandiri
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                Perbarui biodata profil, asrama, nomor kontak, dan keamanan akun
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Identitas Santri */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D7B5F] dark:text-[#D6A84F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Identitas & Biodata Santri</span>
            </span>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                Nama Lengkap Santri <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap Santri"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Nomor Induk Santri (NIS) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="Contoh: STR-2026-001"
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Kamar Asrama / Kelompok
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Kamar Al-Fatih 01"
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Quick Room Selectors */}
            <div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1.5">
                Pilih Cepat Asrama:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ROOMS.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setGroupName(room)}
                    className={`text-[10px] px-2.5 py-1 rounded-xl border transition cursor-pointer font-medium ${
                      groupName === room
                        ? 'bg-[#0D7B5F] text-white border-[#0D7B5F]'
                        : 'bg-stone-50 dark:bg-[#162B22] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#1C3A2E] hover:border-[#0D7B5F]/50'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                Nomor Telepon / WhatsApp Santri / Wali
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none font-mono transition"
                />
              </div>
            </div>
          </div>

          {/* Section: Akun & Keamanan */}
          <div className="pt-3 border-t border-stone-100 dark:border-[#1C3A2E] space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D7B5F] dark:text-[#D6A84F] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Kredensial Akun & Kata Sandi</span>
            </span>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                Email / Username Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="santri@nurulfalah.ac.id"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none font-mono transition"
                />
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                Email ini digunakan untuk login masuk ke portal santri.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-stone-800 dark:text-stone-200">
                  Kata Sandi Baru
                </label>
                <span className="text-[10px] text-stone-400 italic">
                  Kosongkan bila tidak ingin ganti kata sandi
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword && (
              <div className="animate-in fade-in duration-150">
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru..."
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none font-mono transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-[#1C3A2E]">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0D7B5F] via-[#096B52] to-[#082F23] hover:from-[#096B52] hover:to-[#051A13] text-white font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              <span>{isLoading ? 'Menyimpan Data...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
