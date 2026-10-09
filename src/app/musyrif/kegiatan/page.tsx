'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Activity } from '@/types';
import ActivityModal from '@/components/schedule/ActivityModal';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function MusyrifKegiatanPage() {
  const { activities, addActivity, updateActivity } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <Calendar className="w-4 h-4 text-[#D6A84F]" />
            <span>Manajemen Jadwal Kegiatan</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Kegiatan, Jadwal & Radius Geofence
          </h1>
          <p className="text-xs text-stone-500">
            Atur jam buka/tutup, hari pelaksanaan, radius batas lokasi, dan kegiatan lintas tengah malam
          </p>
        </div>

        <button
          onClick={() => {
            setEditingActivity(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer border border-[#D6A84F]/40"
        >
          <Plus className="w-4 h-4 text-[#D6A84F]" />
          <span>Tambah Kegiatan</span>
        </button>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs hover:border-[#146B50] transition flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                      {act.name}
                    </h3>
                    <span className="font-mono text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-bold">
                      {act.code}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{act.description}</p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    act.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {act.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <Clock className="w-4 h-4 text-[#146B50] shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">Jendela Absensi</span>
                    <span className="font-bold">
                      {act.start_time} - {act.end_time} WIB
                    </span>
                    {act.crosses_midnight && (
                      <span className="block text-[10px] text-amber-600 font-medium">
                        *Lintas Tengah Malam
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <MapPin className="w-4 h-4 text-[#D6A84F] shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">Radius Validasi</span>
                    <span className="font-bold">{act.radius_m} meter</span>
                    <span className="block text-[10px] text-stone-400">
                      Toleransi GPS: ±{act.max_gps_accuracy_m}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Days Pills */}
              <div className="pt-2">
                <span className="text-[10px] text-stone-400 block mb-1">Hari Pelaksanaan:</span>
                <div className="flex flex-wrap gap-1">
                  {act.active_days.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold"
                    >
                      {dayNames[d]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => {
                  setEditingActivity(act);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:text-[#146B50] hover:bg-emerald-50 text-xs font-bold transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Jadwal & Radius</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ActivityModal
          activity={editingActivity}
          onClose={() => {
            setIsModalOpen(false);
            setEditingActivity(null);
          }}
          onSave={(data) => {
            if (editingActivity) {
              updateActivity({
                ...editingActivity,
                ...data,
              });
            } else {
              addActivity(data);
            }
            setIsModalOpen(false);
            setEditingActivity(null);
          }}
        />
      )}
    </div>
  );
}
