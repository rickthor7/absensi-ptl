'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function MusyrifLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoadingAuth, currentUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentUser.role === 'santri') {
        router.push('/santri');
      }
    }
  }, [isLoadingAuth, isAuthenticated, currentUser, router]);

  // Fallback safety: jika auth belum selesai dalam 3.5 detik dan belum terautentikasi, alihkan ke login
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#0B3D2E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Memverifikasi hak akses musyrif...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#0B3D2E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Sesi telah berakhir, mengalihkan ke halaman login...</p>
      </div>
    );
  }

  if (currentUser.role === 'santri') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#0B3D2E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Mengalihkan ke portal santri...</p>
      </div>
    );
  }

  return <>{children}</>;
}
