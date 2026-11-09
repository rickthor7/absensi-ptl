'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { determineActiveActivity, getActivitiesForDate } from '@/lib/schedule';
import AttendanceWizard from '@/components/attendance/AttendanceWizard';
import { formatTimeRange } from '@/components/schedule/ActivitySelectDropdown';
import { Activity } from '@/types';
import { Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4">
      {/* Sleek, Compact Page Header */}
      <div className="space-y-2">
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
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            {todayActivities.length} Jadwal Hari Ini
          </span>
        </div>

        {/* Clean, single-tap horizontal activity pill strip */}
        {todayActivities.length > 0 ? (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            {todayActivities.map((act) => {
              const isSelected = act.id === selectedActivity?.id;
              const isLive = act.id === activeResult.activeActivity?.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setSelectedActivity(act)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#146B50] text-white shadow-sm ring-2 ring-[#146B50]/30'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
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
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tidak ada kegiatan pondok yang terjadwal untuk hari ini.</span>
          </div>
        )}
      </div>

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
