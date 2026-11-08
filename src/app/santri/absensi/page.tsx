'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { determineActiveActivity, getActivitiesForDate } from '@/lib/schedule';
import AttendanceWizard from '@/components/attendance/AttendanceWizard';
import ActivitySelectDropdown, { formatTimeRange } from '@/components/schedule/ActivitySelectDropdown';
import { Activity } from '@/types';
import { Camera, Clock, Sparkles, MapPin, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';

export default function SantriAbsensiPage() {
  const { activities, effectiveTime } = useStore();

  // Filter activities scheduled specifically for today (based on day of week)
  const todayActivities = useMemo(() => {
    return getActivitiesForDate(activities, effectiveTime);
  }, [activities, effectiveTime]);

  const activeResult = determineActiveActivity(todayActivities, effectiveTime);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    activeResult.activeActivity || todayActivities[0] || null
  );

  // Sync selectedActivity if todayActivities change or current selection is invalid
  useEffect(() => {
    if (todayActivities.length > 0) {
      const isValid = todayActivities.some((a) => a.id === selectedActivity?.id);
      if (!isValid) {
        setSelectedActivity(activeResult.activeActivity || todayActivities[0]);
      }
    } else {
      setSelectedActivity(null);
    }
  }, [todayActivities, activeResult.activeActivity, selectedActivity]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 via-amber-500/5 to-transparent rounded-full pointer-events-none blur-xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#146B50] dark:text-[#D6A84F]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presensi Mandiri Santri</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Formulir Selfie &amp; Geotag
          </h1>
          <p className="text-xs text-stone-500 max-w-md">
            Pastikan kamera depan dan izin lokasi GPS telah diaktifkan untuk pencatatan otomatis.
          </p>
        </div>

        {/* Custom Activity Dropdown */}
        <div className="relative z-10 w-full md:w-auto">
          <ActivitySelectDropdown
            activities={todayActivities}
            selectedActivityId={selectedActivity?.id || ''}
            onSelect={(act) => setSelectedActivity(act)}
            activeActivityId={activeResult.activeActivity?.id}
            className="w-full sm:w-72"
          />
        </div>
      </div>

      {/* Quick Session Tabs Strip (Today's activities only) */}
      {todayActivities.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {todayActivities.map((act) => {
            const isSelected = act.id === selectedActivity?.id;
            const isLive = act.id === activeResult.activeActivity?.id;
            return (
              <button
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white shadow-md ring-2 ring-[#D6A84F]/40'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                }`}
              >
                {isLive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                ) : isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D6A84F] shrink-0" />
                ) : null}
                <span>{act.name}</span>
                <span
                  className={`text-[10px] font-mono ${
                    isSelected ? 'text-emerald-200' : 'text-stone-400'
                  }`}
                >
                  {formatTimeRange(act.start_time, act.end_time).replace(' WIB', '')}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Tidak ada kegiatan pondok yang terjadwal untuk hari ini.</span>
        </div>
      )}

      {/* Info schedule badge */}
      {selectedActivity && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#146B50] dark:text-[#D6A84F] shrink-0" />
            <span>
              Jadwal: <strong>{selectedActivity.name}</strong> ({formatTimeRange(selectedActivity.start_time, selectedActivity.end_time)})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#146B50] dark:text-[#D6A84F] bg-white/60 dark:bg-stone-900/60 px-2.5 py-1 rounded-full border border-emerald-300/40">
            <MapPin className="w-3.5 h-3.5" />
            <span>Radius: {selectedActivity.radius_m}m</span>
          </div>
        </div>
      )}

      {/* Attendance Wizard */}
      {selectedActivity && (
        <AttendanceWizard
          activity={selectedActivity}
          onFinished={() => {}}
        />
      )}
    </div>
  );
}
