'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Compass,
  User,
  Clock,
  RotateCcw,
  Shield,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Calendar,
  CheckCircle2,
  FileText,
  Users,
  Settings,
  BarChart3,
  History,
  Moon,
  Sun,
} from 'lucide-react';
import { formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';

export default function Navbar() {
  const {
    currentUser,
    setCurrentUser,
    profiles,
    effectiveTime,
    simulatedTime,
    setSimulatedTime,
    resetToDefaultData,
    theme,
    toggleTheme,
  } = useStore();

  const pathname = usePathname();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMusyrif = currentUser.role === 'musyrif';

  // Preset times to easily test schedules
  const testTimePresets = [
    { label: 'Waktu Nyata Sekarang', time: null },
    { label: 'Qiyamul Lail (03:30)', hours: 3, minutes: 30 },
    { label: 'Shubuh Berjamaah (04:30)', hours: 4, minutes: 30 },
    { label: 'Setoran Pagi (06:00)', hours: 6, minutes: 0 },
    { label: 'Madin Siang (16:00)', hours: 16, minutes: 0 },
    { label: 'Maghrib & Dzikir (18:00)', hours: 18, minutes: 0 },
    { label: 'Isya Berjamaah (19:30)', hours: 19, minutes: 30 },
    { label: 'Setoran Malam (20:30)', hours: 20, minutes: 30 },
  ];

  const applyPreset = (preset: (typeof testTimePresets)[0]) => {
    if (preset.time === null) {
      setSimulatedTime(null);
    } else {
      const now = new Date();
      now.setHours(preset.hours || 0, preset.minutes || 0, 0, 0);
      setSimulatedTime(now);
    }
    setShowTimeModal(false);
  };

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
  }

  const santriNav: NavItem[] = [
    { href: '/santri', label: 'Beranda', icon: Compass },
    { href: '/santri/absensi', label: 'Mulai Absensi', icon: CheckCircle2, highlight: true },
    { href: '/santri/kalender', label: 'Kalender', icon: Calendar },
    { href: '/santri/riwayat', label: 'Riwayat', icon: History },
    { href: '/santri/profil', label: 'Profil', icon: User },
  ];

  const musyrifNav: NavItem[] = [
    { href: '/musyrif', label: 'Ringkasan', icon: Compass },
    { href: '/musyrif/santri', label: 'Data Santri', icon: Users },
    { href: '/musyrif/absensi', label: 'Absensi', icon: CheckCircle2 },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText },
    { href: '/musyrif/kegiatan', label: 'Kegiatan & Jadwal', icon: Settings },
    { href: '/musyrif/laporan', label: 'Rekap Laporan', icon: BarChart3 },
    { href: '/musyrif/audit', label: 'Audit Log', icon: Shield },
  ];

  const navLinks = isMusyrif ? musyrifNav : santriNav;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B3D2E] text-white shadow-md border-b border-[#146B50]">
        {/* Top Islamic Banner & Hijri Date */}
        <div className="bg-[#07281E] px-4 py-1 text-xs text-[#D6A84F] border-b border-[#146B50]/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A84F]" />
            <span className="font-medium tracking-wide">
              {getEstimatedHijriDate(effectiveTime)} • {formatIndonesianDate(effectiveTime)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Simulator Trigger */}
            <button
              onClick={() => setShowTimeModal(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#146B50]/60 hover:bg-[#146B50] text-emerald-200 hover:text-white transition cursor-pointer"
              title="Atur simulasi jam untuk menguji jendela jadwal kegiatan"
            >
              <Clock className="w-3 h-3 text-[#D6A84F]" />
              <span>
                {simulatedTime
                  ? `Simulasi: ${effectiveTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB`
                  : `${effectiveTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB`}
              </span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#146B50]/60 hover:bg-[#146B50] text-[#D6A84F] hover:text-white transition cursor-pointer text-[11px] font-semibold"
              title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-[#D6A84F]" />
                  <span>Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-emerald-200" />
                  <span>Gelap</span>
                </>
              )}
            </button>

            {/* Reset Demo State Button */}
            <button
              onClick={resetToDefaultData}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-stone-300 hover:text-white hover:bg-white/10 transition text-[11px] cursor-pointer"
              title="Reset data demo ke awal"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <Link
                href={isMusyrif ? '/musyrif' : '/santri'}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#146B50] to-[#0B3D2E] p-0.5 border border-[#D6A84F]/60 flex items-center justify-center shadow-sm">
                  <div className="w-full h-full rounded-[10px] bg-[#0B3D2E] flex items-center justify-center text-[#D6A84F]">
                    <span className="text-xl font-bold font-serif leading-none">ن</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base text-white tracking-tight">
                      ABSENSI SANTRI
                    </span>
                    <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-[#D6A84F] text-[#0B3D2E] rounded">
                      GPS & Selfie
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 -mt-0.5">
                    PP. Nurul Falah Ketintang
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                      item.highlight
                        ? 'bg-[#D6A84F] text-[#0B3D2E] font-bold hover:bg-[#c4953c] shadow-sm'
                        : isActive
                        ? 'bg-[#146B50] text-white shadow-inner font-semibold'
                        : 'text-emerald-100/90 hover:bg-[#146B50]/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side: Role Switcher, Dark Mode & Profile Card */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Icon Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-[#07281E]/80 hover:bg-[#146B50] border border-[#146B50] text-[#D6A84F] transition flex items-center justify-center cursor-pointer shadow-xs"
                title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#D6A84F]" />
                ) : (
                  <Moon className="w-4 h-4 text-emerald-200" />
                )}
              </button>

              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#07281E]/80 hover:bg-[#146B50]/80 border border-[#146B50] transition cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center text-[#D6A84F] border border-[#D6A84F]/40 font-semibold text-xs">
                  {currentUser.role === 'musyrif' ? (
                    <Shield className="w-4 h-4 text-[#D6A84F]" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-[#D6A84F]" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white max-w-[130px] truncate">
                      {currentUser.full_name}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                        currentUser.role === 'musyrif'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-200/70">
                    {currentUser.group_name || 'Santri Pondok'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
              </button>

              {/* Mobile menu hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-[#146B50]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#146B50] bg-[#0B3D2E] px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    item.highlight
                      ? 'bg-[#D6A84F] text-[#0B3D2E] font-bold'
                      : isActive
                      ? 'bg-[#146B50] text-white font-semibold'
                      : 'text-emerald-100 hover:bg-[#146B50]/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Theme Toggle Button */}
            <div className="pt-2 border-t border-[#146B50]/60 mt-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-100 hover:bg-[#146B50]/60 transition"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-[#D6A84F]" />
                  ) : (
                    <Moon className="w-4 h-4 text-emerald-200" />
                  )}
                  <span>Pilihan Tema Tampilan</span>
                </div>
                <span className="text-[11px] font-bold text-[#D6A84F]">
                  {theme === 'dark' ? 'Mode Gelap 🌙' : 'Mode Terang ☀️'}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Role & Profile Switcher Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0B3D2E] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D6A84F]" />
                  Ganti Pengguna & Peran
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Uji alur aplikasi sebagai Santri atau Musyrif
                </p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Peran Musyrif (Pengelola & Peninjau)
                </p>
                <div className="space-y-1.5">
                  {profiles
                    .filter((p) => p.role === 'musyrif')
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentUser(p);
                          setShowUserModal(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                          currentUser.id === p.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#146B50] shadow-xs'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-[#D6A84F] flex items-center justify-center font-bold text-sm">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                              {p.full_name}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {p.group_name}
                            </p>
                          </div>
                        </div>
                        {currentUser.id === p.id && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#146B50] text-white">
                            Aktif
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Peran Santri (Absensi & Riwayat)
                </p>
                <div className="space-y-1.5">
                  {profiles
                    .filter((p) => p.role === 'santri')
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentUser(p);
                          setShowUserModal(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                          currentUser.id === p.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#146B50] shadow-xs'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold text-sm">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                              {p.full_name}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              NIS: {p.student_number} • {p.group_name}
                            </p>
                          </div>
                        </div>
                        {currentUser.id === p.id && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#146B50] text-white">
                            Aktif
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/50 p-3 text-center border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setShowUserModal(false)}
                className="w-full py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Simulation Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="bg-[#0B3D2E] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D6A84F]" />
                  Simulasi Jadwal Waktu
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Uji kegiatan apa pun tanpa menunggu jam operasional asli
                </p>
              </div>
              <button
                onClick={() => setShowTimeModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                Pilih salah satu jadwal di bawah ini untuk melihat bagaimana sistem otomatis mendeteksi kegiatan aktif santri:
              </p>

              <div className="grid grid-cols-1 gap-2">
                {testTimePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-[#146B50] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{preset.label}</span>
                    <span className="text-[11px] text-[#146B50] font-bold">Pilih</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/50 p-3 text-center border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setShowTimeModal(false)}
                className="w-full py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
