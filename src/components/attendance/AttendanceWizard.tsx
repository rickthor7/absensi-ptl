'use client';

import React, { useState } from 'react';
import { Activity, AttendanceType, AttendanceRecord } from '@/types';
import { useStore } from '@/lib/store';
import { isTahfidzActivity } from '@/lib/schedule';
import SelfieCapture from './SelfieCapture';
import LocationChecker from './LocationChecker';
import {
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Send,
  UserCheck,
  FileQuestion,
  History,
  Clock,
  MapPin,
  ShieldCheck,
  Camera,
  BookOpen,
  Bookmark,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface AttendanceWizardProps {
  activity: Activity;
  onFinished?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export default function AttendanceWizard({ activity, onFinished }: AttendanceWizardProps) {
  const { currentUser, submitAttendance, effectiveTime } = useStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('hadir');
  const [permissionReason, setPermissionReason] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceMeters: number;
    isPass: boolean;
  } | null>(null);

  // Tahfidz setoran state
  const isTahfidz = isTahfidzActivity(activity) && attendanceType === 'hadir';
  const [tahfidzJuz, setTahfidzJuz] = useState<number>(30);
  const [tahfidzHalaman, setTahfidzHalaman] = useState<number>(1);
  const [tahfidzNotes, setTahfidzNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    record: AttendanceRecord;
    message: string;
  } | null>(null);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#146B50', '#D6A84F', '#0B3D2E', '#237A4B'],
      });
    } catch {
      // Ignore
    }
  };

  const handleFinalSubmit = async () => {
    if (!photoUrl || !locationData) return;
    setIsSubmitting(true);

    const result = await submitAttendance({
      activityId: activity.id,
      type: attendanceType,
      photoDataUrl: photoUrl,
      coords: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
      },
      permissionReason: attendanceType === 'izin' ? permissionReason : undefined,
      tahfidzJuz: isTahfidz ? tahfidzJuz : undefined,
      tahfidzHalaman: isTahfidz ? tahfidzHalaman : undefined,
      tahfidzNotes: isTahfidz && tahfidzNotes.trim() ? tahfidzNotes.trim() : undefined,
    });

    setSubmissionResult(result);
    setIsSubmitting(false);

    // Jump to final step (Step 6 if Tahfidz, Step 5 if normal)
    setCurrentStep((isTahfidz ? 6 : 5) as WizardStep);

    if (result.record.status === 'hadir_valid') {
      triggerConfetti();
    }
    if (onFinished) {
      onFinished();
    }
  };

  // Step Labels & Total Steps dynamically determined
  const stepLabels = isTahfidz
    ? ['Status', 'Selfie', 'Lokasi', 'Setoran', 'Tinjau', 'Selesai']
    : ['Status', 'Selfie', 'Lokasi', 'Tinjau', 'Selesai'];

  const totalSteps = stepLabels.length;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] p-5 sm:p-6 text-white relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D6A84F] tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isTahfidz ? 'Presensi & Setoran Tahfidz' : 'Presensi Santri Berbasis Geotag'}
            </span>
          </div>
          <span className="text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-emerald-200 font-semibold border border-white/10">
            Langkah {currentStep} / {totalSteps}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">{activity.name}</h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Santri: <strong className="text-white">{currentUser.full_name}</strong> ({currentUser.student_number || 'Santri'})
            </p>
          </div>
          <div className="text-left sm:text-right mt-1 sm:mt-0">
            <span className="text-xs bg-emerald-950/60 text-[#D6A84F] font-bold px-2.5 py-1 rounded-xl border border-[#D6A84F]/30 inline-block">
              {activity.start_time} - {activity.end_time} WIB
            </span>
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div
          className={`mt-5 grid gap-1.5 ${
            totalSteps === 6 ? 'grid-cols-6' : 'grid-cols-5'
          }`}
        >
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <div key={stepNum} className="flex flex-col gap-1 items-center">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#D6A84F]'
                      : isActive
                      ? 'bg-emerald-400'
                      : 'bg-white/20'
                  }`}
                />
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider hidden sm:block ${
                    isActive ? 'text-[#D6A84F]' : 'text-emerald-200/60'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* STEP 1: Pilih Status (Hadir vs Izin) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                Pilih Jenis Absensi
              </h3>
              <p className="text-xs text-stone-500">
                Tentukan apakah Anda mengikuti kegiatan langsung di pondok atau mengajukan izin udzur
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card Hadir */}
              <button
                type="button"
                onClick={() => setAttendanceType('hadir')}
                className={`p-5 rounded-2xl border-2 text-left transition relative cursor-pointer group ${
                  attendanceType === 'hadir'
                    ? 'border-[#146B50] bg-emerald-50/60 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-600/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-emerald-200 bg-stone-50/40 dark:bg-stone-800/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-[#146B50] flex items-center justify-center mb-3">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  {attendanceType === 'hadir' && (
                    <div className="w-6 h-6 rounded-full bg-[#146B50] text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#146B50]">
                  Hadir di Pesantren
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Saya hadir di lokasi pondok dan siap melakukan validasi wajah serta koordinat GPS.
                </p>
              </button>

              {/* Card Izin */}
              <button
                type="button"
                onClick={() => setAttendanceType('izin')}
                className={`p-5 rounded-2xl border-2 text-left transition relative cursor-pointer group ${
                  attendanceType === 'izin'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-amber-200 bg-stone-50/40 dark:bg-stone-800/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 flex items-center justify-center mb-3">
                    <FileQuestion className="w-6 h-6" />
                  </div>
                  {attendanceType === 'izin' && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-700">
                  Pengajuan Izin
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Izin udzur syar’i, sakit, atau tugas luar dengan persetujuan verifikasi musyrif.
                </p>
              </button>
            </div>

            {/* If Izin selected */}
            {attendanceType === 'izin' && (
              <div className="space-y-2 p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/70 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                  Alasan Izin (Wajib Diisi):
                </label>
                <textarea
                  rows={3}
                  value={permissionReason}
                  onChange={(e) => setPermissionReason(e.target.value)}
                  placeholder="Contoh: Sakit demam beristirahat di kamar/UKS, urusan keluarga duka cita..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  *Lampirkan alasan jelas agar musyrif dapat menyetujui dispensasi kehadiran Anda.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={attendanceType === 'izin' && !permissionReason.trim()}
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#D6A84F]/30"
              >
                <span>Lanjut ke Foto Selfie</span>
                <ArrowRight className="w-4 h-4 text-[#D6A84F]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Ambil Selfie */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                Validasi Wajah (Selfie)
              </h3>
              <p className="text-xs text-stone-500">
                Posisikan wajah Anda pada area bingkai panduan kamera
              </p>
            </div>

            <SelfieCapture
              photoUrl={photoUrl}
              onCapture={(url) => setPhotoUrl(url)}
              onRetake={() => setPhotoUrl(null)}
            />

            <div className="flex justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800 gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                disabled={!photoUrl}
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white text-xs font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#D6A84F]/30 active:scale-95"
              >
                <span>Lanjut ke Lokasi</span>
                <ArrowRight className="w-4 h-4 text-[#D6A84F]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verifikasi Lokasi */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                Verifikasi Geotag GPS
              </h3>
              <p className="text-xs text-stone-500">
                Sistem menghitung jarak posisi Anda terhadap titik pusat pondok
              </p>
            </div>

            <LocationChecker
              activity={activity}
              attendanceType={attendanceType}
              onLocationVerified={(res) => setLocationData(res)}
            />

            <div className="flex justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800 gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ubah Foto</span>
              </button>

              <button
                type="button"
                disabled={!locationData}
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white text-xs font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#D6A84F]/30 active:scale-95"
              >
                <span>{isTahfidz ? 'Lanjut ke Input Setoran' : 'Tinjau Ringkasan'}</span>
                <ArrowRight className="w-4 h-4 text-[#D6A84F]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 (KHUSUS TAHFIDZ): Input Data Setoran Juz 1-30 & Halaman 1-20 */}
        {currentStep === 4 && isTahfidz && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#146B50] dark:text-[#D6A84F] text-xs font-extrabold mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Setoran Hafalan Al-Qur&apos;an</span>
              </div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                Pilih Juz &amp; Halaman Setoran
              </h3>
              <p className="text-xs text-stone-500">
                Tentukan target hafalan yang Anda setorkan pada sesi ini. Musyrif akan memvalidasi kelancaran Anda.
              </p>
            </div>

            {/* Input Card */}
            <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 p-4 sm:p-5 space-y-5">
              {/* Select Juz (1 - 30) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-[#146B50]" />
                    <span>Juz Al-Qur&apos;an (1 - 30):</span>
                  </label>
                  <span className="text-xs font-extrabold text-[#146B50] dark:text-[#D6A84F] bg-white dark:bg-stone-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-mono">
                    Juz {tahfidzJuz}
                  </span>
                </div>

                <select
                  value={tahfidzJuz}
                  onChange={(e) => setTahfidzJuz(Number(e.target.value))}
                  className="w-full text-xs font-extrabold p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50] cursor-pointer shadow-xs"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                    <option key={j} value={j}>
                      Juz {j} {j === 30 ? "(Juz 'Amma)" : j === 1 ? '(Al-Fatihah - Al-Baqarah)' : ''}
                    </option>
                  ))}
                </select>

                {/* Quick Quick-Select Pills for common Juz */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-stone-400 py-1 font-semibold">Cepat:</span>
                  {[30, 29, 28, 1, 2, 3].map((quickJuz) => (
                    <button
                      key={quickJuz}
                      type="button"
                      onClick={() => setTahfidzJuz(quickJuz)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                        tahfidzJuz === quickJuz
                          ? 'bg-[#146B50] text-white shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#146B50]'
                      }`}
                    >
                      Juz {quickJuz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Halaman (1 - 20) */}
              <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#D6A84F]" />
                    <span>Halaman ke- (1 - 20):</span>
                  </label>
                  <span className="text-xs font-extrabold text-[#146B50] dark:text-[#D6A84F] bg-white dark:bg-stone-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-mono">
                    Halaman {tahfidzHalaman}
                  </span>
                </div>

                {/* 20 Numeric Buttons Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTahfidzHalaman(h)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                        tahfidzHalaman === h
                          ? 'bg-gradient-to-br from-[#146B50] to-[#0B3D2E] text-white shadow-md'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan / Ayat (Opsional) */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-700/60">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Rincian Surat / Ayat (Opsional):
                </label>
                <input
                  type="text"
                  value={tahfidzNotes}
                  onChange={(e) => setTahfidzNotes(e.target.value)}
                  placeholder="Contoh: QS. An-Naba' ayat 1 - 25, lancar..."
                  className="w-full text-xs p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-[#146B50]"
                />
              </div>

              {/* Selected Summary Badge */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#146B50] shrink-0" />
                  <span>
                    Target: <strong>Juz {tahfidzJuz}</strong> • <strong>Halaman {tahfidzHalaman}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-white/70 dark:bg-stone-900/70 px-2 py-0.5 rounded-md border border-emerald-300">
                  Menunggu Validasi Musyrif
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800 gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ubah Lokasi</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer border border-[#D6A84F]/30 active:scale-95"
              >
                <span>Lanjut ke Tinjauan</span>
                <ArrowRight className="w-4 h-4 text-[#D6A84F]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP REVIEW / TINJAUAN: (Step 5 if Tahfidz, Step 4 if Normal) */}
        {((isTahfidz && currentStep === 5) || (!isTahfidz && currentStep === 4)) && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                Konfirmasi Tiket Presensi
              </h3>
              <p className="text-xs text-stone-500">
                Periksa kembali data kehadiran Anda sebelum dikirim ke database
              </p>
            </div>

            {/* Boarding Pass Style Card */}
            <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#146B50] shadow-md shrink-0 bg-black">
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Selfie Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-[#D6A84F] px-1.5 py-0.5 rounded-md font-mono">
                    Selfie OK
                  </span>
                </div>

                <div className="flex-1 w-full space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700/60">
                    <span className="text-stone-500">Nama Santri:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {currentUser.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700/60">
                    <span className="text-stone-500">Kegiatan:</span>
                    <span className="font-bold text-[#146B50]">{activity.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700/60">
                    <span className="text-stone-500">Jenis Absen:</span>
                    <span
                      className={`font-bold uppercase px-2 py-0.5 rounded-full text-[10px] ${
                        attendanceType === 'hadir'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {attendanceType}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700/60">
                    <span className="text-stone-500">Waktu Kirim:</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {effectiveTime.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Jarak ke Pondok:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {Math.round(locationData?.distanceMeters || 0)} meter
                    </span>
                  </div>
                </div>
              </div>

              {/* Tahfidz Setoran Info Badge */}
              {isTahfidz && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#146B50] shrink-0" />
                    <div>
                      <span className="font-extrabold block">
                        Setoran: Juz {tahfidzJuz} • Halaman {tahfidzHalaman}
                      </span>
                      {tahfidzNotes && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
                          &quot;{tahfidzNotes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 text-[#146B50] border border-emerald-300">
                    Menunggu Validasi Musyrif
                  </span>
                </div>
              )}

              {attendanceType === 'izin' && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block text-[11px] mb-0.5">Alasan Izin:</span>
                  <p className="italic">{permissionReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800 gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep((isTahfidz ? 4 : 3) as WizardStep)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isTahfidz ? 'Ubah Setoran' : 'Ubah Lokasi'}</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#146B50] via-[#1A7F60] to-[#0B3D2E] text-white text-xs font-bold transition shadow-lg shadow-emerald-950/25 active:scale-95 cursor-pointer border border-[#D6A84F]/40"
              >
                <Send className="w-4 h-4 text-[#D6A84F]" />
                <span>{isSubmitting ? 'Memproses Data...' : 'Kirim Absensi Sekarang'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP FINAL / HASIL PENGIRIMAN: (Step 6 if Tahfidz, Step 5 if Normal) */}
        {((isTahfidz && currentStep === 6) || (!isTahfidz && currentStep === 5)) && submissionResult && (
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              {submissionResult.record.status === 'hadir_valid' ? (
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border-2 border-emerald-500 shadow-xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#D6A84F] text-[#0B3D2E] flex items-center justify-center text-xs font-bold shadow-xs">
                    ✓
                  </span>
                </div>
              ) : submissionResult.record.status === 'izin_diajukan' ? (
                <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center border-2 border-amber-500 shadow-xl">
                  <FileQuestion className="w-10 h-10 text-amber-600" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center border-2 border-rose-500 shadow-xl">
                  <AlertTriangle className="w-10 h-10 text-rose-600" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {submissionResult.record.status === 'hadir_valid'
                  ? 'Alhamdulillah, Presensi Sah!'
                  : submissionResult.record.status === 'izin_diajukan'
                  ? 'Pengajuan Izin Berhasil Dikirim'
                  : 'Presensi Di Luar Radius'}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                {submissionResult.message}
              </p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 text-left text-xs max-w-sm mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Status Kehadiran:</span>
                <span className="font-bold text-[#146B50]">
                  {submissionResult.record.status === 'hadir_valid'
                    ? 'Hadir Valid'
                    : submissionResult.record.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jarak Terhitung:</span>
                <span className="font-semibold">
                  {Math.round(submissionResult.record.distance_from_site_m)} meter
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Akurasi GPS:</span>
                <span className="font-semibold">
                  ±{Math.round(submissionResult.record.gps_accuracy_m)}m
                </span>
              </div>

              {/* Setoran Tahfidz info if submitted */}
              {submissionResult.record.tahfidz_juz && (
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center text-[#146B50] font-bold">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Setoran Hafalan:</span>
                  </span>
                  <span>
                    Juz {submissionResult.record.tahfidz_juz} • Hal {submissionResult.record.tahfidz_halaman}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <Link
                href="/santri/kalender"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md active:scale-95"
              >
                <Calendar className="w-4 h-4 text-[#D6A84F]" />
                <span>Buka Kalender Presensi</span>
              </Link>
              <Link
                href="/santri/riwayat"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition active:scale-95"
              >
                <History className="w-4 h-4" />
                <span>Riwayat Lengkap</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
