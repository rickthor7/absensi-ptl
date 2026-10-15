'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Profile } from '@/types';
import StudentModal from '@/components/students/StudentModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Power,
  Shield,
  Phone,
  CheckCircle2,
  Sparkles,
  Bed,
  Key,
  Mail,
} from 'lucide-react';

export default function MusyrifSantriPage() {
  const { profiles, attendanceRecords, addStudent, updateStudent, toggleStudentStatus } =
    useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);

  const santriList = profiles.filter((p) => p.role === 'santri');

  // Unique groups
  const groups = Array.from(new Set(santriList.map((s) => s.group_name || 'Umum')));

  const filteredSantri = santriList.filter((s) => {
    if (filterGroup !== 'all' && s.group_name !== filterGroup) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(q) ||
        (s.student_number && s.student_number.toLowerCase().includes(q)) ||
        (s.group_name && s.group_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 via-[#D6A84F]/5 to-transparent rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#146B50] dark:text-[#D6A84F]">
            <Users className="w-4 h-4" />
            <span>Kesiswaan & Asrama</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Database Santri Asrama
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Kelola data kesiswaan santri, kamar asrama, nomor kontak, serta status aktif kehadiran.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingStudent(null);
            setIsModalOpen(true);
          }}
          className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] hover:from-[#198262] hover:to-[#0e4b39] text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/40"
        >
          <UserPlus className="w-4 h-4 text-[#D6A84F]" />
          <span>Tambah Santri Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari santri berdasarkan nama, NIS, atau kamar..."
            className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none text-stone-800 dark:text-stone-200"
          />
        </div>

        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="text-xs font-semibold p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
        >
          <option value="all">Semua Kamar Asrama</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* MOBILE FEED (Card Feed Khusus Layar HP < sm) */}
      <div className="sm:hidden space-y-3">
        {filteredSantri.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-400 text-xs">
            Tidak ada santri yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filteredSantri.map((s) => {
            const records = attendanceRecords.filter((r) => r.student_id === s.id);
            const hadirCount = records.filter((r) => r.status === 'hadir_valid').length;
            const percent =
              records.length > 0 ? Math.round((hadirCount / records.length) * 100) : 100;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#146B50] to-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
                      {s.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                        {s.full_name}
                      </h3>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="text-[11px] text-stone-400 font-mono">
                          NIS: {s.student_number}
                        </span>
                        {s.email && (
                          <span className="text-[10px] text-[#146B50] dark:text-[#D6A84F] font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {s.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      s.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {s.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Kamar Asrama</span>
                    <span className="font-bold text-[#146B50] dark:text-[#D6A84F] flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" />
                      {s.group_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Kontak Santri</span>
                    <span className="font-mono text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {s.phone || '-'}
                    </span>
                  </div>
                </div>

                {/* Attendance Rate Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-500">Tingkat Hadir:</span>
                    <span className="font-bold text-[#146B50] dark:text-emerald-400">{percent}%</span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#146B50] to-[#D6A84F] h-full rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(s);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200 transition active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#146B50]" />
                    <span>Edit Biodata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(s);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6A84F]/40 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                    title="Ubah Username & Password"
                  >
                    <Key className="w-3.5 h-3.5 text-[#D6A84F]" />
                    <span>Sandi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStudentStatus(s.id)}
                    className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                      s.is_active
                        ? 'border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={s.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE (Tablet & Laptop >= sm) */}
      <div className="hidden sm:block bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 bg-stone-50/60 dark:bg-stone-800/40">
                <th className="py-3.5 px-4 font-bold">Santri</th>
                <th className="py-3.5 px-4 font-bold">NIS</th>
                <th className="py-3.5 px-4 font-bold">Kamar / Kelompok</th>
                <th className="py-3.5 px-4 font-bold">Kontak</th>
                <th className="py-3.5 px-4 font-bold">Tingkat Hadir</th>
                <th className="py-3.5 px-4 font-bold">Status Akun</th>
                <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSantri.map((s) => {
                const records = attendanceRecords.filter((r) => r.student_id === s.id);
                const hadirCount = records.filter((r) => r.status === 'hadir_valid').length;
                const percent =
                  records.length > 0 ? Math.round((hadirCount / records.length) * 100) : 100;

                return (
                  <tr key={s.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#146B50] to-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold text-xs shadow-xs">
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 dark:text-stone-100 block">
                            {s.full_name}
                          </span>
                          {s.email && (
                            <span className="text-[10px] text-stone-400 font-mono block">
                              {s.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-600 dark:text-stone-400">
                      {s.student_number}
                    </td>
                    <td className="py-3.5 px-4 text-[#146B50] dark:text-[#D6A84F] font-semibold">
                      {s.group_name}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono">
                      {s.phone || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#146B50] to-[#D6A84F] h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-stone-800 dark:text-stone-200">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(s);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-[#146B50] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                          title="Edit Biodata & Password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(s);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                          title="Ubah Username & Password Login"
                        >
                          <Key className="w-3.5 h-3.5 text-[#D6A84F]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(s.id)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            s.is_active
                              ? 'border-stone-200 dark:border-stone-700 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={s.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStudent(null);
          }}
          onSave={(data) => {
            if (editingStudent) {
              updateStudent({
                ...editingStudent,
                ...data,
              });
            } else {
              addStudent({ ...data, role: 'santri' });
            }
            setIsModalOpen(false);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
}
