'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Compass,
  Camera,
  Calendar,
  History,
  User,
  Users,
  CheckCircle2,
  FileText,
  BarChart3,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  center?: boolean;
  badge?: number;
}

export default function MobileNav() {
  const pathname = usePathname();
  const { currentUser, attendanceRecords } = useStore();

  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const isMusyrif = currentUser.role === 'musyrif';

  const pendingIzinCount = attendanceRecords.filter(
    (r) => r.status === 'izin_diajukan'
  ).length;

  const santriItems: NavItem[] = [
    { href: '/santri', label: 'Beranda', icon: Compass },
    { href: '/santri/kalender', label: 'Kalender', icon: Calendar },
    { href: '/santri/absensi', label: 'Absen', icon: Camera, center: true },
    { href: '/santri/riwayat', label: 'Riwayat', icon: History },
    { href: '/santri/profil', label: 'Profil', icon: User },
  ];

  const musyrifItems: NavItem[] = [
    { href: '/musyrif', label: 'Beranda', icon: Compass },
    { href: '/musyrif/santri', label: 'Santri', icon: Users },
    { href: '/musyrif/absensi', label: 'Absensi', icon: CheckCircle2, center: true },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText, badge: pendingIzinCount },
    { href: '/musyrif/laporan', label: 'Laporan', icon: BarChart3 },
  ];

  const items = isMusyrif ? musyrifItems : santriItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-pb">
      {/* Glass backdrop */}
      <div className="mx-3 mb-2 rounded-2xl bg-white/80 dark:bg-[#0F1E18]/85 backdrop-blur-xl border border-white/50 dark:border-[#1C3A2E]/80 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.4)] px-1 py-1.5">
        <div className="flex items-center justify-around">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.center) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-7 group touch-target focus:outline-none"
                >
                  <div
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transform active:scale-90 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#0D7B5F] via-[#0A9E75] to-[#D4A24C] text-white ring-4 ring-white/30 dark:ring-[#0F1E18]/50'
                        : 'bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#096B52] text-[#D4A24C]'
                    }`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2] drop-shadow-sm" />
                    {/* Pulsing ring when active */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-2xl border-2 border-[#D4A24C]/40 animate-ping" style={{ animationDuration: '2s' }} />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-bold ${
                    isActive ? 'text-[#0D7B5F] dark:text-[#D4A24C]' : 'text-stone-500 dark:text-stone-400'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all duration-200 relative touch-target justify-center ${
                  isActive
                    ? 'nav-active-pill'
                    : ''
                }`}
              >
                <div className="relative">
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0D7B5F]/10 dark:bg-[#1AA37A]/15'
                      : ''
                  }`}>
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive
                          ? 'text-[#0D7B5F] dark:text-[#D4A24C] stroke-[2.5]'
                          : 'text-stone-400 dark:text-stone-500 stroke-[1.8]'
                      }`}
                    />
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg dot-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] mt-0.5 transition-all duration-200 ${
                  isActive
                    ? 'text-[#0D7B5F] dark:text-[#D4A24C] font-bold'
                    : 'text-stone-400 dark:text-stone-500 font-medium'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
