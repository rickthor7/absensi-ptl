'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  Zap,
  CheckCircle2,
  Building2,
  ArrowLeft,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden py-12 px-4 sm:px-6">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F1EB] via-[#E8F0EC] to-[#F4F1EB] dark:from-[#050C09] dark:via-[#081A13] dark:to-[#050C09]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0D7B5F 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-[#0D7B5F]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#D4A24C]/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#082F23] p-[2px] mx-auto shadow-xl shadow-emerald-900/20 transform group-hover:scale-105 transition-transform">
              <img
                src="/logo.jpg"
                alt="Logo PP Nurul Falah"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
          </Link>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D7B5F]/10 dark:bg-[#0D7B5F]/20 text-[#0D7B5F] dark:text-[#D4A24C] text-xs font-bold border border-[#0D7B5F]/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span>Portal Masuk Sistem Presensi &amp; Keuangan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              Pondok Pesantren Nurul Falah
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              Silakan pilih portal masuk sesuai dengan peran Anda di pondok pesantren
            </p>
          </div>
        </div>

        {/* 2-Column Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          
          {/* Card 1: Portal Santri */}
          <div className="group bg-white/90 dark:bg-[#0F1E18]/95 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-[#1C3A2E] shadow-xl shadow-emerald-950/5 dark:shadow-black/30 hover:border-emerald-400/50 card-hover overflow-hidden flex flex-col justify-between transition-all">
            <div>
              <div className="h-1.5 bg-gradient-to-r from-[#0D7B5F] via-[#1AA37A] to-[#D4A24C]" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-7 h-7 text-[#0D7B5F] dark:text-emerald-400 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Mandiri
                  </span>
                </div>

                <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-1.5">
                  Portal Santri
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
                  Login praktis cukup menggunakan <strong className="text-emerald-700 dark:text-emerald-400">nama panggilan (nickname)</strong> santri dan kata sandi.
                </p>

                <div className="space-y-2 mb-6 bg-stone-50/80 dark:bg-[#14261F] p-3.5 rounded-2xl border border-stone-100 dark:border-[#1C3A2E] text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Presensi selfie kamera + koordinat GPS</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Pengajuan izin multi-kegiatan berlampiran</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Riwayat kehadiran &amp; administrasi SPP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                href="/login/santri"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0D7B5F] to-[#0A6951] hover:brightness-110 text-white text-sm font-bold shadow-md shadow-emerald-900/20 transition-all btn-press group"
              >
                <span>Masuk Portal Santri</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Portal Musyrif */}
          <div className="group bg-white/90 dark:bg-[#0F1E18]/95 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-[#1C3A2E] shadow-xl shadow-emerald-950/5 dark:shadow-black/30 hover:border-amber-400/50 card-hover overflow-hidden flex flex-col justify-between transition-all">
            <div>
              <div className="h-1.5 bg-gradient-to-r from-[#D4A24C] via-[#E8C36E] to-[#0D7B5F]" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-13 h-13 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Shield className="w-7 h-7 text-[#D4A24C] stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Pengawasan
                  </span>
                </div>

                <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-1.5">
                  Portal Musyrif
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
                  Login praktis menggunakan <strong className="text-amber-700 dark:text-amber-400">nama panggilan</strong> atau email dinas musyrif dan kata sandi.
                </p>

                <div className="space-y-2 mb-6 bg-stone-50/80 dark:bg-[#14261F] p-3.5 rounded-2xl border border-stone-100 dark:border-[#1C3A2E] text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Monitoring absensi sesi sholat &amp; taklim</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Persetujuan izin &amp; tinjauan foto presensi</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Verifikasi kas SPP &amp; ekspor laporan</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                href="/login/musyrif"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#082F23] to-[#0D4433] hover:brightness-110 text-[#D4A24C] text-sm font-bold shadow-md border border-[#D4A24C]/30 transition-all btn-press group"
              >
                <span>Masuk Portal Musyrif</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

        {/* Back Link & Info Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-semibold text-stone-600 hover:text-[#0D7B5F] dark:text-stone-300 dark:hover:text-[#D4A24C] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Beranda</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Building2 className="w-3.5 h-3.5 text-[#0D7B5F]" />
            <span>Pondok Pesantren Nurul Falah Ketintang, Surabaya</span>
          </div>
        </div>
      </div>
    </div>
  );
}
