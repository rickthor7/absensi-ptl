'use client';

import React, { useState } from 'react';
import { Activity, AttendanceType, AttendanceRecord, TahfidzMode } from '@/types';
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
  RotateCcw,
  Layers,
  CalendarDays,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

const QUICK_PERMIT_REASONS = [
  'Sakit demam & istirahat di UKS / Kamar',
  'Izin rawat medis / periksa ke dokter RS',
  'Izin pulang urusan keluarga mendesak',
  'Dispensasi tugas khidmah pondok pesantren',
  'Terkendala keterlambatan perjalanan balik pondok',
];

interface AttendanceWizardProps {
  activity: Activity;
  onFinished?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export default function AttendanceWizard({ activity, onFinished }: AttendanceWizardProps) {
  const {
    currentUser,
    activities,
    submitAttendance,
    submitMultiPermission,
    effectiveTime,
    getLastTahfidzRecord,
    attendanceRecords,
    deleteSantriAttendance,
  } = useStore();

  const todayStr = effectiveTime.toISOString().split('T')[0];
  const tomorrow = new Date(effectiveTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const activeActivities = activities.filter((a) => a.is_active);

  // Multi-activity selection state for Izin: array of `${activityId}_${dateStr}`
  const [selectedIzinKeys, setSelectedIzinKeys] = useState<string[]>([`${activity.id}_${todayStr}`]);
  const [izinDateTab, setIzinDateTab] = useState<'today' | 'tomorrow'>('today');

  // Synchronize when parent changes the selected activity
  React.useEffect(() => {
    const key = `${activity.id}_${todayStr}`;
    setSelectedIzinKeys((prev) => (prev.includes(key) ? prev : [key, ...prev]));
  }, [activity.id, todayStr]);
  const existingAttendance = attendanceRecords.find(
    (r) =>
      r.student_id === currentUser.id &&
      r.activity_id === activity.id &&
      r.operational_date === todayStr
  );

  const [isRetaking, setIsRetaking] = useState(false);
  const [retakeNotification, setRetakeNotification] = useState<string | null>(null);

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

  // Tahfidz setoran state (Ziyadah vs Murojaah, Juz 1-30, Halaman Mulai & Akhir 1-20)
  const isTahfidz = isTahfidzActivity(activity) && attendanceType === 'hadir';
  const [tahfidzMode, setTahfidzMode] = useState<TahfidzMode>('ziyadah');
  const [tahfidzJuz, setTahfidzJuz] = useState<number>(30);
  const [tahfidzHalaman, setTahfidzHalaman] = useState<number>(1);
  const [tahfidzHalamanEnd, setTahfidzHalamanEnd] = useState<number>(1);
  const [tahfidzNotes, setTahfidzNotes] = useState<string>('');
  const [hasInitializedTahfidz, setHasInitializedTahfidz] = useState(false);

  // Ambil riwayat setoran terakhir santri untuk auto-continue
  const lastTahfidz = getLastTahfidzRecord(currentUser.id, tahfidzMode) || getLastTahfidzRecord(currentUser.id);

  // Auto-hitung halaman lanjutan dari setoran kemarin
  const applyContinuedDefault = (modeToUse: TahfidzMode = tahfidzMode) => {
    const last = getLastTahfidzRecord(currentUser.id, modeToUse) || getLastTahfidzRecord(currentUser.id);
    if (last && last.tahfidz_juz) {
      const lastEnd = last.tahfidz_halaman_end || last.tahfidz_halaman || 1;
      let nextJuz = last.tahfidz_juz;
      let nextPage = lastEnd + 1;
      if (lastEnd >= 20) {
        nextJuz = last.tahfidz_juz < 30 ? last.tahfidz_juz + 1 : 1;
        nextPage = 1;
      }
      setTahfidzJuz(nextJuz);
      setTahfidzHalaman(nextPage);
      setTahfidzHalamanEnd(nextPage);
    } else {
      setTahfidzJuz(30);
      setTahfidzHalaman(1);
      setTahfidzHalamanEnd(1);
    }
  };

  // Inisialisasi default otomatis saat wizard tahfidz pertama kali dibuka
  React.useEffect(() => {
    if (isTahfidz && !hasInitializedTahfidz) {
      applyContinuedDefault('ziyadah');
      setHasInitializedTahfidz(true);
    }
  }, [isTahfidz, hasInitializedTahfidz]);

  const handleModeChange = (newMode: TahfidzMode) => {
    setTahfidzMode(newMode);
    applyContinuedDefault(newMode);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    record: AttendanceRecord;
    records?: AttendanceRecord[];
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

  const handleRetake = async (recordIdToRetake: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus data absensi kegiatan "${activity.name}" untuk mengambil ulang presensi (retake)?`
      )
    ) {
      return;
    }
    setIsRetaking(true);
    const res = await deleteSantriAttendance(recordIdToRetake);
    setIsRetaking(false);
    if (res.success) {
      setCurrentStep(1);
      setAttendanceType('hadir');
      setPermissionReason('');
      setPhotoUrl(null);
      setLocationData(null);
      setSubmissionResult(null);
      setRetakeNotification(res.message);
      applyContinuedDefault('ziyadah');
    } else {
      alert(res.message);
    }
  };

  const handleFinalSubmit = async () => {
    if (!photoUrl || !locationData) return;
    setIsSubmitting(true);

    if (attendanceType === 'izin') {
      const targets = selectedIzinKeys.map((key) => {
        const [actId, dateStr] = key.split('_');
        return { activityId: actId, operationalDate: dateStr };
      });

      const result = await submitMultiPermission({
        targets,
        photoDataUrl: photoUrl,
        coords: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        },
        permissionReason,
      });

      setSubmissionResult({
        success: result.success,
        record: result.records[0] || ({} as AttendanceRecord),
        records: result.records,
        message: result.message,
      });
      setIsSubmitting(false);

      // Jump to review result step (Step 5 for normal wizard)
      setCurrentStep(5 as WizardStep);

      if (onFinished) {
        onFinished();
      }
      return;
    }

    const result = await submitAttendance({
      activityId: activity.id,
      type: attendanceType,
      photoDataUrl: photoUrl,
      coords: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
      },
      permissionReason: undefined,
      tahfidzMode: isTahfidz ? tahfidzMode : undefined,
      tahfidzJuz: isTahfidz ? tahfidzJuz : undefined,
      tahfidzHalaman: isTahfidz ? tahfidzHalaman : undefined,
      tahfidzHalamanEnd: isTahfidz ? tahfidzHalamanEnd : undefined,
      tahfidzNotes: isTahfidz && tahfidzNotes.trim() ? tahfidzNotes.trim() : undefined,
    });

    setSubmissionResult({
      ...result,
      records: [result.record],
    });
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
            {/* Banner jika santri sudah presensi di kegiatan ini hari ini */}
            {existingAttendance && !submissionResult && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Anda Sudah Melakukan Presensi Hari Ini
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Status: <strong className="uppercase">{existingAttendance.status.replace(/_/g, ' ')}</strong> tercatat pada pukul{' '}
                      {new Date(existingAttendance.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.
                    </p>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
                      Foto selfie kurang jelas, salah pilih juz/halaman tahfidz, atau koordinat perlu diperbaiki? Anda dapat menghapus data absensi kegiatan ini untuk keperluan retake (ambil ulang).
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isRetaking}
                    onClick={() => handleRetake(existingAttendance.id)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRetaking ? 'animate-spin' : ''}`} />
                    <span>{isRetaking ? 'Menghapus Data...' : 'Hapus & Ambil Ulang Absen (Retake)'}</span>
                  </button>
                </div>
              </div>
            )}

            {retakeNotification && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{retakeNotification}</span>
              </div>
            )}

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
              <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/40 dark:from-amber-950/40 dark:via-stone-900/60 dark:to-stone-900/40 rounded-3xl border border-amber-200/90 dark:border-amber-800/70 shadow-sm animate-in fade-in duration-200">
                {/* 1. Multi-Kegiatan Selector */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>1. Pilih Kegiatan yang Diajukan Izin:</span>
                    </label>
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full self-start sm:self-auto border border-amber-200 dark:border-amber-800">
                      {selectedIzinKeys.length} Kegiatan Terpilih
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-stone-500 font-semibold py-1">Pilih Cepat:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIzinKeys([`${activity.id}_${todayStr}`])}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer active:scale-95 border ${
                        selectedIzinKeys.length === 1 && selectedIzinKeys[0] === `${activity.id}_${todayStr}`
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      Hanya {activity.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = activeActivities
                          .filter((a) => a.start_time >= activity.start_time)
                          .map((a) => `${a.id}_${todayStr}`);
                        setSelectedIzinKeys(remaining.length > 0 ? remaining : [`${activity.id}_${todayStr}`]);
                      }}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400 transition cursor-pointer active:scale-95"
                    >
                      Sisa Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIzinKeys(activeActivities.map((a) => `${a.id}_${todayStr}`))}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400 transition cursor-pointer active:scale-95"
                    >
                      Semua Hari Ini ({activeActivities.length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIzinKeys([
                          ...activeActivities.map((a) => `${a.id}_${todayStr}`),
                          ...activeActivities.map((a) => `${a.id}_${tomorrowStr}`),
                        ])
                      }
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400 transition cursor-pointer active:scale-95"
                    >
                      Hari Ini &amp; Besok ({activeActivities.length * 2})
                    </button>
                  </div>

                  {/* Date Tabs (Hari Ini vs Besok) */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setIzinDateTab('today')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        izinDateTab === 'today'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Hari Ini ({todayStr})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIzinDateTab('tomorrow')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        izinDateTab === 'tomorrow'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Besok ({tomorrowStr})</span>
                    </button>
                  </div>

                  {/* List of activities for the active tab */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                    {activeActivities.map((act) => {
                      const curDate = izinDateTab === 'today' ? todayStr : tomorrowStr;
                      const key = `${act.id}_${curDate}`;
                      const isSelected = selectedIzinKeys.includes(key);

                      const exist = attendanceRecords.find(
                        (r) =>
                          r.student_id === currentUser.id &&
                          r.activity_id === act.id &&
                          r.operational_date === curDate
                      );

                      return (
                        <div
                          key={key}
                          onClick={() => {
                            setSelectedIzinKeys((prev) =>
                              prev.includes(key)
                                ? prev.filter((k) => k !== key)
                                : [...prev, key]
                            );
                          }}
                          className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 shadow-xs ring-1 ring-amber-500/20'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? 'bg-amber-600 text-white'
                                  : 'border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                {act.name}
                              </p>
                              <p className="text-[10px] text-stone-500 font-mono">
                                {act.start_time} - {act.end_time} WIB
                              </p>
                            </div>
                          </div>

                          {exist && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase shrink-0">
                              {exist.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Alasan Izin & Quick Chips */}
                <div className="space-y-2 pt-3 border-t border-amber-200 dark:border-amber-800/60">
                  <label className="block text-xs font-extrabold text-amber-950 dark:text-amber-200">
                    2. Alasan Izin (Wajib Diisi):
                  </label>
                  <textarea
                    rows={2}
                    value={permissionReason}
                    onChange={(e) => setPermissionReason(e.target.value)}
                    placeholder="Contoh: Sakit demam beristirahat di kamar/UKS, urusan keluarga mendesak..."
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  />

                  {/* Quick Reason Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-stone-500 block">
                      Saran Alasan Cepat (Klik untuk memilih):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PERMIT_REASONS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setPermissionReason(chip)}
                          className={`text-[10px] px-2.5 py-1 rounded-xl font-semibold transition cursor-pointer active:scale-95 ${
                            permissionReason === chip
                              ? 'bg-amber-600 text-white font-bold shadow-xs'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={
                  attendanceType === 'izin' &&
                  (!permissionReason.trim() || selectedIzinKeys.length === 0)
                }
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#D6A84F]/30"
              >
                <span>
                  {attendanceType === 'izin' && selectedIzinKeys.length > 1
                    ? `Lanjut (${selectedIzinKeys.length} Kegiatan Dipilih)`
                    : 'Lanjut ke Foto Selfie / Bukti'}
                </span>
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
                {attendanceType === 'izin'
                  ? 'Foto Bukti / Selfie Santri'
                  : 'Validasi Wajah (Selfie)'}
              </h3>
              <p className="text-xs text-stone-500">
                {attendanceType === 'izin'
                  ? 'Posisikan wajah Anda atau foto surat izin/keterangan dokter di depan kamera'
                  : 'Posisikan wajah Anda pada area bingkai panduan kamera'}
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

        {/* STEP 4 (KHUSUS TAHFIDZ): Input Data Setoran Ziyadah / Murojaah, Juz 1-30 & Halaman 1-20 */}
        {currentStep === 4 && isTahfidz && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#146B50] dark:text-[#D6A84F] text-xs font-extrabold mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Setoran Hafalan Al-Qur&apos;an</span>
              </div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                Pilih Mode &amp; Halaman Setoran
              </h3>
              <p className="text-xs text-stone-500">
                Pilih tipe setoran (Ziyadah atau Muroja&apos;ah) serta rentang halaman yang disetorkan.
              </p>
            </div>

            {/* Input Card Container */}
            <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 p-4 sm:p-5 space-y-5">
              {/* 1. Tipe / Mode Setoran: Ziyadah vs Murojaah */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D6A84F]" />
                  <span>1. Pilih Tipe / Mode Setoran:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleModeChange('ziyadah')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${
                      tahfidzMode === 'ziyadah'
                        ? 'border-[#146B50] bg-emerald-50 dark:bg-emerald-950/50 shadow-sm ring-2 ring-emerald-600/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-[#146B50] flex items-center justify-center font-bold text-xs">
                          ✨
                        </span>
                        <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">
                          Ziyadah (Hafalan Baru)
                        </span>
                      </div>
                      {tahfidzMode === 'ziyadah' && (
                        <CheckCircle2 className="w-4 h-4 text-[#146B50]" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-8">
                      Menambah hafalan baru, otomatis melanjutkan halaman terakhir.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('murojaah')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${
                      tahfidzMode === 'murojaah'
                        ? 'border-[#146B50] bg-emerald-50 dark:bg-emerald-950/50 shadow-sm ring-2 ring-emerald-600/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 flex items-center justify-center font-bold text-xs">
                          🔄
                        </span>
                        <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">
                          Muroja&apos;ah (Pengulangan)
                        </span>
                      </div>
                      {tahfidzMode === 'murojaah' && (
                        <CheckCircle2 className="w-4 h-4 text-[#146B50]" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-8">
                      Mengulang dan melancarkan hafalan lampau agar mutqin.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Banner Riwayat Setoran Terakhir & Auto-Continue */}
              {lastTahfidz && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#D6A84F]/10 to-transparent border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#146B50] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#146B50] dark:text-[#D6A84F] bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                          Setoran Kemarin ({lastTahfidz.tahfidz_mode === 'murojaah' ? 'Murojaah' : 'Ziyadah'})
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {lastTahfidz.operational_date}
                        </span>
                      </div>
                      <p className="text-xs font-black text-stone-900 dark:text-stone-100 mt-0.5">
                        Juz {lastTahfidz.tahfidz_juz} • Halaman {lastTahfidz.tahfidz_halaman}
                        {lastTahfidz.tahfidz_halaman_end && lastTahfidz.tahfidz_halaman_end !== lastTahfidz.tahfidz_halaman
                          ? ` - ${lastTahfidz.tahfidz_halaman_end}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyContinuedDefault()}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 text-[11px] font-bold text-[#146B50] dark:text-emerald-300 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs active:scale-95"
                    title="Lanjutkan otomatis dari halaman berikutnya"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#146B50]" />
                    <span>Terapkan Halaman Lanjutan</span>
                  </button>
                </div>
              )}

              {/* 3. Select Juz (1 - 30) */}
              <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-[#146B50]" />
                    <span>2. Juz Al-Qur&apos;an (1 - 30):</span>
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

              {/* 4. Select Halaman Mulai & Halaman Selesai (1 - 20) */}
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#D6A84F]" />
                    <span>3. Halaman Mulai s/d Halaman Selesai (1 - 20):</span>
                  </label>
                  <span className="text-xs font-extrabold text-[#146B50] dark:text-[#D6A84F] bg-white dark:bg-stone-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-mono">
                    {tahfidzHalaman === tahfidzHalamanEnd
                      ? `Halaman ${tahfidzHalaman}`
                      : `Halaman ${tahfidzHalaman} - ${tahfidzHalamanEnd} (${tahfidzHalamanEnd - tahfidzHalaman + 1} Hal)`}
                  </span>
                </div>

                {/* Sub: Halaman Mulai */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block">
                    Dari Halaman Ke:
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setTahfidzHalaman(h);
                          if (tahfidzHalamanEnd < h) setTahfidzHalamanEnd(h);
                        }}
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

                {/* Sub: Sampai Halaman */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
                      Sampai Halaman Ke:
                    </span>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTahfidzHalamanEnd(tahfidzHalaman)}
                        className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-200 font-bold transition cursor-pointer"
                      >
                        1 Hal
                      </button>
                      <button
                        type="button"
                        onClick={() => setTahfidzHalamanEnd(Math.min(20, tahfidzHalaman + 1))}
                        className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-200 font-bold transition cursor-pointer"
                      >
                        +2 Hal
                      </button>
                      <button
                        type="button"
                        onClick={() => setTahfidzHalamanEnd(Math.min(20, tahfidzHalaman + 4))}
                        className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-200 font-bold transition cursor-pointer"
                      >
                        +5 Hal
                      </button>
                      <button
                        type="button"
                        onClick={() => setTahfidzHalamanEnd(20)}
                        className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-200 font-bold transition cursor-pointer"
                      >
                        Akhir (20)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((h) => {
                      const isSelected = tahfidzHalamanEnd === h;
                      const isInRange = h >= tahfidzHalaman && h <= tahfidzHalamanEnd;
                      const isBeforeStart = h < tahfidzHalaman;

                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={isBeforeStart}
                          onClick={() => setTahfidzHalamanEnd(h)}
                          className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#D6A84F] to-amber-700 text-white shadow-md'
                              : isInRange
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-[#146B50] dark:text-emerald-300 border border-emerald-300'
                              : isBeforeStart
                              ? 'opacity-30 bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. Catatan / Ayat (Opsional) */}
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

              {/* Selected Summary Live Badge */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#146B50] shrink-0" />
                  <span>
                    Target:{' '}
                    <strong className="text-emerald-900 dark:text-emerald-100">
                      [{tahfidzMode === 'murojaah' ? 'Murojaah' : 'Ziyadah'}] Juz {tahfidzJuz}
                    </strong>{' '}
                    • Halaman{' '}
                    <strong>
                      {tahfidzHalaman === tahfidzHalamanEnd
                        ? `${tahfidzHalaman}`
                        : `${tahfidzHalaman} s/d ${tahfidzHalamanEnd} (${tahfidzHalamanEnd - tahfidzHalaman + 1} Hal)`}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-white/80 dark:bg-stone-900/80 px-2 py-0.5 rounded-md border border-emerald-300 self-start sm:self-auto">
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
                    {attendanceType === 'izin' && selectedIzinKeys.length > 1 ? (
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {selectedIzinKeys.length} Kegiatan Terpilih
                      </span>
                    ) : (
                      <span className="font-bold text-[#146B50]">{activity.name}</span>
                    )}
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
                        Setoran: [{tahfidzMode === 'murojaah' ? 'Murojaah' : 'Ziyadah'}] Juz {tahfidzJuz} • Halaman{' '}
                        {tahfidzHalaman === tahfidzHalamanEnd
                          ? `${tahfidzHalaman}`
                          : `${tahfidzHalaman} - ${tahfidzHalamanEnd} (${tahfidzHalamanEnd - tahfidzHalaman + 1} Halaman)`}
                      </span>
                      {tahfidzNotes && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
                          &quot;{tahfidzNotes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 text-[#146B50] border border-emerald-300 shrink-0">
                    Menunggu Validasi
                  </span>
                </div>
              )}

              {attendanceType === 'izin' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>
                        Daftar Kegiatan ({selectedIzinKeys.length} Sesi Terpilih):
                      </span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                      Diajukan Bersamaan
                    </span>
                  </div>

                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {selectedIzinKeys.map((key) => {
                      const [actId, dateStr] = key.split('_');
                      const act = activities.find((a) => a.id === actId);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between text-[11px] py-1 border-b border-amber-200/50 dark:border-amber-800/40 last:border-none"
                        >
                          <span className="font-semibold text-stone-900 dark:text-stone-100">
                            {act?.name || actId}
                          </span>
                          <span className="text-stone-500 dark:text-stone-400 font-mono text-[10px]">
                            {dateStr === todayStr ? 'Hari Ini' : 'Besok'} ({act?.start_time} - {act?.end_time} WIB)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/70">
                    <span className="font-bold block text-[11px] mb-0.5">Alasan Izin:</span>
                    <p className="italic text-stone-800 dark:text-stone-200">&quot;{permissionReason}&quot;</p>
                  </div>
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
                <span>
                  {isSubmitting
                    ? 'Memproses Data...'
                    : attendanceType === 'izin' && selectedIzinKeys.length > 1
                    ? `Kirim Izin (${selectedIzinKeys.length} Kegiatan) Sekaligus`
                    : 'Kirim Absensi Sekarang'}
                </span>
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
                  : submissionResult.records && submissionResult.records.length > 1
                  ? `Pengajuan Izin (${submissionResult.records.length} Kegiatan) Berhasil!`
                  : submissionResult.record.status === 'izin_diajukan'
                  ? 'Pengajuan Izin Berhasil Dikirim'
                  : 'Presensi Di Luar Radius'}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                {submissionResult.message}
              </p>
            </div>

            {/* If Multi-Activity Permit, show batch receipt */}
            {submissionResult.records && submissionResult.records.length > 1 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/80 text-left text-xs max-w-sm mx-auto space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-extrabold pb-1 border-b border-amber-200 dark:border-amber-800">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Daftar {submissionResult.records.length} Kegiatan Izin yang Diajukan:</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {submissionResult.records.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-1 border-b border-amber-100 dark:border-amber-800/40 last:border-none text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-stone-800 dark:text-stone-200">{r.activity_name}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {r.operational_date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Receipt Card */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 text-left text-xs max-w-sm mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Status Kehadiran:</span>
                <span className="font-bold text-[#146B50]">
                  {submissionResult.record.status === 'hadir_valid'
                    ? 'Hadir Valid'
                    : submissionResult.record.status === 'izin_diajukan'
                    ? 'Izin Diajukan'
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
              <button
                type="button"
                disabled={isRetaking}
                onClick={() => handleRetake(submissionResult.record.id)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 text-amber-600 dark:text-amber-400 ${isRetaking ? 'animate-spin' : ''}`} />
                <span>{isRetaking ? 'Memproses...' : 'Retake / Ambil Ulang'}</span>
              </button>
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
