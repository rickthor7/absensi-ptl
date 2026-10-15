'use client';

import React, { useState } from 'react';
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
  Key,
  Mail,
  Shield,
  MapPin,
  Edit,
} from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';
import AccountSecurityModal from '@/components/layout/AccountSecurityModal';
import SantriEditModal from '@/components/students/SantriEditModal';

export default function SantriProfilPage() {
  const { currentUser, attendanceRecords } = useStore();
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
      {/* ── Prestigious Digital Santri Member Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#061812] via-[#0B3D2E] to-[#146B50] p-6 sm:p-8 text-white shadow-2xl border-2 border-[#D6A84F]/50 group">
        {/* Luxury Gold & Emerald Geometric Watermarks */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#D6A84F]/25 via-transparent to-transparent rounded-full pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 rounded-full border border-[#D6A84F]/15 pointer-events-none" />
        <div className="absolute top-4 right-1/4 text-8xl font-serif text-white/5 select-none pointer-events-none font-bold">
          ن
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar Profile */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1E8A68] via-[#146B50] to-[#082F23] border-2 border-[#D6A84F] flex items-center justify-center text-3xl font-extrabold text-[#D6A84F] shadow-2xl">
                {currentUser.full_name.charAt(0)}
              </div>
              <span className="absolute -bottom-2.5 inset-x-0 mx-auto w-max px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-[#D6A84F] to-[#F3D78A] text-[#082F23] shadow-md border border-[#082F23]/20">
                SANTRI AKTIF
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                {currentUser.full_name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                <span className="bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15 text-emerald-200">
                  NIS: {currentUser.student_number || '-'}
                </span>
                <span className="bg-[#051A13]/80 text-[#D6A84F] px-2.5 py-0.5 rounded-lg border border-[#D6A84F]/40 font-sans font-bold">
                  {currentUser.group_name || 'Santri'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 pt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#D6A84F]" />
                <span>PP. Nurul Falah • Ketintang, Surabaya</span>
              </p>
            </div>
          </div>

          {/* Digital Badge / QR Mockup & Action */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 flex flex-col items-center gap-1.5 text-center shadow-inner">
              <QrCode className="w-14 h-14 text-white" />
              <span className="text-[10px] font-mono tracking-widest text-emerald-200 uppercase font-bold">
                ID: {currentUser.id.slice(0, 8)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D6A84F] to-[#F3D78A] hover:brightness-105 text-[#082F23] text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Biodata</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20 active:scale-95 cursor-pointer backdrop-blur-sm"
              >
                <Key className="w-3.5 h-3.5 text-[#D6A84F]" />
                <span>Ganti Sandi</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Highlights ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">Total Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0D7B5F] dark:text-emerald-400">
            {totalHadir}
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Presensi Terverifikasi</span>
        </div>

        <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">Total Izin</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {totalIzin}
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Udzur Syar’i / Izin</span>
        </div>

        <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">Tingkat Hadir</span>
            <Award className="w-4 h-4 text-[#D6A84F]" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {attendanceRate}%
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
            {attendanceRate >= 80 ? 'Sangat Baik' : 'Cukup Baik'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">Validasi GPS</span>
            <Zap className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Aktif
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Geofence Presisi</span>
        </div>
      </div>

      {/* ── Information Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detail Biodata */}
        <div className="bg-white dark:bg-[#0F1E18] p-5 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#1C3A2E]">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0D7B5F] dark:text-[#D6A84F]" />
              <span>Informasi Biodata Santri</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="text-[11px] font-bold text-[#0D7B5F] dark:text-[#D6A84F] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                <span>Edit Data Santri</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Nama Lengkap:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {currentUser.full_name}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Nomor Induk Santri (NIS):</span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                {currentUser.student_number || '-'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Email Akun Login:</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {currentUser.email || '-'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Kamar Asrama:</span>
              <span className="font-bold text-[#0D7B5F] dark:text-emerald-400">
                {currentUser.group_name || 'Umum'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Nomor Telepon:</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {currentUser.phone || '-'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Status Keaktifan:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Santri Aktif & Terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* Boarding School Information */}
        <div className="bg-white dark:bg-[#0F1E18] p-5 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-[#1C3A2E]">
            <Building className="w-4 h-4 text-[#D6A84F]" />
            <span>Pesantren & Lokasi Kampus</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Nama Instansi:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {PONDOK_DEFAULT_COORDINATES.name}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Alamat:</span>
              <span className="text-stone-900 dark:text-stone-100 text-right max-w-[200px] font-medium">
                {PONDOK_DEFAULT_COORDINATES.address}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Zona Waktu:</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                Asia/Jakarta (WIB)
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Validasi Presensi:</span>
              <span className="font-semibold text-[#0D7B5F] dark:text-[#D6A84F]">
                Kamera Depan + Geofence GPS
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-600 dark:text-stone-400">Radius Bawaan:</span>
              <span className="font-bold font-mono text-stone-800 dark:text-stone-200">
                {PONDOK_DEFAULT_COORDINATES.defaultRadiusMeters} Meter
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Santri Profile Edit Modal */}
      <SantriEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Account & Security Modal */}
      <AccountSecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </div>
  );
}
