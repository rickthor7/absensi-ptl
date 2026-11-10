'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  determineActiveActivity,
  getActivitiesForDate,
  getActiveAttendanceSessions,
  formatCountdownTimer,
  getSessionRemainingSeconds,
  formatIndonesianDate,
  formatTime24,
  getSafeDate,
} from '@/lib/schedule';
import AttendanceWizard from '@/components/attendance/AttendanceWizard';
import { formatTimeRange } from '@/components/schedule/ActivitySelectDropdown';
import { Activity, AttendanceType } from '@/types';
import { Sparkles, Calendar, CheckCircle2, Clock, ShieldAlert, ArrowLeft, FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function SantriAbsensiPage() {
  const { activities, attendanceSessions, effectiveTime } = useStore();
  const [initialType, setInitialType] = useState<AttendanceType>('hadir');

  // Read URL query param ?type=hadir|izin safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('type');
      if (t === 'hadir' || t === 'izin') {
        setInitialType(t as AttendanceType);
      }
    }
  }, []);

  // Filter activities scheduled specifically for today (based on day of week)
  const todayActivities = useMemo(() => {
    return getActivitiesForDate(activities, effectiveTime);
  }, [activities, effectiveTime]);

  // Evaluasi sesi yang sedang aktif / dibuka oleh Musyrif
  const activeSessions = useMemo(() => {
    return getActiveAttendanceSessions(attendanceSessions, effectiveTime);
  }, [attendanceSessions, effectiveTime]);

  // Kegiatan yang memiliki sesi 'open' oleh Musyrif saat ini (mendukung multi-sesi)
  const openActivities = useMemo(() => {
    return activeSessions
      .map((sess) => {
        const act = activities.find((a) => a.id === sess.activity_id);
        return act ? { activity: act, session: sess } : null;
      })
      .filter((item): item is { activity: Activity; session: import('@/types').AttendanceSession } => item !== null);
  }, [activeSessions, activities]);

  // Evaluasi jadwal fallback
  const activeResult = useMemo(() => {
    return determineActiveActivity(todayActivities, effectiveTime, attendanceSessions);
  }, [todayActivities, effectiveTime, attendanceSessions]);

  // Selected Activity: jika ada sesi open, default ke sesi open pertama.
  // Jika dalam mode izin dan tidak ada sesi open, fallback ke todayActivities[0].
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(() => {
    if (openActivities.length > 0) return openActivities[0].activity;
    if (initialType === 'izin' && todayActivities.length > 0) return todayActivities[0];
    return null;
  });

  // Sinkronisasi selectedActivity saat openActivities berubah
  useEffect(() => {
    if (openActivities.length > 0) {
      const isStillOpen = openActivities.some((oa) => oa.activity.id === selectedActivity?.id);
      if (!isStillOpen) {
        setSelectedActivity(openActivities[0].activity);
      }
    } else if (initialType === 'izin') {
      if (!selectedActivity && todayActivities.length > 0) {
        setSelectedActivity(todayActivities[0]);
      }
    } else {
      setSelectedActivity(null);
    }
  }, [openActivities, initialType, todayActivities, selectedActivity]);

  const hasOpenSessions = openActivities.length > 0;

  const safeTime = getSafeDate(effectiveTime);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4">
      {/* Page Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#146B50] dark:text-[#D6A84F]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presensi Mandiri Santri</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Formulir Absensi &amp; Setoran
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {hasOpenSessions ? (
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{openActivities.length} Sesi Dibuka</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                Sesi Ditutup / Libur
              </span>
            )}
          </div>
        </div>

        {/* Banner Informasi Hari, Tanggal & Jam Presensi */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#146B50] text-[#D6A84F] flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block -mb-0.5 font-medium">Hari &amp; Tanggal Operasional:</span>
              <span className="font-extrabold text-[#146B50] dark:text-emerald-300">
                {formatIndonesianDate(safeTime)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-900 px-2.5 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
            <Clock className="w-3.5 h-3.5 text-[#146B50] dark:text-[#D6A84F]" />
            <span>{formatTime24(safeTime)} WIB</span>
          </div>
        </div>

        {/* Multi-Sesi Aktif: Horizontal Pills Sesi yang SEDANG DIBUKA oleh Musyrif */}
        {hasOpenSessions ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-medium px-1">
              <span>Sesi Dibuka Musyrif (Pilih untuk presensi):</span>
              {openActivities.length > 1 && (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  *Multi-Sesi Aktif Bersamaan
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              {openActivities.map(({ activity: act, session }) => {
                const isSelected = act.id === selectedActivity?.id;
                const remSeconds = getSessionRemainingSeconds(session, effectiveTime);
                const timerText = formatCountdownTimer(remSeconds);

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setSelectedActivity(act)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#146B50] text-white shadow-md ring-2 ring-[#146B50]/30'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span>{act.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isSelected
                          ? 'bg-black/20 text-emerald-200 font-bold'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{timerText}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : initialType === 'izin' && todayActivities.length > 0 ? (
          /* Mode Pengajuan Izin saat tidak ada sesi open */
          <div className="space-y-1.5">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium px-1">
              Pilih Kegiatan untuk Pengajuan Izin:
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              {todayActivities.map((act) => {
                const isSelected = act.id === selectedActivity?.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setSelectedActivity(act)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-amber-300 hover:bg-stone-50'
                    }`}
                  >
                    <span>{act.name}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                      {formatTimeRange(act.start_time, act.end_time).replace(' WIB', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* STATE 1: Tidak Ada Sesi Aktif Dibuka oleh Musyrif */}
      {!hasOpenSessions && initialType !== 'izin' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <Clock className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
              Belum Ada Sesi Presensi yang Dibuka
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Presensi mandiri santri hanya dapat diisi saat Musyrif membuka sesi kegiatan di masjid/pondok.
              Jika Musyrif tidak membuka sesi, kegiatan tersebut dianggap <strong>libur</strong> dan tidak terhitung sebagai alpa.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/santri"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setInitialType('izin');
                if (todayActivities.length > 0) setSelectedActivity(todayActivities[0]);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileQuestion className="w-4 h-4 text-amber-200" />
              <span>Ajukan Surat Izin Kegiatan</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: Attendance Wizard dengan key={selectedActivity.id} agar bebas bug caching state */}
      {selectedActivity && (hasOpenSessions || initialType === 'izin') && (
        <AttendanceWizard
          key={selectedActivity.id}
          activity={selectedActivity}
          initialType={initialType}
          onFinished={() => {}}
        />
      )}
    </div>
  );
}
