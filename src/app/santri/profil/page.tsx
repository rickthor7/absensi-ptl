'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import {
  User,
  GraduationCap,
  ShieldCheck,
  Building,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

export default function SantriProfilPage() {
  const { currentUser, attendanceRecords } = useStore();

  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);
  const totalHadir = studentRecords.filter((r) => r.status === 'hadir_valid').length;
  const totalIzin = studentRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Profile Card Banner */}
      <div className="bg-gradient-to-r from-[#0B3D2E] via-[#146B50] to-[#0B3D2E] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#D6A84F]/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xs border-2 border-[#D6A84F] flex items-center justify-center text-3xl font-extrabold text-[#D6A84F] shadow-lg">
            {currentUser.full_name.charAt(0)}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-extrabold">{currentUser.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6A84F] text-[#0B3D2E]">
                Santri Aktif
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-mono">
              NIS: {currentUser.student_number} • {currentUser.group_name}
            </p>
            <p className="text-xs text-emerald-200/70 pt-1">
              Pondok Pesantren Nurul Falah, Ketintang, Surabaya
            </p>
          </div>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detail Biodata */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <User className="w-4 h-4 text-[#146B50]" />
            Informasi Pribadi & Asrama
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">Nama Lengkap:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {currentUser.full_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Nomor Induk Santri:</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                {currentUser.student_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Kamar / Kelompok:</span>
              <span className="font-bold text-[#146B50]">{currentUser.group_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Kontak Santri/Wali:</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {currentUser.phone || '0812-3456-7890'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Terdaftar Sejak:</span>
              <span className="text-stone-800 dark:text-stone-200">10 Januari 2026</span>
            </div>
          </div>
        </div>

        {/* Boarding School Info */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Building className="w-4 h-4 text-[#D6A84F]" />
            Pondok Pesantren
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">Pesantren:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {PONDOK_DEFAULT_COORDINATES.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Alamat:</span>
              <span className="text-stone-800 dark:text-stone-200 text-right max-w-[200px]">
                {PONDOK_DEFAULT_COORDINATES.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Zona Waktu:</span>
              <span className="font-semibold text-emerald-700">Asia/Jakarta (WIB)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Sistem Absensi:</span>
              <span className="font-semibold text-[#146B50]">
                Selfie Kamera & Geotag Radius
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Lifetime Stats */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#146B50]" />
          Ringkasan Catatan Presensi Santri
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
            <span className="text-xs text-emerald-700 block font-semibold">Total Hadir</span>
            <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
              {totalHadir}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
            <span className="text-xs text-amber-700 block font-semibold">Total Izin</span>
            <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">
              {totalIzin}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200">
            <span className="text-xs text-stone-600 block font-semibold">Total Tercatat</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              {studentRecords.length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
            <span className="text-xs text-emerald-700 block font-semibold">Persentase</span>
            <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
              {studentRecords.length > 0
                ? `${Math.round((totalHadir / studentRecords.length) * 100)}%`
                : '100%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
