'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import AccountSecurityModal from './AccountSecurityModal';
import {
  Compass,
  CheckCircle2,
  CreditCard,
  Calendar,
  History,
  Wallet,
  User,
  Search,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Headphones,
  Sparkles,
  Shield,
  FileText,
  BarChart3,
  Settings,
  Users,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
  BookOpen,
} from 'lucide-react';

interface ShellNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    isSupabaseConnected,
    supabaseStatusMessage,
    logout,
    theme,
    toggleTheme,
    attendanceRecords,
    sppPayments,
    activities,
  } = useStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside or ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Route conditions
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');
  const isPublicHome = pathname === '/';
  const isDashboardRoute =
    pathname.startsWith('/santri') ||
    pathname.startsWith('/musyrif');

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isPublicHome || !isDashboardRoute) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-12">{children}</main>
        <MobileNav />
      </>
    );
  }

  const isMusyrif = currentUser.role === 'musyrif';
  const pendingIzinCount = attendanceRecords.filter((r) => r.status === 'izin_diajukan').length;
  const pendingSppCount = (sppPayments || []).filter((p) => p.status === 'pending').length;

  // Santri navigation items matching mockup exactly
  const santriNavItems: ShellNavItem[] = [
    { href: '/santri', label: 'Beranda', icon: Compass },
    { href: '/santri/absensi', label: 'Absensi', icon: CheckCircle2 },
    { href: '/santri/spp', label: 'SPP', icon: CreditCard },
    { href: '/santri/kalender', label: 'Kalender', icon: Calendar },
    { href: '/santri/riwayat', label: 'Riwayat', icon: History },
    { href: '/santri/profil', label: 'Profil', icon: User },
  ];

  // Musyrif navigation items
  const musyrifNavItems: ShellNavItem[] = [
    { href: '/musyrif', label: 'Beranda', icon: Compass },
    { href: '/musyrif/tahfidz', label: 'Setoran Tahfidz', icon: BookOpen },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText, badge: pendingIzinCount },
    { href: '/musyrif/santri', label: 'Data Santri', icon: Users },
    { href: '/musyrif/keuangan', label: 'Data SPP', icon: CreditCard, badge: pendingSppCount },
    { href: '/musyrif/kegiatan', label: 'Kegiatan & Absensi', icon: Settings },
    { href: '/musyrif/laporan', label: 'Laporan', icon: BarChart3 },
    { href: '/musyrif/audit', label: 'Audit Log', icon: Shield },
    { href: '/santri/profil', label: 'Profil', icon: User },
  ];

  const navItems = isMusyrif ? musyrifNavItems : santriNavItems;

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/login');
  };

  // Quick search filtered list
  const searchItems = [
    ...navItems.map((item) => ({ title: item.label, href: item.href, category: 'Menu' })),
    { title: 'Setoran Tahfidz & Rekap WA', href: '/musyrif/tahfidz', category: 'Tahfidz' },
    { title: 'Presensi Kamera & GPS (Santri)', href: '/santri/absensi', category: 'Aksi' },
    { title: 'Ajukan Izin Presensi', href: '/santri/absensi', category: 'Aksi' },
    { title: 'Pembayaran SPP Online', href: isMusyrif ? '/musyrif/keuangan' : '/santri/spp', category: 'Keuangan' },
    { title: 'Laporan Mutabaah Bulanan', href: isMusyrif ? '/musyrif/laporan' : '/santri/riwayat', category: 'Laporan' },
  ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // User display name
  const displayName = currentUser.nickname || currentUser.full_name?.split(' ')[0] || 'User';
  const roleLabel = isMusyrif ? 'Musyrif' : 'Santri';

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#070D0A] text-stone-900 dark:text-stone-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP PERSISTENT LEFT SIDEBAR (lg+) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30 bg-[#061F17] dark:bg-[#05140F] text-stone-200 border-r border-[#0D382A] dark:border-[#142921] select-none">
        
        {/* Brand Header */}
        <div className="p-5 pb-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D7B5F] p-0.5 shadow-sm overflow-hidden shrink-0 border border-white/10">
            <img
              src="/icon.jpg"
              alt="Logo PP Nurul Falah"
              className="w-full h-full object-cover rounded-[10px]"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm text-white tracking-tight leading-tight">
              Nurul Falah
            </span>
            <span className="text-[10px] font-medium text-emerald-400/80 leading-none mt-0.5">
              Portal Madrasah Digital
            </span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive =
              item.href === '/santri' || item.href === '/musyrif'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-150 group ${
                  isActive
                    ? 'bg-[#0D7B5F] text-white font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#E0B45C]' : 'text-stone-400 group-hover:text-stone-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Help Area */}
        <div className="p-3 border-t border-white/5">
          <div className="rounded-xl p-3 bg-white/5 border border-white/10 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white truncate">Pusat Bantuan</span>
                <span className="text-[10px] text-stone-400 truncate">WhatsApp Pengasuhan</span>
              </div>
            </div>

            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Nurul%20Falah,%20saya%20butuh%20bantuan%20aplikasi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 hover:text-white transition shrink-0"
              title="Hubungi Admin WhatsApp"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── RIGHT MAIN WRAPPER ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* ── TOP HEADER BAR ── */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          
          {/* Mobile hamburger & brand (visible < lg) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                <img src="/icon.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-sm text-[#082F23] dark:text-[#D6A84F] tracking-tight">
                Nurul Falah
              </span>
            </Link>
          </div>

          {/* Search bar (Center / Left on Desktop) */}
          <div className="hidden sm:flex flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-full bg-stone-100 dark:bg-stone-800/90 hover:bg-stone-200/70 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-700/60 text-stone-500 dark:text-stone-400 text-xs transition shadow-xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#105943] transition" />
                <span className="truncate">Cari menu atau informasi...</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded border border-stone-300 dark:border-stone-600 shadow-2xs">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons (Live Status, Theme, Notif, User Profile) */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            
            {/* Live / Local chip */}
            <span
              className={`hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                isSupabaseConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
              }`}
              title={supabaseStatusMessage}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span>{isSupabaseConnected ? 'Live Cloud' : 'Lokal Mode'}</span>
            </span>

            {/* Mobile search trigger icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Cari"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark/Light mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600" />
              )}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
              >
                {/* Avatar Badge */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#105943] to-[#0A3D2F] text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                {/* Name & Role Text */}
                <div className="hidden sm:flex flex-col text-left min-w-0 pr-0.5">
                  <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-tight leading-none truncate max-w-[110px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 leading-none mt-1">
                    {roleLabel}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 border-b border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-extrabold text-stone-900 dark:text-white truncate">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                      {currentUser.email || currentUser.nickname || '-'} • {roleLabel}
                    </p>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/santri/profil"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    >
                      <User className="w-4 h-4 text-stone-400" />
                      <span>Profil Akun</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowSecurityModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    >
                      <Lock className="w-4 h-4 text-stone-400" />
                      <span>Ubah Password</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Aplikasi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 pb-24 lg:pb-12">
          {children}
        </main>

        {/* ── MOBILE BOTTOM NAVIGATION (Visible on screens < lg) ── */}
        <MobileNav />

      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE SLIDE-OVER DRAWER (Visible when menu open on < lg) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-gradient-to-b from-[#06291F] via-[#083327] to-[#0A3D2F] text-white p-5 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                  <img src="/icon.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Nurul Falah</h3>
                  <p className="text-[10px] text-emerald-300/80">Madrasah Digital</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1.5 custom-scrollbar">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/santri' || item.href === '/musyrif'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#13634B] text-white font-bold shadow-sm'
                        : 'text-emerald-100/75 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Drawer Bottom */}
            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-xs font-bold text-white transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── QUICK SEARCH MODAL (Ctrl + K) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:pt-24 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Input row */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik menu, fitur, atau aksi..."
                className="w-full bg-transparent outline-none text-sm font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results list */}
            <div className="p-2 max-h-72 overflow-y-auto">
              {searchItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  Tidak ditemukan hasil untuk &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchItems.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800/80 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#105943]" />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-[#105943]">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </Link>
                ))
              )}
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400 flex items-center justify-between">
              <span>Gunakan tombol panah atau klik untuk memilih</span>
              <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
                ESC
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* Account Security Modal */}
      {showSecurityModal && (
        <AccountSecurityModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
        />
      )}
    </div>
  );
}

