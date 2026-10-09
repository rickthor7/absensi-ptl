'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Shield, GraduationCap, ArrowRight, Sparkles, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { profiles, setCurrentUser } = useStore();

  const [selectedRole, setSelectedRole] = useState<'santri' | 'musyrif'>('santri');

  const filteredUsers = profiles.filter((p) => p.role === selectedRole);

  const handleSelectUser = (user: (typeof profiles)[0]) => {
    setCurrentUser(user);
    if (user.role === 'musyrif') {
      router.push('/musyrif');
    } else {
      router.push('/santri');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0B3D2E] via-[#146B50] to-[#0B3D2E] text-white p-6 text-center space-y-2 border-b border-[#D6A84F]/40">
          <div className="w-12 h-12 rounded-2xl bg-[#0B3D2E] border border-[#D6A84F] text-[#D6A84F] mx-auto flex items-center justify-center font-serif text-2xl font-bold shadow-md">
            ن
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Portal Absensi Santri</h1>
          <p className="text-xs text-emerald-100/80">PP. Nurul Falah, Ketintang, Surabaya</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setSelectedRole('santri')}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'santri'
                  ? 'bg-white dark:bg-stone-900 text-[#146B50] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Santri</span>
            </button>
            <button
              onClick={() => setSelectedRole('musyrif')}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'musyrif'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Musyrif</span>
            </button>
          </div>

          <div>
            <p className="text-xs font-bold text-stone-600 dark:text-stone-300 mb-2">
              Pilih Akun Demo {selectedRole === 'santri' ? 'Santri' : 'Musyrif'}:
            </p>

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full text-left p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-[#146B50] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold text-sm">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#146B50]">
                        {user.full_name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {user.student_number ? `NIS: ${user.student_number} • ` : ''}
                        {user.group_name}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#146B50] group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
