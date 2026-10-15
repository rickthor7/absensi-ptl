'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { X, Key, Lock, Mail, User, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSecurityModal({ isOpen, onClose }: AccountSecurityModalProps) {
  const { currentUser, updateCurrentUserCredentials } = useStore();

  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Alamat Email / Username login tidak boleh kosong.');
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
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      });

      if (result.success) {
        setSuccessMsg(result.message);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui kredensial akun.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] text-white p-5 flex items-center justify-between border-b border-[#D6A84F]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D6A84F]/40 flex items-center justify-center text-[#D6A84F]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Akun & Keamanan Login</h3>
              <p className="text-[11px] text-emerald-200/80">
                Ubah username/email dan kata sandi akses akun Anda
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
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Role Pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">Peran Akun Aktif:</span>
              <span className="font-extrabold text-stone-900 dark:text-stone-100 capitalize">
                {currentUser.role} {currentUser.group_name ? `• ${currentUser.group_name}` : ''}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#146B50]/10 text-[#146B50] dark:text-[#D6A84F] font-bold">
              ID: {currentUser.id.slice(0, 10)}
            </span>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Email / Username Login <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alamat.email@nurulfalah.ac.id"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Alamat email ini digunakan untuk masuk / login ke aplikasi.
            </p>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812-3456-7890"
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none font-mono"
            />
          </div>

          {/* Change Password Section */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#146B50] dark:text-[#D6A84F] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Ganti Kata Sandi (Opsional)</span>
            </span>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-stone-700 dark:text-stone-300">
                  Kata Sandi Baru
                </label>
                <span className="text-[10px] text-stone-400 italic">
                  Kosongkan jika tidak ingin ganti sandi
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
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
            </div>

            {newPassword && (
              <div className="animate-in fade-in duration-150">
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru..."
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#146B50] outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              <span>{isLoading ? 'Menyimpan...' : 'Perbarui Kredensial'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
