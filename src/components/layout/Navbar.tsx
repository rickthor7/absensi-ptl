'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Compass,
  User,
  Clock,
  Shield,
  GraduationCap,
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
  LogOut,
  Database,
  LogIn,
  Key,
  Wallet,
  CreditCard,
} from 'lucide-react';
import AccountSecurityModal from './AccountSecurityModal';
import { formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';

export default function Navbar() {
  const {
    currentUser,
    isAuthenticated,
    isSupabaseConnected,
    supabaseStatusMessage,
    logout,
    effectiveTime,
    theme,
    toggleTheme,
    sppPayments,
  } = useStore();

  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on click-outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // If on login page, hide navbar for clean focus
  if (pathname === '/login') {
    return null;
  }

  const isMusyrif = currentUser.role === 'musyrif';
  const pendingSppCount = (sppPayments || []).filter((p) => p.status === 'pending').length;

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
    badge?: number;
  }

  const santriNav: NavItem[] = [
    { href: '/santri', label: 'Beranda', icon: Compass },
    { href: '/santri/absensi', label: 'Mulai Absensi', icon: CheckCircle2, highlight: true },
    { href: '/santri/spp', label: 'SPP Bulanan', icon: CreditCard },
    { href: '/santri/kalender', label: 'Kalender', icon: Calendar },
    { href: '/santri/riwayat', label: 'Riwayat', icon: History },
    { href: '/transparansi', label: 'Transparansi', icon: Wallet },
    { href: '/santri/profil', label: 'Profil', icon: User },
  ];

  const musyrifNav: NavItem[] = [
    { href: '/musyrif', label: 'Ringkasan', icon: Compass },
    { href: '/musyrif/santri', label: 'Data Santri', icon: Users },
    { href: '/musyrif/keuangan', label: 'Keuangan & SPP', icon: Wallet, badge: pendingSppCount },
    { href: '/musyrif/absensi', label: 'Absensi', icon: CheckCircle2 },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText },
    { href: '/musyrif/kegiatan', label: 'Kegiatan & Jadwal', icon: Settings },
    { href: '/musyrif/laporan', label: 'Rekap Laporan', icon: BarChart3 },
    { href: '/musyrif/audit', label: 'Audit Log', icon: Shield },
  ];

  const navLinks = isMusyrif ? musyrifNav : santriNav;

  return (
    <header className="sticky top-0 z-40 transition-all duration-300">
      {/* Main Navbar — Slim h-12, Glass Effect, no info bar above */}
      <div className="bg-[#082F23]/95 backdrop-blur-xl border-b border-[#0D7B5F]/25 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">

            {/* Brand Logo + "Nurul Falah" + Live chip */}
            <Link
              href="/"
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D7B5F] to-[#D4A24C] p-[1.5px] shadow-lg shadow-emerald-900/30 overflow-hidden shrink-0">
                <img
                  src="/icon.jpg"
                  alt="Logo PP Nurul Falah"
                  className="w-full h-full object-cover rounded-[9px]"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight leading-none">
                    Nurul Falah
                  </span>
                  {/* Live chip with dot-pulse when supabase connected */}
                  <span
                    className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isSupabaseConnected
                        ? 'bg-[#D4A24C]/15 text-[#D4A24C] border-[#D4A24C]/30'
                        : 'bg-white/5 text-stone-400 border-white/10'
                    }`}
                    title={supabaseStatusMessage}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSupabaseConnected
                          ? 'bg-[#D4A24C] dot-pulse'
                          : 'bg-stone-500'
                      }`}
                    />
                    {isSupabaseConnected ? 'Live' : 'Lokal'}
                  </span>
                </div>
                {/* Compact date + time row */}
                <span className="text-[9px] text-emerald-300/50 leading-none mt-0.5 font-mono tabular-nums hidden md:block">
                  {formatIndonesianDate(effectiveTime)} &nbsp;
                  {effectiveTime.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated ? (
              <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-4">
                {navLinks.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 relative ${
                        item.highlight
                          ? 'bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] font-bold shadow-sm shadow-amber-900/20 hover:shadow-md btn-press'
                          : isActive
                          ? 'bg-[#0D7B5F] text-white font-semibold shadow-inner shadow-emerald-900/30'
                          : 'text-emerald-200/70 hover:text-white hover:underline underline-offset-4 decoration-emerald-400/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-sm">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
                <Link
                  href="/transparansi"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#D4A24C] border border-[#D4A24C]/30 hover:bg-white/5 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Transparansi Kas Terbuka</span>
                </Link>
              </div>
            )}

            {/* Right side — User area */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Theme toggle integrated into user area */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#D4A24C] transition cursor-pointer"
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4 text-emerald-200/80" />
                )}
              </button>

              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  {/* User Avatar — rounded-full, no chevron arrow, click to open dropdown */}
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 cursor-pointer group"
                    aria-label="User menu"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-offset-2 ring-offset-[#082F23] transition-all duration-200 group-hover:ring-[#D4A24C]/60 ${
                        isMusyrif
                          ? 'bg-gradient-to-br from-[#D4A24C] to-[#B8872E] text-[#082F23] ring-[#D4A24C]/30'
                          : 'bg-gradient-to-br from-[#0D7B5F] to-[#096B52] text-white ring-emerald-500/30'
                      }`}
                    >
                      {currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="text-[11px] font-semibold text-white max-w-[90px] truncate block leading-tight">
                        {currentUser.full_name.split(' ')[0]}
                      </span>
                      <span className={`text-[9px] font-medium leading-tight ${isMusyrif ? 'text-[#D4A24C]/70' : 'text-emerald-300/60'}`}>
                        {currentUser.role}
                      </span>
                    </div>
                  </button>

                  {/* User Profile Dropdown — Modern card */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white dark:bg-[#0F1E18] border border-stone-200 dark:border-[#1C3A2E] shadow-2xl overflow-hidden z-50 animate-fade-up">
                      {/* Header with large avatar */}
                      <div className="p-4 bg-gradient-to-br from-[#082F23] to-[#0D7B5F]/80 relative overflow-hidden">
                        {/* Subtle pattern */}
                        <div className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: 'radial-gradient(rgba(212,162,76,0.4) 1px, transparent 1px)',
                            backgroundSize: '16px 16px',
                          }}
                        />
                        <div className="relative flex flex-col items-center text-center gap-2">
                          {/* Large avatar */}
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ring-4 ring-white/20 shadow-xl ${
                              isMusyrif
                                ? 'bg-gradient-to-br from-[#D4A24C] to-[#B8872E] text-[#082F23]'
                                : 'bg-gradient-to-br from-[#0D7B5F] to-[#096B52] text-white'
                            }`}
                          >
                            {currentUser.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">
                              {currentUser.full_name}
                            </p>
                            {/* Role badge */}
                            <span
                              className={`inline-block mt-1 text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold ${
                                isMusyrif
                                  ? 'bg-[#D4A24C]/25 text-[#D4A24C] border border-[#D4A24C]/40'
                                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                              }`}
                            >
                              {currentUser.role}
                            </span>
                            {/* Email / group */}
                            <p className="text-[10px] text-white/50 mt-1">
                              {currentUser.group_name || 'Peserta Didik'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-2 space-y-0.5">
                        <Link
                          href={isMusyrif ? '/musyrif' : '/santri/profil'}
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162B22] transition group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-[#0D7B5F]/10 transition">
                            <User className="w-3.5 h-3.5 text-[#0D7B5F] dark:text-emerald-400" />
                          </div>
                          <div>
                            <span className="block font-semibold text-stone-800 dark:text-white">Profil</span>
                            <span className="text-[10px] text-stone-400">Lihat & edit profil</span>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowSecurityModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162B22] transition cursor-pointer text-left group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-[#D4A24C]/10 transition">
                            <Key className="w-3.5 h-3.5 text-[#D4A24C]" />
                          </div>
                          <div>
                            <span className="block font-semibold text-stone-800 dark:text-white">Akun & Kata Sandi</span>
                            <span className="text-[10px] text-stone-400">Keamanan & kredensial</span>
                          </div>
                        </button>

                        <Link
                          href="/transparansi"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162B22] transition group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-500/10 transition">
                            <Wallet className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div>
                            <span className="block font-semibold text-stone-800 dark:text-white">Transparansi</span>
                            <span className="text-[10px] text-stone-400">Laporan keuangan publik</span>
                          </div>
                        </Link>
                      </div>

                      {/* Divider + Logout */}
                      <div className="px-2 pb-2 border-t border-stone-100 dark:border-[#1C3A2E] pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-xs font-bold transition cursor-pointer btn-press"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar dari Akun</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-[11px] font-bold transition shadow-sm hover:shadow-md cursor-pointer btn-press"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )}

              {/* Mobile menu hamburger — only musyrif, since santri uses bottom nav */}
              {isAuthenticated && isMusyrif && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu — for musyrif only (slide down) */}
      {isAuthenticated && isMusyrif && mobileMenuOpen && (
        <div className="lg:hidden bg-[#082F23]/98 backdrop-blur-xl border-b border-[#0D7B5F]/25 px-4 pt-2 pb-3 space-y-0.5 animate-fade-up">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.highlight
                    ? 'bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] font-bold shadow-sm'
                    : isActive
                    ? 'bg-[#0D7B5F] text-white font-semibold'
                    : 'text-emerald-200/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {/* Mobile Logout Button */}
          <div className="pt-2 border-t border-[#0D7B5F]/30 mt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/30 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}

      {/* Account & Security Modal */}
      <AccountSecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </header>
  );
}
