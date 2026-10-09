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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#122820]/95 backdrop-blur-md border-t border-stone-200 dark:border-[#1F4235] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-6 group touch-target focus:outline-none"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0B3D2E] via-[#146B50] to-[#1E8A68] text-[#D6A84F] p-0.5 shadow-lg border-2 border-white dark:border-[#122820] flex items-center justify-center transform active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold text-[#146B50] dark:text-[#D6A84F] mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition relative touch-target justify-center ${
                isActive
                  ? 'text-[#146B50] dark:text-[#D6A84F] font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
