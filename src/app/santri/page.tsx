'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import {
  Compass,
  CheckCircle2,
  Calendar,
  History,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Camera,
  Check,
  FileQuestion,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { STATUS_META } from '@/lib/constants';

export default function SantriHomePage() {
  const { currentUser, activities, attendanceRecords, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;
  const isWindowOpen = activeResult.status === 'open' && !!activeActivity;

  // Filter records for current student
  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);

  // Check if current student has already attended today's active activity
  const todayStr = effectiveTime.toISOString().split('T')[0];
  const todayAttendance = activeActivity
    ? studentRecords.find(
        (r) => r.activity_id === activeActivity.id && r.operational_date === todayStr
      )
    : null;

  // Monthly stats
  const currentMonthPrefix = `${effectiveTime.getFullYear()}-${String(
    effectiveTime.getMonth() + 1
  ).padStart(2, '0')}`;
  const monthRecords = studentRecords.filter((r) =>
    r.operational_date.startsWith(currentMonthPrefix)
  );

  const hadirCount = monthRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinCount = monthRecords.filter(
    (r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui'
  ).length;
  const reviewCount = monthRecords.filter((r) => r.status === 'perlu_tinjauan').length;
  const totalThisMonth = hadirCount + izinCount + reviewCount;
  const attendanceRate = totalThisMonth > 0 ? Math.round((hadirCount / totalThisMonth) * 100) : 0;

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 relative z-10">

        {/* ── Greeting Banner ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-xl shadow-emerald-950/20">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4A24C]/8 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-[#D4A24C]/80">
                  <Sparkles className="w-3 h-3" />
                  <span>{getEstimatedHijriDate(effectiveTime)}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Assalamu&apos;alaikum, {currentUser.full_name.split(' ')[0]}
                </h1>
                <p className="text-[11px] text-emerald-200/60">
                  {currentUser.student_number} • {currentUser.group_name}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/8">
                <Clock className="w-4 h-4 text-[#D4A24C]" />
                <div>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {effectiveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-emerald-200/50 ml-1">WIB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN ACTION: Current Activity ── */}
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isWindowOpen
            ? 'bg-white dark:bg-[#0F1E18] border-[#0D7B5F]/30 shadow-lg shadow-emerald-900/8 shimmer-border'
            : 'bg-white dark:bg-[#0F1E18] border-stone-200 dark:border-[#1C3A2E] shadow-sm'
        }`}>
          {/* Accent bar */}
          <div className={`h-1 ${
            isWindowOpen
              ? 'bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]'
              : 'bg-stone-200 dark:bg-[#1C3A2E]'
          }`} />
          
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${
                  isWindowOpen
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-stone-100 dark:bg-[#162B22] text-stone-400'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Kegiatan</span>
                    {isWindowOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
                        AKTIF
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 dark:bg-[#162B22] text-stone-500">
                        DITUTUP
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
                    {activeActivity ? activeActivity.name : 'Tidak Ada Kegiatan'}
                  </h2>
                </div>
              </div>

              {activeActivity && (
                <div className="text-left sm:text-right text-xs text-stone-500">
                  <span className="font-mono font-semibold text-stone-700 dark:text-stone-300">
                    {activeActivity.start_time} – {activeActivity.end_time}
                  </span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">
                    Radius {activeActivity.radius_m}m
                  </span>
                </div>
              )}
            </div>

            {/* CTA Area */}
            {todayAttendance ? (
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                      Absensi sudah tercatat ✓
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {todayAttendance.status.replace(/_/g, ' ')} • {new Date(todayAttendance.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </p>
                  </div>
                </div>
                <Link
                  href="/santri/riwayat"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition btn-press text-center"
                >
                  Lihat Detail
                </Link>
              </div>
            ) : isWindowOpen ? (
              <Link
                href="/santri/absensi"
                className="flex items-center justify-center gap-3 w-full py-4 sm:py-5 rounded-xl bg-gradient-to-r from-[#082F23] via-[#0D7B5F] to-[#096B52] hover:from-[#0A3D2D] hover:to-[#0D7B5F] text-white font-bold text-base shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all border border-[#D4A24C]/20 cursor-pointer group"
              >
                <div className="relative">
                  <Camera className="w-5 h-5 text-[#D4A24C]" />
                </div>
                <span>Mulai Absensi Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#162B22]/50 border border-stone-200 dark:border-[#1C3A2E]">
                <p className="text-xs text-stone-500">
                  {activeResult.nextActivity
                    ? `Kegiatan berikutnya: ${activeResult.nextActivity.name} (${activeResult.nextActivity.start_time} WIB)`
                    : 'Semua kegiatan terjadwal hari ini telah selesai.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Monthly Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-xl border border-stone-200 dark:border-[#1C3A2E] stat-accent-emerald card-hover">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                {attendanceRate}%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{hadirCount}</div>
            <span className="text-[10px] text-stone-500 font-medium">Hadir Valid</span>
          </div>

          <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-xl border border-stone-200 dark:border-[#1C3A2E] stat-accent-gold card-hover">
            <div className="flex items-center justify-between mb-2">
              <FileQuestion className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{izinCount}</div>
            <span className="text-[10px] text-stone-500 font-medium">Izin</span>
          </div>

          <div className="bg-white dark:bg-[#0F1E18] p-4 rounded-xl border border-stone-200 dark:border-[#1C3A2E] stat-accent-rose card-hover">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{reviewCount}</div>
            <span className="text-[10px] text-stone-500 font-medium">Tinjauan</span>
          </div>
        </div>

        {/* ── Recent History & Calendar ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recent Attendance */}
          <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-[#1C3A2E]">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <History className="w-4 h-4 text-[#0D7B5F]" />
                Riwayat Terkini
              </h3>
              <Link
                href="/santri/riwayat"
                className="text-[10px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold hover:underline"
              >
                Semua →
              </Link>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-[#1C3A2E]">
              {studentRecords.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">
                  Belum ada riwayat absensi.
                </p>
              ) : (
                studentRecords.slice(0, 4).map((rec) => {
                  const meta = STATUS_META[rec.status];
                  return (
                    <div
                      key={rec.id}
                      className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-[#162B22]/50 transition"
                    >
                      <div>
                        <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                          {rec.activity_name}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {rec.operational_date} • {new Date(rec.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-[#1C3A2E]">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4A24C]" />
                  Kalender Absensi
                </h3>
                <Link
                  href="/santri/kalender"
                  className="text-[10px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold hover:underline"
                >
                  Buka →
                </Link>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Pantau rekap kehadiran harian, izin, dan catatan audit musyrif dalam kalender interaktif bulanan.
                </p>
                
                {/* Mini visual indicator */}
                <div className="mt-4 flex items-center gap-4 text-[10px] text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span>Hadir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span>Izin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                    <span>Alpa</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <Link
                href="/santri/kalender"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-100 dark:bg-[#162B22] hover:bg-[#0D7B5F]/10 dark:hover:bg-[#0D7B5F]/20 text-stone-700 dark:text-stone-300 hover:text-[#0D7B5F] dark:hover:text-[#D4A24C] text-xs font-bold transition border border-stone-200/60 dark:border-[#1C3A2E] btn-press"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Buka Kalender Bulanan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
