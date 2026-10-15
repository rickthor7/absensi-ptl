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
      {/* Slim Info Bar */}
      <div className="bg-[#051A13] px-4 py-1 text-[10px] text-[#D4A24C]/80 border-b border-[#0D7B5F]/20 flex items-center justify-between gap-2">
        <span className="font-medium tracking-wide truncate">
          {getEstimatedHijriDate(effectiveTime)} • {formatIndonesianDate(effectiveTime)}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {/* DB Status Dot */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
            title={supabaseStatusMessage}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 dot-pulse' : 'bg-amber-400'}`} />
            <span className={isSupabaseConnected ? 'text-emerald-400/90' : 'text-amber-400/90'}>
              {isSupabaseConnected ? 'Live' : 'Lokal'}
            </span>
          </div>

          {/* Live Clock */}
          <span className="font-mono text-[10px] text-white/60 tabular-nums">
            {effectiveTime.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Main Navbar — Glass Effect */}
      <div className="bg-[#082F23]/95 backdrop-blur-xl border-b border-[#0D7B5F]/25 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D7B5F] to-[#D4A24C] p-[2px] shadow-lg shadow-emerald-900/30">
                <div className="w-full h-full rounded-[10px] bg-[#051A13] flex items-center justify-center text-[#D4A24C] group-hover:bg-[#082F23] transition-colors">
                  <span className="text-lg font-bold font-serif leading-none">ن</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight">
                    ABSENSI
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/25">
                    v2.0
                  </span>
                </div>
                <p className="text-[10px] text-emerald-300/60 -mt-0.5 hidden sm:block">
                  PP. Nurul Falah Ketintang
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated ? (
              <nav className="hidden lg:flex items-center gap-0.5">
                {navLinks.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 relative ${
                        item.highlight
                          ? 'bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] font-bold shadow-sm shadow-amber-900/20 hover:shadow-md'
                          : isActive
                          ? 'bg-white/10 text-white font-semibold shadow-inner'
                          : 'text-emerald-200/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-sm">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/transparansi"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#D4A24C] border border-[#D4A24C]/30 hover:bg-white/5 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Transparansi Kas Terbuka</span>
                </Link>
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Transparansi Quick Icon for Authenticated if not already displayed */}
              <Link
                href="/transparansi"
                title="Buka Halaman Transparansi Kas Publik"
                className="hidden md:flex p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#D4A24C] transition cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
              </Link>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#D4A24C] transition cursor-pointer"
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
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                      isMusyrif
                        ? 'bg-gradient-to-br from-[#D4A24C] to-[#B8872E] text-[#082F23]'
                        : 'bg-gradient-to-br from-[#0D7B5F] to-[#096B52] text-white'
                    }`}>
                      {currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="text-[11px] font-semibold text-white max-w-[100px] truncate block">
                        {currentUser.full_name.split(' ')[0]}
                      </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-emerald-300/60 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Profile Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0F1E18] border border-stone-200 dark:border-[#1C3A2E] shadow-2xl p-2.5 space-y-2 z-50 animate-fade-up">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-stone-50 to-emerald-50/30 dark:from-[#162B22] dark:to-[#0F1E18] border border-stone-200/60 dark:border-[#1C3A2E]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isMusyrif
                              ? 'bg-gradient-to-br from-[#D4A24C] to-[#B8872E] text-[#082F23]'
                              : 'bg-gradient-to-br from-[#0D7B5F] to-[#096B52] text-white'
                          }`}>
                            {currentUser.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                              {currentUser.full_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold ${
                                isMusyrif
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {currentUser.role}
                              </span>
                              <span className="text-[10px] text-stone-400 truncate">
                                {currentUser.group_name || 'Santri'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={isMusyrif ? '/musyrif' : '/santri/profil'}
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162B22] transition"
                      >
                        <User className="w-3.5 h-3.5 text-[#0D7B5F]" />
                        <span>Profil Pengguna</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowSecurityModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162B22] transition cursor-pointer text-left"
                      >
                        <Key className="w-3.5 h-3.5 text-[#D4A24C]" />
                        <span>Akun & Kata Sandi</span>
                      </button>

                      <div className="pt-1 border-t border-stone-200 dark:border-[#1C3A2E]">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-xs font-bold transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-[11px] font-bold transition shadow-sm hover:shadow-md cursor-pointer btn-press"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )}

              {/* Mobile menu hamburger */}
              {isAuthenticated && (
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

      {/* Mobile Dropdown Menu — Slide down */}
      {isAuthenticated && mobileMenuOpen && (
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
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-emerald-200/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
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
