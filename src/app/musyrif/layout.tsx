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

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#0B3D2E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Memverifikasi hak akses musyrif...</p>
      </div>
    );
  }

  if (isAuthenticated && currentUser.role === 'santri') {
    return null;
  }

  return <>{children}</>;
}
