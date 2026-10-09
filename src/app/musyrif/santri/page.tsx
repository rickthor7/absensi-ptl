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
} from 'lucide-react';

export default function MusyrifSantriPage() {
  const { profiles, attendanceRecords, addStudent, updateStudent, toggleStudentStatus } =
    useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);

  const santriList = profiles.filter((p) => p.role === 'santri');

  // Groups list
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <Users className="w-4 h-4 text-[#D6A84F]" />
            <span>Manajemen Kesiswaan</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Database Santri Asrama
          </h1>
          <p className="text-xs text-stone-500">
            Kelola data santri, kamar asrama, status aktif, dan persentase kehadiran
          </p>
        </div>

        <button
          onClick={() => {
            setEditingStudent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer border border-[#D6A84F]/40"
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
            className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
          />
        </div>

        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="text-xs font-medium p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
        >
          <option value="all">Semua Kamar Asrama</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Santri Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 bg-stone-50/50 dark:bg-stone-800/30">
                <th className="py-3 px-4 font-bold">Santri</th>
                <th className="py-3 px-4 font-bold">NIS</th>
                <th className="py-3 px-4 font-bold">Kamar / Kelompok</th>
                <th className="py-3 px-4 font-bold">Kontak</th>
                <th className="py-3 px-4 font-bold">Tingkat Hadir</th>
                <th className="py-3 px-4 font-bold">Status Akun</th>
                <th className="py-3 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSantri.map((s) => {
                const records = attendanceRecords.filter((r) => r.student_id === s.id);
                const hadirCount = records.filter((r) => r.status === 'hadir_valid').length;
                const percent =
                  records.length > 0 ? Math.round((hadirCount / records.length) * 100) : 100;

                return (
                  <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0B3D2E] text-[#D6A84F] flex items-center justify-center font-bold text-xs">
                          {s.full_name.charAt(0)}
                        </div>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {s.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-600 dark:text-stone-400">
                      {s.student_number}
                    </td>
                    <td className="py-3.5 px-4 text-[#146B50] font-semibold">
                      {s.group_name}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono">
                      {s.phone || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#146B50] h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px]">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStudent(s);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-[#146B50] hover:bg-emerald-50 transition cursor-pointer"
                          title="Edit Santri"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleStudentStatus(s.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            s.is_active
                              ? 'border-stone-200 text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
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
