'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Activity } from '@/types';
import ActivityModal from '@/components/schedule/ActivityModal';
import GeotagLocationModal from '@/components/schedule/GeotagLocationModal';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Locate,
  Crosshair,
  ExternalLink,
  Radio,
} from 'lucide-react';

export default function MusyrifKegiatanPage() {
  const { activities, addActivity, updateActivity } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isGeotagModalOpen, setIsGeotagModalOpen] = useState(false);

  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

  // Current active reference coordinates
  const refActivity = activities[0];
  const currentLat = refActivity ? refActivity.location_lat : PONDOK_DEFAULT_COORDINATES.latitude;
  const currentLng = refActivity ? refActivity.location_lng : PONDOK_DEFAULT_COORDINATES.longitude;
  const currentRadius = refActivity ? refActivity.radius_m : 75;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <Calendar className="w-4 h-4 text-[#D6A84F]" />
            <span>Manajemen Jadwal Kegiatan & Lokasi</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Kegiatan, Jadwal & Radius Geofence
          </h1>
          <p className="text-xs text-stone-500">
            Atur jam buka/tutup, hari pelaksanaan, dan perbarui koordinat geotag lokasi presensi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsGeotagModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#D6A84F] to-[#E8C36E] text-[#082F23] text-xs font-extrabold transition shadow-md hover:brightness-105 cursor-pointer active:scale-95"
          >
            <Crosshair className="w-4 h-4" />
            <span>Perbarui Titik Geotag (GPS)</span>
          </button>

          <button
            onClick={() => {
              setEditingActivity(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer border border-[#D6A84F]/40"
          >
            <Plus className="w-4 h-4 text-[#D6A84F]" />
            <span>Tambah Kegiatan</span>
          </button>
        </div>
      </div>

      {/* Geotag GPS Calibration Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] p-5 sm:p-6 text-white shadow-xl border border-[#D6A84F]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6A84F]/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-[11px] font-bold text-[#D6A84F] border border-[#D6A84F]/30 backdrop-blur-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#D6A84F]" />
              <span>Titik Pusat Presensi Santri (Aktif)</span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {PONDOK_DEFAULT_COORDINATES.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/90 font-mono">
              <span className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                Lat: {currentLat.toFixed(6)}
              </span>
              <span className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                Lng: {currentLng.toFixed(6)}
              </span>
              <span className="bg-[#D6A84F]/20 text-[#D6A84F] px-2.5 py-1 rounded-lg border border-[#D6A84F]/30 font-sans font-bold">
                Radius: {currentRadius}m
              </span>
            </div>

            <p className="text-xs text-emerald-100/70 pt-0.5">
              Seluruh presensi santri divalidasi berdasarkan titik ini. Musyrif dapat memperbarui titik lokasi kapan pun dengan GPS perangkat secara instan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => setIsGeotagModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D6A84F] via-[#F3D78A] to-[#D6A84F] hover:brightness-105 text-[#082F23] text-xs font-black transition shadow-lg shadow-black/30 active:scale-95 cursor-pointer"
            >
              <Locate className="w-4 h-4" />
              <span>Kalibrasi Titik GPS Sekarang</span>
            </button>

            <a
              href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 backdrop-blur-xs cursor-pointer text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D6A84F]" />
              <span>Buka di Google Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="bg-white dark:bg-[#0F1E18] p-5 rounded-3xl border border-stone-200/90 dark:border-[#1C3A2E] shadow-xs hover:border-[#0D7B5F] transition flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100 dark:border-[#1C3A2E]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                      {act.name}
                    </h3>
                    <span className="font-mono text-[10px] bg-stone-100 dark:bg-[#162B22] px-2 py-0.5 rounded-md text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-[#1C3A2E] font-bold">
                      {act.code}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{act.description}</p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    act.is_active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {act.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <Clock className="w-4 h-4 text-[#0D7B5F] dark:text-[#D6A84F] shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">Jendela Absensi</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {act.start_time} - {act.end_time} WIB
                    </span>
                    {act.crosses_midnight && (
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        *Lintas Tengah Malam
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <MapPin className="w-4 h-4 text-[#D6A84F] shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">Radius Validasi</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{act.radius_m} meter</span>
                    <span className="block text-[10px] text-stone-500 dark:text-stone-400">
                      Toleransi GPS: ±{act.max_gps_accuracy_m}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Geotag Coordinate Info */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                <span>Geotag: {act.location_lat.toFixed(6)}, {act.location_lng.toFixed(6)}</span>
                <a
                  href={`https://www.google.com/maps?q=${act.location_lat},${act.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0D7B5F] dark:text-[#D6A84F] hover:underline font-sans font-bold inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Maps</span>
                </a>
              </div>

              {/* Active Days Pills */}
              <div className="pt-2">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1 font-semibold">Hari Pelaksanaan:</span>
                <div className="flex flex-wrap gap-1">
                  {act.active_days.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 font-semibold"
                    >
                      {dayNames[d]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-[#1C3A2E] flex justify-end">
              <button
                onClick={() => {
                  setEditingActivity(act);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:text-[#0D7B5F] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#0D7B5F]" />
                <span>Ubah Jadwal & Radius</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Geotag GPS Calibration Modal */}
      <GeotagLocationModal
        isOpen={isGeotagModalOpen}
        onClose={() => setIsGeotagModalOpen(false)}
      />

      {/* Activity Modal */}
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
