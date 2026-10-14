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
  QrCode,
  Award,
  Zap,
} from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

export default function SantriProfilPage() {
  const { currentUser, attendanceRecords } = useStore();

  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);
  const totalHadir = studentRecords.filter((r) => r.status === 'hadir_valid').length;
  const totalIzin = studentRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
  ).length;
  const attendanceRate =
    studentRecords.length > 0
      ? Math.round((totalHadir / studentRecords.length) * 100)
      : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Digital Santri Member Card (Kartu Santri Digital) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#061812] via-[#0B3D2E] to-[#146B50] p-6 sm:p-8 text-white shadow-2xl border border-[#D6A84F]/40 group">
        {/* Subtle geometric luxury pattern lines */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#D6A84F]/20 via-transparent to-transparent rounded-full pointer-events-none blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar Profile */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1E8A68] to-[#0B3D2E] border-2 border-[#D6A84F] flex items-center justify-center text-3xl font-extrabold text-[#D6A84F] shadow-xl">
                {currentUser.full_name.charAt(0)}
              </div>
              <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[#D6A84F] text-[#0B3D2E] shadow-xs">
                SANTRI AKTIF
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{currentUser.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-emerald-200/90 font-mono">
                <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                  NIS: {currentUser.student_number}
                </span>
                <span className="bg-emerald-950/60 text-[#D6A84F] px-2 py-0.5 rounded-lg border border-[#D6A84F]/30 font-sans font-bold">
                  {currentUser.group_name}
                </span>
              </div>
              <p className="text-xs text-emerald-100/70 pt-1">
                Pondok Pesantren Nurul Falah • Ketintang, Surabaya
              </p>
            </div>
          </div>

          {/* Digital Badge / QR Mockup */}
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col items-center gap-1.5 text-center">
            <QrCode className="w-14 h-14 text-white" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-200 uppercase">
              ID: {currentUser.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stat Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Total Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#146B50] dark:text-emerald-400">
            {totalHadir}
          </div>
          <span className="text-[10px] text-stone-400 mt-1">Presensi Terverifikasi</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Total Izin</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {totalIzin}
          </div>
          <span className="text-[10px] text-stone-400 mt-1">Udzur Syar’i / Izin</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Tingkat Hadir</span>
            <Award className="w-4 h-4 text-[#D6A84F]" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {attendanceRate}%
          </div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1">Sangat Baik</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Status GPS</span>
            <Zap className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Valid
          </div>
          <span className="text-[10px] text-stone-400 mt-1">Radius Geofence</span>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detail Biodata */}
        <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <User className="w-4 h-4 text-[#146B50] dark:text-[#D6A84F]" />
            <span>Informasi Biodata Santri</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Nama Lengkap:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {currentUser.full_name}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Nomor Induk Santri (NIS):</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                {currentUser.student_number}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Kamar Asrama:</span>
              <span className="font-bold text-[#146B50] dark:text-emerald-400">
                {currentUser.group_name}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Nomor Telepon:</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {currentUser.phone || '0812-3456-7890'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Status Keaktifan:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktif Mengaji & Sekolah
              </span>
            </div>
          </div>
        </div>

        {/* Boarding School Information */}
        <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Building className="w-4 h-4 text-[#D6A84F]" />
            <span>Pesantren & Lokasi Kampus</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Nama Instansi:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {PONDOK_DEFAULT_COORDINATES.name}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Alamat:</span>
              <span className="text-stone-800 dark:text-stone-200 text-right max-w-[200px] font-medium">
                {PONDOK_DEFAULT_COORDINATES.address}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Zona Waktu Operasional:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Asia/Jakarta (WIB)
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Validasi Presensi:</span>
              <span className="font-semibold text-[#146B50] dark:text-[#D6A84F]">
                Kamera Depan + Geofence GPS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
