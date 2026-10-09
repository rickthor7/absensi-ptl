'use client';

import React from 'react';
import AttendanceCalendar from '@/components/calendar/AttendanceCalendar';
import { Calendar, Sparkles } from 'lucide-react';

export default function SantriKalenderPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
          <Calendar className="w-4 h-4 text-[#D6A84F]" />
          <span>Kalender Santri</span>
        </div>
        <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
          Kalender & Rekap Kehadiran Santri
        </h1>
        <p className="text-xs text-stone-500">
          Lihat riwayat kehadiran per tanggal, status verifikasi radius, dan alasan pengajuan izin.
        </p>
      </div>

      <AttendanceCalendar />
    </div>
  );
}
