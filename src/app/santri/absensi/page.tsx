'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { determineActiveActivity } from '@/lib/schedule';
import AttendanceWizard from '@/components/attendance/AttendanceWizard';
import { Activity } from '@/types';
import { Camera, Clock, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';

export default function SantriAbsensiPage() {
  const { activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    activeResult.activeActivity || activities[0] || null
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title & Activity Selector Bar */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <Camera className="w-4 h-4 text-[#D6A84F]" />
            <span>Presensi Mandiri Santri</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Formulir Absensi Selfie & Geotag
          </h1>
          <p className="text-xs text-stone-500">
            Pastikan kamera depan dan izin lokasi GPS telah diaktifkan.
          </p>
        </div>

        {/* Activity Picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-bold text-stone-500">Pilih Kegiatan:</span>
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedActivity?.id || ''}
              onChange={(e) => {
                const act = activities.find((a) => a.id === e.target.value);
                if (act) setSelectedActivity(act);
              }}
              className="w-full sm:w-64 text-xs font-bold p-2.5 pr-8 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 appearance-none focus:ring-2 focus:ring-[#146B50] outline-none"
            >
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} ({act.start_time} - {act.end_time})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Notice if the chosen activity is outside regular hours */}
      {selectedActivity && (
        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#146B50]" />
            <span>
              Jadwal Resmi: <strong>{selectedActivity.name}</strong> ({selectedActivity.start_time} - {selectedActivity.end_time} WIB).
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#146B50]">
            Radius: {selectedActivity.radius_m}m
          </span>
        </div>
      )}

      {/* 5-Step Attendance Wizard Component */}
      {selectedActivity && (
        <AttendanceWizard
          activity={selectedActivity}
          onFinished={() => {
            // Callback when finished
          }}
        />
      )}
    </div>
  );
}
