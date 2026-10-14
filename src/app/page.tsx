'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { determineActiveActivity, formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';
import {
  Compass,
  Camera,
  Shield,
  Calendar,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  BarChart3,
  Zap,
  Fingerprint,
  Locate,
} from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

export default function HomePage() {
  const { currentUser, isAuthenticated, activities, effectiveTime } = useStore();

  const activeResult = determineActiveActivity(activities, effectiveTime);
  const activeActivity = activeResult.activeActivity;

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 relative z-10">

        {/* ── Hero Section ── */}
        <div className="relative overflow-hidden rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-2xl shadow-emerald-950/30">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4A24C]/8 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#0D7B5F]/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4 pointer-events-none" />
          
          {/* Islamic dot pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, #D4A24C 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
              {/* Left Content */}
              <div className="space-y-5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 text-[11px] font-semibold text-[#D4A24C] border border-[#D4A24C]/20 backdrop-blur-sm">
                  <Zap className="w-3 h-3" />
                  <span>Presensi GPS & Selfie Terpadu</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
                  Pondok Pesantren<br />
                  <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #D4A24C, #F0D78C, #D4A24C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Nurul Falah
                  </span>
                  <span className="block text-xl sm:text-2xl font-bold text-emerald-200/60 mt-1">
                    Ketintang, Surabaya
                  </span>
                </h1>

                <p className="text-sm text-emerald-100/70 leading-relaxed max-w-lg">
                  Sistem kehadiran santri terintegrasi — validasi melalui swafoto kamera dan koordinat GPS real-time secara presisi.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href={isAuthenticated ? "/santri/absensi" : "/login"}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-sm font-bold shadow-lg shadow-amber-900/25 hover:shadow-xl transition-all btn-press"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isAuthenticated ? "Mulai Absen" : "Masuk"}</span>
                  </Link>

                  <Link
                    href={
                      isAuthenticated
                        ? currentUser.role === 'musyrif'
                          ? '/musyrif'
                          : '/santri'
                        : '/login'
                    }
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/8 hover:bg-white/14 text-white text-sm font-semibold border border-white/15 transition-all backdrop-blur-sm btn-press"
                  >
                    <span>
                      {isAuthenticated
                        ? `Dashboard ${currentUser.role === 'musyrif' ? 'Musyrif' : 'Santri'}`
                        : 'Portal Akun'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: Live Activity Card */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 w-full lg:w-80 shrink-0 bg-black/20 border border-white/10 float-anim">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A24C] mb-3">
                  <div className="relative">
                    <Clock className="w-4 h-4" />
                    {activeActivity && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full dot-pulse" />}
                  </div>
                  <span>Status Kegiatan</span>
                </div>
                {activeActivity ? (
                  <div className="space-y-2">
                    <p className="font-extrabold text-base text-white">{activeActivity.name}</p>
                    <p className="text-xs text-stone-300 font-mono">
                      {activeActivity.start_time} – {activeActivity.end_time} WIB
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
                        Dibuka
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Radius {activeActivity.radius_m}m
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-stone-400">Absensi sedang ditutup</p>
                    {activeResult.nextActivity && (
                      <p className="text-[11px] text-[#D4A24C]/80 mt-2 font-medium">
                        Berikutnya: {activeResult.nextActivity.name} ({activeResult.nextActivity.start_time})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature Highlights ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: Fingerprint, label: 'Selfie Validasi', desc: 'Bukti foto wajah', color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { icon: Locate, label: 'GPS Presisi', desc: 'Radius geolokasi', color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-600 dark:text-blue-400' },
            { icon: Shield, label: 'Audit Trail', desc: 'Rekam jejak lengkap', color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-600 dark:text-amber-400' },
          ].map((f, i) => (
            <div key={i} className={`bg-gradient-to-br ${f.color} rounded-2xl p-4 border border-stone-200/60 dark:border-[#1C3A2E] card-hover text-center sm:text-left`}>
              <f.icon className={`w-6 h-6 ${f.iconColor} mx-auto sm:mx-0 mb-2`} />
              <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{f.label}</p>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 hidden sm:block">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Two Role Portal Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Santri Card */}
          <div className="group bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm card-hover flex flex-col justify-between overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#0D7B5F]" />
            
            <div className="p-5 sm:p-6 space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-900/30 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#0D7B5F]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Portal Santri</h2>
                  <p className="text-[10px] text-stone-500">Alur mandiri absensi kegiatan harian</p>
                </div>
              </div>

              <div className="space-y-2">
                {['Absensi selfie & GPS', 'Pengajuan izin syar\'i', 'Kalender presensi harian'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <Link
                href="/santri"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0D7B5F] hover:bg-[#096B52] text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/15 btn-press group-hover:shadow-lg w-full"
              >
                <span>Buka Dashboard Santri</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Musyrif Card */}
          <div className="group bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm card-hover flex flex-col justify-between overflow-hidden">
            {/* Top accent bar — gold gradient */}
            <div className="h-1 bg-gradient-to-r from-[#D4A24C] via-[#E8C36E] to-[#D4A24C]" />
            
            <div className="p-5 sm:p-6 space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/60 dark:to-amber-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#D4A24C]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Portal Musyrif</h2>
                  <p className="text-[10px] text-stone-500">Panel pengawasan & pengelolaan</p>
                </div>
              </div>

              <div className="space-y-2">
                {['Monitoring kehadiran real-time', 'Persetujuan izin santri', 'Konfigurasi kegiatan & radius', 'Ekspor rekap CSV & audit'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <Link
                href="/musyrif"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#082F23] hover:bg-[#051A13] text-white text-xs font-bold transition-all shadow-md border border-[#D4A24C]/20 btn-press group-hover:shadow-lg w-full"
              >
                <span>Buka Dashboard Musyrif</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
