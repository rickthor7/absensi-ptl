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
  BookOpen,
  CheckSquare,
  Edit3,
} from 'lucide-react';
import AccountSecurityModal from './AccountSecurityModal';
import { formatIndonesianDate, formatTime24 } from '@/lib/schedule';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: number;
}

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
    attendanceRecords,
  } = useStore();

  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click-outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        // Also don't close if clicking hamburger button
        const isHamburger = (event.target as HTMLElement)?.closest('[aria-label="Toggle menu"]');
        if (!isHamburger) {
          setMobileMenuOpen(false);
        }
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
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return null;
  }

  const isMusyrif = currentUser.role === 'musyrif';
  const pendingSppCount = (sppPayments || []).filter((p) => p.status === 'pending').length;

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const santriNav: NavItem[] = [
    { href: '/santri', label: 'Beranda', icon: Compass },
    { href: '/santri/absensi', label: 'Absensi', icon: CheckCircle2, highlight: true },
    { href: '/santri/spp', label: 'SPP', icon: CreditCard },
    { href: '/santri/kalender', label: 'Kalender', icon: Calendar },
    { href: '/santri/riwayat', label: 'Riwayat', icon: History },
    { href: '/santri/profil', label: 'Profil', icon: User },
  ];

  const pendingIzinCount = (attendanceRecords || []).filter(
    (r) => r.status === 'izin_diajukan'
  ).length;

  const musyrifNav: NavItem[] = [
    { href: '/musyrif', label: 'Beranda', icon: Compass },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText, badge: pendingIzinCount },
    { href: '/musyrif/absensi', label: 'Data Absensi', icon: CheckCircle2 },
    { href: '/musyrif/kegiatan', label: 'Jadwal Kegiatan', icon: Settings },
    { href: '/musyrif/edit-presensi', label: 'Edit Presensi', icon: CheckSquare },
    { href: '/musyrif/tahfidz', label: 'Setoran Tahfidz', icon: BookOpen },
    { href: '/musyrif/edit-setoran', label: 'Edit Setoran', icon: Edit3 },
    { href: '/musyrif/santri', label: 'Data Santri', icon: Users },
    { href: '/musyrif/keuangan', label: 'Data SPP', icon: CreditCard, badge: pendingSppCount },
    { href: '/musyrif/laporan', label: 'Laporan', icon: BarChart3 },
    { href: '/musyrif/audit', label: 'Audit Log', icon: Shield },
  ];

  const navLinks = isMusyrif ? musyrifNav : santriNav;

  // Desktop shows all nav items for musyrif (8 items fit with short labels)
  // For santri desktop, show inline nav too (7 items with short labels)
  const desktopNavLinks = navLinks;

  return (
    <header className="sticky top-0 z-40 transition-all duration-300">
      {/* Main Navbar — Slim h-12, Clean Surface */}
      <div className="bg-[#061F17]/95 dark:bg-[#07140F]/95 backdrop-blur-md border-b border-[#0D382A] dark:border-[#1A3327] shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center h-12 gap-2">

            {/* ── Brand Logo ── */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#0D7B5F] p-0.5 shadow-sm overflow-hidden shrink-0 border border-white/10">
                <img
                  src="/icon.jpg"
                  alt="Logo PP Nurul Falah"
                  className="w-full h-full object-cover rounded-[6px]"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight leading-none whitespace-nowrap">
                    Nurul Falah
                  </span>
                  {/* Live / Lokal chip */}
                  <span
                    className={`hidden sm:flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${isSupabaseConnected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-stone-400 border-white/10'
                      }`}
                    title={supabaseStatusMessage}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-stone-500'
                        }`}
                    />
                    {isSupabaseConnected ? 'Live' : 'Lokal'}
                  </span>
                </div>
                {/* Compact date + time — only md+ */}
                <span className="hidden md:block text-[9px] text-stone-400 leading-none mt-0.5 font-mono tabular-nums whitespace-nowrap">
                  {formatIndonesianDate(effectiveTime)}&nbsp;
                  {formatTime24(effectiveTime)} WIB
                </span>
              </div>
            </Link>

            {/* ── Desktop Navigation Links — shown lg+ ── */}
            {isAuthenticated ? (
              <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0 overflow-hidden">
                {desktopNavLinks.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${item.highlight
                        ? 'bg-[#0D7B5F] text-white font-bold shadow-xs'
                        : isActive
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-stone-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white leading-none">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
                <Link
                  href="/"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${pathname === '/'
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </Link>
                <Link
                  href="/santri/absensi"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-200/70 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Presensi Mandiri</span>
                </Link>
              </div>
            )}

            {/* ── Spacer when not authenticated on mobile ── */}
            {!isAuthenticated && <div className="flex-1 sm:hidden" />}

            {/* ── Right side: theme + user/login + hamburger ── */}
            <div className="flex items-center gap-1 shrink-0 ml-auto lg:ml-0">

              {/* Theme Toggle */}
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
                  {/* User Avatar button */}
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 cursor-pointer group"
                    aria-label="User menu"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-offset-1 ring-offset-[#082F23] transition-all duration-200 group-hover:ring-[#D4A24C]/60 ${isMusyrif
                        ? 'bg-gradient-to-br from-[#D4A24C] to-[#B8872E] text-[#082F23] ring-[#D4A24C]/30'
                        : 'bg-gradient-to-br from-[#0D7B5F] to-[#096B52] text-white ring-emerald-500/30'
                        }`}
                    >
                      {currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    {/* Name + role — visible sm+ */}
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-[11px] font-semibold text-white max-w-[80px] truncate leading-tight">
                        {currentUser.full_name.split(' ')[0]}
                      </span>
                      <span className={`text-[9px] font-medium leading-tight ${isMusyrif ? 'text-[#D4A24C]/70' : 'text-emerald-300/60'}`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronDown
                      className={`hidden sm:block w-3 h-3 text-emerald-300/50 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* ── User Dropdown ── */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-64 rounded-xl bg-white dark:bg-[#0E1713] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden z-50 animate-in-fade">
                      {/* Header */}
                      <div className="p-4 bg-stone-50 dark:bg-[#14221C] border-b border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${isMusyrif
                            ? 'bg-[#E0B45C] text-[#06241B]'
                            : 'bg-[#0D7B5F] text-white'
                            }`}
                        >
                          {currentUser.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {currentUser.full_name}
                          </p>
                          <span className="inline-block text-[9px] uppercase font-bold text-stone-500 dark:text-stone-400">
                            {currentUser.role} • {currentUser.group_name || 'Santri'}
                          </span>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-1.5 space-y-0.5">
                        <Link
                          href={isMusyrif ? '/musyrif' : '/santri/profil'}
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162B22] transition group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-[#0D7B5F]/10 transition shrink-0">
                            <User className="w-3.5 h-3.5 text-[#0D7B5F] dark:text-emerald-400" />
                          </div>
                          <div>
                            <span className="block font-semibold text-stone-800 dark:text-white">Profil</span>
                            <span className="text-[10px] text-stone-400">Lihat &amp; edit profil</span>
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
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-[#D4A24C]/10 transition shrink-0">
                            <Key className="w-3.5 h-3.5 text-[#D4A24C]" />
                          </div>
                          <div>
                            <span className="block font-semibold text-stone-800 dark:text-white">Akun &amp; Kata Sandi</span>
                            <span className="text-[10px] text-stone-400">Keamanan &amp; kredensial</span>
                          </div>
                        </button>
                      </div>

                      {/* Logout */}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-[11px] font-bold transition shadow-sm hover:shadow-md cursor-pointer btn-press whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )}

              {/* Hamburger — shown on < lg for ALL authenticated users */}
              {isAuthenticated && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile/Tablet Dropdown — < lg, all authenticated users ── */}
      {isAuthenticated && mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden bg-[#082F23]/98 backdrop-blur-xl border-b border-[#0D7B5F]/25 px-4 pt-2 pb-3 space-y-0.5 animate-fade-up"
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${item.highlight
                  ? 'bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] font-bold shadow-sm'
                  : isActive
                    ? 'bg-[#0D7B5F] text-white font-semibold'
                    : 'text-emerald-200/70 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {/* Logout in mobile menu */}
          <div className="pt-2 border-t border-[#0D7B5F]/30 mt-2">
            <button
              onClick={handleLogout}
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
