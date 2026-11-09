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
  Users,
  CheckCircle2,
  FileText,
  CreditCard,
  BookOpen,
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
  const { currentUser, attendanceRecords, sppPayments } = useStore();

  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/login/')) {
    return null;
  }

  const isMusyrif = currentUser.role === 'musyrif';

  const pendingIzinCount = attendanceRecords.filter(
    (r) => r.status === 'izin_diajukan'
  ).length;

  const pendingSppCount = (sppPayments || []).filter(
    (p) => p.status === 'pending'
  ).length;

  const santriItems: NavItem[] = [
    { href: '/santri', label: 'Beranda', icon: Compass },
    { href: '/santri/spp', label: 'SPP', icon: CreditCard },
    { href: '/santri/absensi', label: 'Absen', icon: Camera, center: true },
    { href: '/santri/kalender', label: 'Kalender', icon: Calendar },
    { href: '/santri/riwayat', label: 'Riwayat', icon: History },
  ];

  const musyrifItems: NavItem[] = [
    { href: '/musyrif', label: 'Beranda', icon: Compass },
    { href: '/musyrif/keuangan', label: 'SPP', icon: CreditCard, badge: pendingSppCount },
    { href: '/musyrif/tahfidz', label: 'Tahfidz', icon: BookOpen, center: true },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText, badge: pendingIzinCount },
    { href: '/musyrif/santri', label: 'Santri', icon: Users },
  ];

  const items = isMusyrif ? musyrifItems : santriItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-pb pointer-events-none">
      <div className="flex justify-center pb-2 px-3">
        <div
          className="
            relative
            flex items-center justify-around
            bg-[#061F17]/95 dark:bg-[#07140F]/95
            backdrop-blur-md
            border border-[#0D382A] dark:border-[#1A3327]
            shadow-lg
            rounded-2xl
            px-2 py-1.5
            w-full max-w-sm
            pointer-events-auto
          "
        >
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.center) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center focus:outline-none touch-target -mt-5"
                >
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      shadow-md
                      transform active:scale-95 transition-transform duration-150
                      ${
                        isActive
                          ? 'bg-[#0D7B5F] text-white ring-2 ring-emerald-400/40'
                          : 'bg-[#0D7B5F] text-white hover:bg-[#0A664E]'
                      }
                    `}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-white mt-0.5">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center touch-target flex-1 py-1 focus:outline-none"
              >
                <div className="relative flex flex-col items-center gap-0.5">
                  <Icon
                    className={`w-4 h-4 transition-colors duration-150 ${
                      isActive ? 'text-[#E0B45C]' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] transition-colors leading-tight ${
                      isActive ? 'text-[#E0B45C] font-bold' : 'text-stone-400 font-medium'
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
