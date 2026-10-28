'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import {
  CheckCircle2,
  Calendar,
  History,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Camera,
  Check,
  FileQuestion,
  CreditCard,
  RotateCcw,
  BookOpen,
  TrendingUp,
  Award,
  Bell,
  ChevronRight,
  Star,
  Flame,
} from 'lucide-react';
import { STATUS_META } from '@/lib/constants';

/* ─── Helper ─── */
function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Selamat Malam';
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

/* ─── Subcomponent: Animated Ring Progress ─── */
function RingProgress({
  value,
  size = 72,
  strokeWidth = 6,
  color = '#0D7B5F',
  trackColor = '#E2D7C7',
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  );
}

export default function SantriHomePage() {
  const router = useRouter();
  const {
    currentUser,
    activities,
    attendanceRecords,
    effectiveTime,
    sppPayments,
    sppSettings,
    deleteSantriAttendance,
  } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;
  const isWindowOpen = activeResult.status === 'open' && !!activeActivity;

  const studentRecords = attendanceRecords.filter((r) => r.student_id === currentUser.id);
  const todayStr = effectiveTime.toISOString().split('T')[0];
  const todayAttendance = activeActivity
    ? studentRecords.find((r) => r.activity_id === activeActivity.id && r.operational_date === todayStr)
    : null;

  /* ── Monthly Stats ── */
  const currentMonthPrefix = `${effectiveTime.getFullYear()}-${String(effectiveTime.getMonth() + 1).padStart(2, '0')}`;
  const monthRecords = studentRecords.filter((r) => r.operational_date.startsWith(currentMonthPrefix));
  const hadirCount = monthRecords.filter((r) => r.status === 'hadir_valid').length;
  const izinCount = monthRecords.filter((r) => r.status === 'izin_diajukan' || r.status === 'izin_disetujui').length;
  const alpaCount = monthRecords.filter((r) => r.status === 'alpa').length;
  const reviewCount = monthRecords.filter((r) => r.status === 'perlu_tinjauan').length;
  const totalThisMonth = hadirCount + izinCount + alpaCount + reviewCount;
  const attendanceRate = totalThisMonth > 0 ? Math.round((hadirCount / totalThisMonth) * 100) : 0;

  /* ── Streak: consecutive hadir days ── */
  const streak = useMemo(() => {
    const sorted = [...studentRecords]
      .filter((r) => r.status === 'hadir_valid')
      .sort((a, b) => (b.operational_date > a.operational_date ? 1 : -1));
    if (!sorted.length) return 0;
    let count = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = new Date(sorted[i].operational_date);
      const next = new Date(sorted[i + 1].operational_date);
      const diff = (curr.getTime() - next.getTime()) / 86400000;
      if (diff <= 2) count++;
      else break;
    }
    return count;
  }, [studentRecords]);

  /* ── SPP ── */
  const currentMonth = effectiveTime.getMonth() + 1;
  const currentYear = effectiveTime.getFullYear();
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const sppPayment = (sppPayments || []).find(
    (p) => p.student_id === currentUser.id && p.month === currentMonth && p.year === currentYear
  );

  const firstName = currentUser.nickname || currentUser.full_name.split(' ')[0];
  const greeting = getGreeting(effectiveTime);

  const tierLabel =
    attendanceRate >= 85 ? { label: 'Mumtaz', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: '⭐' } :
    attendanceRate >= 70 ? { label: 'Jayyid', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: '✅' } :
    { label: 'Peringatan', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', icon: '⚠️' };

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)]">
      <div className="max-w-lg mx-auto px-4 pb-8 pt-5 space-y-4 relative z-10">

        {/* ══ HERO CARD ══ */}
        <div className="relative overflow-hidden rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#096B52] text-white shadow-2xl shadow-emerald-950/30">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#D4A24C]/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-x-1/4 translate-y-1/4 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />

          <div className="relative z-10 p-5 sm:p-6">
            {/* Top row: Hijri date + Time */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#D4A24C]/90 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#D4A24C]/20">
                <Sparkles className="w-3 h-3" />
                <span>{getEstimatedHijriDate(effectiveTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Clock className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span className="text-sm font-bold font-mono tabular-nums">
                  {effectiveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[9px] text-white/40">WIB</span>
              </div>
            </div>

            {/* Greeting */}
            <div className="space-y-0.5 mb-5">
              <p className="text-xs text-emerald-300/80 font-medium">{greeting},</p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{firstName} 👋</h1>
              <p className="text-[11px] text-white/50 font-medium truncate">{currentUser.full_name}</p>
            </div>

            {/* Chips row */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-white/90">
                {currentUser.student_number || 'Santri'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#D4A24C]/25 border border-[#D4A24C]/30 text-[10px] font-semibold text-[#F5D78E]">
                Angkatan {currentUser.generation || '2026'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tierLabel.bg} ${tierLabel.color} border-current/20`}>
                {tierLabel.icon} {tierLabel.label}
              </span>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Hadir', value: hadirCount, sub: 'Bulan ini', accent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20' },
                { label: 'Izin', value: izinCount, sub: 'Disetujui', accent: 'from-amber-500/20 to-amber-500/5 border-amber-400/20' },
                { label: 'Streak', value: streak, sub: 'Hari hadir', accent: 'from-[#D4A24C]/20 to-[#D4A24C]/5 border-[#D4A24C]/20' },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-b ${s.accent} border rounded-xl px-2 py-2.5 text-center`}>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-[9px] font-bold text-white/80 uppercase tracking-wide">{s.label}</div>
                  <div className="text-[8px] text-white/40">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ACTIVE ACTIVITY CARD ══ */}
        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
          isWindowOpen
            ? 'bg-white dark:bg-[#0F1E18] border-emerald-400/40 shadow-lg shadow-emerald-900/10 shimmer-border'
            : 'bg-white dark:bg-[#0F1E18] border-stone-200 dark:border-[#1C3A2E] shadow-sm'
        }`}>
          <div className={`h-1 ${isWindowOpen ? 'bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]' : 'bg-stone-200 dark:bg-[#1C3A2E]'}`} />

          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isWindowOpen ? 'bg-emerald-500/10' : 'bg-stone-100 dark:bg-[#162B22]'
                }`}>
                  <Clock className={`w-5 h-5 ${isWindowOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Kegiatan</span>
                    {isWindowOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-stone-100 dark:bg-[#162B22] text-stone-400">TUTUP</span>
                    )}
                  </div>
                  <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
                    {activeActivity ? activeActivity.name : 'Tidak Ada Kegiatan'}
                  </h2>
                </div>
              </div>
              {activeActivity && (
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-stone-700 dark:text-stone-300">
                    {activeActivity.start_time}–{activeActivity.end_time}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">r {activeActivity.radius_m}m</div>
                </div>
              )}
            </div>

            {/* CTA */}
            {todayAttendance ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">Absensi Tercatat ✓</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {todayAttendance.status.replace(/_/g, ' ')} • {new Date(todayAttendance.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Hapus absensi "${activeActivity?.name}" untuk retake?`)) {
                          const res = await deleteSantriAttendance(todayAttendance.id);
                          if (res.success) router.push('/santri/absensi');
                          else alert(res.message);
                        }
                      }}
                      className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition btn-press shadow-sm cursor-pointer"
                      title="Retake Absen"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href="/santri/riwayat"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition btn-press flex items-center gap-1"
                    >
                      Detail <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : isWindowOpen ? (
              <Link
                href="/santri/absensi"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-[#082F23] via-[#0D7B5F] to-[#096B52] hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all border border-[#D4A24C]/20 cursor-pointer group"
              >
                <Camera className="w-5 h-5 text-[#D4A24C]" />
                <span>Mulai Absensi Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Bell className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>
                      {activeResult.nextActivity
                        ? `Berikutnya: ${activeResult.nextActivity.name} (${activeResult.nextActivity.start_time})`
                        : 'Semua sesi hari ini selesai.'}
                    </span>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    Di luar jam
                  </span>
                </div>
                <Link
                  href="/santri/absensi"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0D7B5F] to-[#082F23] hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-emerald-900/15 active:scale-[0.98] transition-all border border-[#D4A24C]/30 cursor-pointer group"
                >
                  <Camera className="w-4 h-4 text-[#D4A24C]" />
                  <span>Formulir Presensi & Izin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ══ QUICK MENU GRID ══ */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { href: '/santri/absensi', icon: Camera, label: 'Absen', sub: 'Selfie', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', hoverBorder: 'hover:border-emerald-400/50' },
            { href: '/santri/kalender', icon: Calendar, label: 'Kalender', sub: 'Bulanan', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/15', hoverBorder: 'hover:border-amber-400/50' },
            { href: '/santri/riwayat', icon: History, label: 'Riwayat', sub: 'Log', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 dark:bg-sky-500/15', hoverBorder: 'hover:border-sky-400/50' },
            { href: '/santri/spp', icon: CreditCard, label: 'SPP', sub: 'Bayar', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/15', hoverBorder: 'hover:border-purple-400/50' },
          ].map(({ href, icon: Icon, label, sub, color, bg, hoverBorder }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-1 rounded-2xl bg-white dark:bg-[#0F1E18] border border-stone-200 dark:border-[#1C3A2E] shadow-sm ${hoverBorder} card-hover transition-all cursor-pointer group`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color} stroke-[2.2]`} />
              </div>
              <span className="text-[10px] font-extrabold text-stone-800 dark:text-stone-200 text-center leading-tight">{label}</span>
              <span className="text-[9px] text-stone-400 dark:text-stone-500">{sub}</span>
            </Link>
          ))}
        </div>

        {/* ══ PROGRESS & SCORE ROW ══ */}
        <div className="grid grid-cols-2 gap-3">
          {/* Attendance Rate */}
          <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm p-4 flex items-center gap-3 card-hover">
            <div className="relative shrink-0">
              <RingProgress
                value={attendanceRate}
                size={64}
                strokeWidth={5.5}
                color="#0D7B5F"
                trackColor="rgba(212,162,76,0.15)"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black text-stone-900 dark:text-stone-100">{attendanceRate}%</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Kehadiran</div>
              <div className="text-sm font-extrabold text-stone-900 dark:text-stone-100 leading-tight">Bulan Ini</div>
              <div className={`text-[10px] font-bold mt-0.5 ${tierLabel.color}`}>{tierLabel.icon} {tierLabel.label}</div>
            </div>
          </div>

          {/* SPP Status */}
          <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm p-4 card-hover">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                sppPayment?.status === 'verified' ? 'bg-emerald-500/10' :
                sppPayment?.status === 'pending' ? 'bg-amber-500/10' : 'bg-[#D4A24C]/15'
              }`}>
                <CreditCard className={`w-4.5 h-4.5 ${
                  sppPayment?.status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' :
                  sppPayment?.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-[#D4A24C]'
                }`} />
              </div>
              {sppPayment?.status === 'verified' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">SPP {monthNames[currentMonth - 1]}</div>
            <div className={`text-xs font-extrabold mt-0.5 ${
              sppPayment?.status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' :
              sppPayment?.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {sppPayment?.status === 'verified' ? '✓ Lunas' :
               sppPayment?.status === 'pending' ? '⏳ Verifikasi' : '⚠ Belum Bayar'}
            </div>
            <Link href="/santri/spp" className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#0D7B5F] dark:text-emerald-400 hover:underline">
              {sppPayment?.status === 'verified' ? 'Lihat bukti' : 'Upload bukti'} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ══ STATS ROW ══ */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Hadir', value: hadirCount, icon: CheckCircle2, cls: 'stat-accent-emerald', iconCls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
            { label: 'Izin', value: izinCount, icon: FileQuestion, cls: 'stat-accent-gold', iconCls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
            { label: 'Alpa', value: alpaCount, icon: AlertTriangle, cls: 'stat-accent-rose', iconCls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' },
            { label: 'Review', value: reviewCount, icon: Star, cls: '', iconCls: 'text-orange-600 dark:text-orange-400 bg-orange-500/10' },
          ].map(({ label, value, icon: Icon, cls, iconCls }) => (
            <div key={label} className={`bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm p-3 ${cls} card-hover`}>
              <div className={`w-7 h-7 rounded-lg ${iconCls} flex items-center justify-center mb-2`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-stone-900 dark:text-stone-100">{value}</div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ══ RECENT HISTORY ══ */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-[#1C3A2E]">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0D7B5F]" />
              Riwayat Terkini
            </h3>
            <Link href="/santri/riwayat" className="text-[10px] text-[#0D7B5F] dark:text-[#D4A24C] font-bold hover:underline flex items-center gap-0.5">
              Semua <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-[#1C3A2E]">
            {studentRecords.length === 0 ? (
              <div className="py-10 text-center">
                <BookOpen className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-xs text-stone-400">Belum ada riwayat absensi.</p>
              </div>
            ) : (
              studentRecords.slice(0, 4).map((rec) => {
                const meta = STATUS_META[rec.status];
                return (
                  <div key={rec.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-[#162B22]/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-stone-800 dark:text-stone-200 truncate">{rec.activity_name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {rec.operational_date} · {new Date(rec.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass} whitespace-nowrap`}>
                      {meta.label.split('—')[0].trim()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══ CALENDAR SHORTCUT ══ */}
        <Link
          href="/santri/kalender"
          className="block bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E] shadow-sm overflow-hidden card-hover group cursor-pointer"
        >
          <div className="h-1 bg-gradient-to-r from-[#D4A24C] via-amber-400 to-[#0D7B5F]" />
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-stone-900 dark:text-stone-100">Kalender Absensi</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">Rekap harian & bulanan interaktif</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[['bg-emerald-500','H'], ['bg-amber-400','I'], ['bg-rose-400','A']].map(([bg, t]) => (
                  <span key={t} className={`w-5 h-5 rounded-md ${bg} flex items-center justify-center text-[8px] font-black text-white`}>{t}</span>
                ))}
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* ══ MOTIVATIONAL FOOTER ══ */}
        <div className="rounded-2xl bg-gradient-to-r from-[#082F23]/80 to-[#0D7B5F]/40 dark:from-[#030805]/80 dark:to-[#082F23]/60 border border-[#0D7B5F]/20 px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4A24C]/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-[#D4A24C]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/90">
              {streak > 0
                ? `Streak ${streak} hari! 🔥 Pertahankan semangatmu, ${firstName}!`
                : `Ayo mulai absensi dan raih streak hadir, ${firstName}!`}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">Pondok Pesantren Nurul Falah · Ketintang, Surabaya</p>
          </div>
        </div>

      </div>
    </div>
  );
}
