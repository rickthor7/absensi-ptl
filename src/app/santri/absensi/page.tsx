'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { determineActiveActivity } from '@/lib/schedule';
import AttendanceWizard from '@/components/attendance/AttendanceWizard';
import { Activity } from '@/types';
import { Camera, Clock, ChevronDown, Sparkles, MapPin, ShieldCheck } from 'lucide-react';

export default function SantriAbsensiPage() {
  const { activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    activeResult.activeActivity || activities[0] || null
  );

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
            Formulir Selfie & Geotag
          </h1>
          <p className="text-xs text-stone-500 max-w-md">
            Pastikan kamera depan dan izin lokasi GPS telah diaktifkan untuk pencatatan otomatis.
          </p>
        </div>

        {/* Activity Picker */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-bold text-stone-500 shrink-0">Kegiatan:</span>
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedActivity?.id || ''}
              onChange={(e) => {
                const act = activities.find((a) => a.id === e.target.value);
                if (act) setSelectedActivity(act);
              }}
              className="w-full sm:w-64 text-xs font-bold p-3 pr-9 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 appearance-none focus:ring-2 focus:ring-[#146B50] outline-none shadow-xs cursor-pointer"
            >
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} ({act.start_time} - {act.end_time})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Info schedule badge */}
      {selectedActivity && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#146B50] dark:text-[#D6A84F] shrink-0" />
            <span>
              Jadwal: <strong>{selectedActivity.name}</strong> ({selectedActivity.start_time} - {selectedActivity.end_time} WIB)
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
