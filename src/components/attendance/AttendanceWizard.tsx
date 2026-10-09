'use client';

import React, { useState } from 'react';
import { Activity, AttendanceType, AttendanceRecord } from '@/types';
import { useStore } from '@/lib/store';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface AttendanceWizardProps {
  activity: Activity;
  onFinished?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    record: AttendanceRecord;
    message: string;
  } | null>(null);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#146B50', '#D6A84F', '#0B3D2E', '#237A4B'],
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  const handleFinalSubmit = () => {
    if (!photoUrl || !locationData) return;
    setIsSubmitting(true);

    const result = submitAttendance({
      activityId: activity.id,
      type: attendanceType,
      photoDataUrl: photoUrl,
      coords: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
      },
      permissionReason: attendanceType === 'izin' ? permissionReason : undefined,
    });

    setSubmissionResult(result);
    setIsSubmitting(false);
    setCurrentStep(5);

    if (result.record.status === 'hadir_valid') {
      triggerConfetti();
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Top Header of the Wizard */}
      <div className="bg-gradient-to-r from-[#0B3D2E] to-[#146B50] p-6 text-white relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6A84F]">
            <Sparkles className="w-4 h-4" />
            <span>Alur Absensi Santri Terpadu</span>
          </div>
          <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-emerald-200 font-mono">
            Langkah {currentStep} dari 5
          </span>
        </div>

        <h2 className="text-xl font-bold">{activity.name}</h2>
        <p className="text-xs text-emerald-100/80 mt-1">
          {activity.start_time} - {activity.end_time} WIB • Santri: {currentUser.full_name}
        </p>

        {/* Progress Bar */}
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                step <= currentStep ? 'bg-[#D6A84F]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: Pilih Status (Hadir vs Izin) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Pilih Jenis Absensi
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda mengikuti kegiatan di pondok atau mengajukan izin?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Hadir */}
              <button
                type="button"
                onClick={() => setAttendanceType('hadir')}
                className={`p-5 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                  attendanceType === 'hadir'
                    ? 'border-[#146B50] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-600/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-emerald-200'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-[#146B50] flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Hadir
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Saya hadir di pondok dan siap mengambil selfie serta memverifikasi lokasi GPS.
                </p>
                {attendanceType === 'hadir' && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#146B50] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Card Izin */}
              <button
                type="button"
                onClick={() => setAttendanceType('izin')}
                className={`p-5 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                  attendanceType === 'izin'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-md ring-2 ring-amber-500/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-amber-200'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 flex items-center justify-center mb-3">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Izin
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Pengajuan izin karena udzur syar’i, sakit, atau tugas dengan persetujuan musyrif.
                </p>
                {attendanceType === 'izin' && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>

            {/* If Izin selected, require explanation */}
            {attendanceType === 'izin' && (
              <div className="space-y-2 p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                  Alasan Izin (Wajib Diisi):
                </label>
                <textarea
                  rows={3}
                  value={permissionReason}
                  onChange={(e) => setPermissionReason(e.target.value)}
                  placeholder="Contoh: Sakit demam sedang dirawat di UKS, izin pulang ke rumah keluarga duka cita, dsb."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="text-[11px] text-stone-500">
                  *Izin tetap memerlukan selfie dan lokasi sebagai bukti pengajuan ke musyrif.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                disabled={attendanceType === 'izin' && !permissionReason.trim()}
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <span>Lanjut ke Ambil Selfie</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Ambil Selfie */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Ambil Selfie Kamera
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Arahkan wajah ke panduan oval pada layar untuk validasi kehadiran
              </p>
            </div>

            <SelfieCapture
              photoUrl={photoUrl}
              onCapture={(url) => setPhotoUrl(url)}
              onRetake={() => setPhotoUrl(null)}
            />

            <div className="flex justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>

              <button
                type="button"
                disabled={!photoUrl}
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <span>Lanjut ke Lokasi GPS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verifikasi Lokasi */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Verifikasi Lokasi Geotag
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Sistem menghitung jarak lokasi Anda terhadap titik pondok
              </p>
            </div>

            <LocationChecker
              activity={activity}
              attendanceType={attendanceType}
              onLocationVerified={(res) => setLocationData(res)}
            />

            <div className="flex justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Foto
              </button>

              <button
                type="button"
                disabled={!locationData}
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <span>Lanjut ke Konfirmasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Konfirmasi Ringkasan */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Tinjau & Kirim Absensi
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Pastikan data foto, kegiatan, dan lokasi Anda sudah sesuai
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              {/* Photo Preview */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-stone-500 mb-2">Foto Selfie:</span>
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#146B50] shadow-md bg-black">
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Selfie Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Data Summary */}
              <div className="md:col-span-2 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-500">Santri:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {currentUser.full_name} ({currentUser.student_number})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-500">Kegiatan:</span>
                  <span className="font-bold text-[#146B50]">{activity.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-500">Jenis:</span>
                  <span
                    className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] ${
                      attendanceType === 'hadir'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {attendanceType}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-500">Waktu Kirim:</span>
                  <span className="font-medium">
                    {effectiveTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">Jarak ke Pondok:</span>
                  <span className="font-bold">
                    {Math.round(locationData?.distanceMeters || 0)} meter
                  </span>
                </div>
                {attendanceType === 'izin' && (
                  <div className="pt-2 text-stone-600 dark:text-stone-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 text-[11px]">
                    <span className="font-bold block text-amber-800 dark:text-amber-200">
                      Alasan Izin:
                    </span>
                    {permissionReason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Ubah Lokasi
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white text-xs font-bold transition shadow-lg shadow-emerald-950/20 active:scale-95 cursor-pointer border border-[#D6A84F]/40"
              >
                <Send className="w-4 h-4 text-[#D6A84F]" />
                <span>{isSubmitting ? 'Memproses...' : 'Kirim Absensi Sekarang'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Hasil Pengiriman Absensi */}
        {currentStep === 5 && submissionResult && (
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              {submissionResult.record.status === 'hadir_valid' ? (
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center border-4 border-emerald-500 shadow-xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : submissionResult.record.status === 'izin_diajukan' ? (
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center border-4 border-amber-500 shadow-xl">
                  <FileQuestion className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center border-4 border-rose-500 shadow-xl">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {submissionResult.record.status === 'hadir_valid'
                  ? 'Alhamdulillah, Kehadiran Tervalidasi!'
                  : submissionResult.record.status === 'izin_diajukan'
                  ? 'Pengajuan Izin Terkirim'
                  : 'Absensi Ditolak Sistem'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto mt-2">
                {submissionResult.message}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-left text-xs max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">ID Tiket:</span>
                <span className="font-mono font-semibold">{submissionResult.record.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status Database:</span>
                <span className="font-bold text-[#146B50]">
                  {submissionResult.record.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jarak Geodesik:</span>
                <span>
                  {Math.round(submissionResult.record.distance_from_site_m)} meter dari pondok
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Akurasi GPS:</span>
                <span>±{Math.round(submissionResult.record.gps_accuracy_m)} meter</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                href="/santri/kalender"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#146B50] text-white text-xs font-bold hover:bg-[#0B3D2E] transition shadow-md"
              >
                <Calendar className="w-4 h-4 text-[#D6A84F]" />
                Lihat di Kalender
              </Link>
              <Link
                href="/santri/riwayat"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <History className="w-4 h-4" />
                Lihat Riwayat Absensi
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
