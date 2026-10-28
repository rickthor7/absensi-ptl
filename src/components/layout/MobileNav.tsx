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
  CreditCard,
  Wallet,
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

  if (pathname === '/' || pathname === '/login') {
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
    { href: '/transparansi', label: 'Kas', icon: Wallet },
  ];

  const musyrifItems: NavItem[] = [
    { href: '/musyrif', label: 'Beranda', icon: Compass },
    { href: '/musyrif/keuangan', label: 'Keuangan', icon: Wallet, badge: pendingSppCount },
    { href: '/musyrif/absensi', label: 'Absensi', icon: CheckCircle2, center: true },
    { href: '/musyrif/perizinan', label: 'Perizinan', icon: FileText, badge: pendingIzinCount },
    { href: '/musyrif/santri', label: 'Santri', icon: Users },
  ];

  const items = isMusyrif ? musyrifItems : santriItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-pb pointer-events-none">
      {/* Floating pill container — not full-width, centered */}
      <div className="flex justify-center pb-2">
        <div
          className="
            relative
            flex items-center
            bg-[#082F23]/70 dark:bg-[#060E0A]/75
            backdrop-blur-2xl
            border border-[#0D7B5F]/30 dark:border-emerald-500/20
            shadow-[0_8px_32px_rgba(0,0,0,0.35)]
            rounded-3xl
            px-2 py-2
            gap-1
            pointer-events-auto
          "
          style={{ minWidth: 'min(calc(100vw - 2rem), 380px)' }}
        >
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.center) {
              /* Center elevated Absen button */
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center focus:outline-none touch-target -mt-4"
                  style={{ flex: '0 0 auto' }}
                >
                  <div
                    className={`
                      relative w-14 h-14 rounded-2xl flex items-center justify-center
                      shadow-xl shadow-emerald-900/40
                      transform active:scale-90 transition-all duration-200
                      bg-gradient-to-br from-[#0D7B5F] via-[#0A9E75] to-[#D4A24C]
                      ${isActive ? 'ring-4 ring-[#D4A24C]/40 shadow-[0_0_20px_rgba(212,162,76,0.3)]' : ''}
                    `}
                  >
                    <Icon className="w-6 h-6 text-white stroke-[2.2] drop-shadow-sm" />
                    {/* Pulsing ring when active */}
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-2xl border-2 border-[#D4A24C]/50 animate-ping"
                        style={{ animationDuration: '2s' }}
                      />
                    )}
                  </div>
                </Link>
              );
            }

            /* Regular tab — icon only, no label */
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center touch-target flex-1 focus:outline-none"
              >
                {/* Active pill background indicator */}
                {isActive && (
                  <span
                    className="absolute inset-1 rounded-2xl bg-gradient-to-br from-[#0D7B5F]/25 to-[#D4A24C]/15 border border-[#0D7B5F]/30"
                  />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 relative z-10 ${
                      isActive
                        ? 'text-[#D4A24C] stroke-[2.5] drop-shadow-sm'
                        : 'text-white/40 stroke-[1.8]'
                    }`}
                  />
                  {/* Badge notification */}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg dot-pulse z-20">
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
