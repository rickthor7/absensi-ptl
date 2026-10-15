'use client';

import React, { useState, useEffect } from 'react';
import { Activity } from '@/types';
import { X, Calendar, Clock, MapPin, Save, AlertCircle, Locate, ExternalLink, RotateCcw } from 'lucide-react';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

interface ActivityModalProps {
  activity?: Activity | null;
  onClose: () => void;
  onSave: (data: Omit<Activity, 'id'>) => void;
}

export default function ActivityModal({ activity, onClose, onSave }: ActivityModalProps) {
  const [name, setName] = useState(activity?.name || '');
  const [code, setCode] = useState(activity?.code || '');
  const [startTime, setStartTime] = useState(activity?.start_time || '04:15');
  const [endTime, setEndTime] = useState(activity?.end_time || '05:15');
  const [crossesMidnight, setCrossesMidnight] = useState(activity?.crosses_midnight || false);
  const [activeDays, setActiveDays] = useState<number[]>(activity?.active_days || [1, 2, 3, 4, 5]);
  const [locationLat, setLocationLat] = useState<number>(
    activity?.location_lat ?? PONDOK_DEFAULT_COORDINATES.latitude
  );
  const [locationLng, setLocationLng] = useState<number>(
    activity?.location_lng ?? PONDOK_DEFAULT_COORDINATES.longitude
  );
  const [radiusM, setRadiusM] = useState(activity?.radius_m || 75);
  const [maxAccuracyM, setMaxAccuracyM] = useState(activity?.max_gps_accuracy_m || 100);
  const [lateAfterMinutes, setLateAfterMinutes] = useState(activity?.late_after_minutes || 10);
  const [description, setDescription] = useState(activity?.description || '');
  const [isActive, setIsActive] = useState(activity ? activity.is_active : true);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Sync state if activity prop changes
  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setCode(activity.code);
      setStartTime(activity.start_time);
      setEndTime(activity.end_time);
      setCrossesMidnight(activity.crosses_midnight);
      setActiveDays(activity.active_days);
      setLocationLat(activity.location_lat ?? PONDOK_DEFAULT_COORDINATES.latitude);
      setLocationLng(activity.location_lng ?? PONDOK_DEFAULT_COORDINATES.longitude);
      setRadiusM(activity.radius_m ?? 75);
      setMaxAccuracyM(activity.max_gps_accuracy_m ?? 100);
      setLateAfterMinutes(activity.late_after_minutes ?? 10);
      setDescription(activity.description || '');
      setIsActive(activity.is_active);
      setGpsAccuracy(null);
    }
  }, [activity]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const daysList = [
    { id: 1, label: 'Sen' },
    { id: 2, label: 'Sel' },
    { id: 3, label: 'Rab' },
    { id: 4, label: 'Kam' },
    { id: 5, label: 'Jum' },
    { id: 6, label: 'Sab' },
    { id: 7, label: 'Ahad' },
  ];

  const toggleDay = (dayId: number) => {
    setActiveDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleDetectCurrentGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('Browser Anda tidak mendukung deteksi Geolocation.');
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLat(Number(pos.coords.latitude.toFixed(7)));
        setLocationLng(Number(pos.coords.longitude.toFixed(7)));
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setIsDetecting(false);
      },
      (err) => {
        setIsDetecting(false);
        alert('Gagal mendeteksi lokasi GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || activeDays.length === 0) return;

    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      start_time: startTime,
      end_time: endTime,
      crosses_midnight: crossesMidnight,
      active_days: activeDays,
      location_lat: Number(locationLat),
      location_lng: Number(locationLng),
      radius_m: Number(radiusM),
      max_gps_accuracy_m: Number(maxAccuracyM),
      late_after_minutes: Number(lateAfterMinutes),
      description: description.trim(),
      is_active: isActive,
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0B3D2E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#D6A84F]" />
            <h3 className="font-bold text-base">
              {activity ? 'Konfigurasi Kegiatan & Jadwal' : 'Tambah Kegiatan Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Nama Kegiatan *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Shubuh Berjamaah"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Kode Kegiatan *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: SHUBUH"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none uppercase"
              />
            </div>
          </div>

          {/* Time and Midnight Crossing */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#146B50]">
              <Clock className="w-4 h-4 text-[#D6A84F]" />
              <span>Jendela Waktu Absensi (WIB)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Jam Mulai Buka</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Jam Selesai Tutup</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="crossesMidnight"
                checked={crossesMidnight}
                onChange={(e) => setCrossesMidnight(e.target.checked)}
                className="w-4 h-4 text-[#146B50] rounded border-stone-300 focus:ring-[#146B50]"
              />
              <label htmlFor="crossesMidnight" className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Jadwal Melewati Tengah Malam (misal Qiyamul Lail 23:30 - 02:00)
              </label>
            </div>
          </div>

          {/* Active Days */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
              Hari Aktif Pelaksanaan Kegiatan *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {daysList.map((d) => {
                const isSelected = activeDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#146B50] text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geofence & Radius Settings */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#146B50]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D6A84F]" />
                Titik Koordinat Geotag & Radius
              </span>
              {gpsAccuracy !== null && (
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                  GPS: ±{gpsAccuracy}m
                </span>
              )}
            </div>

            {/* GPS Detection Button */}
            <button
              type="button"
              disabled={isDetecting}
              onClick={handleDetectCurrentGPS}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#D6A84F] to-[#E8C36E] text-[#082F23] font-bold text-xs shadow-xs hover:brightness-105 active:scale-98 transition cursor-pointer"
            >
              <Locate className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Mendeteksi Lokasi...' : 'Ambil Titik Lokasi Saya Saat Ini (GPS)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  value={locationLat}
                  onChange={(e) => setLocationLat(parseFloat(e.target.value))}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  value={locationLng}
                  onChange={(e) => setLocationLng(parseFloat(e.target.value))}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <a
                href={`https://www.google.com/maps?q=${locationLat},${locationLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0D7B5F] dark:text-[#D6A84F] font-bold hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Lihat di Maps</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setLocationLat(PONDOK_DEFAULT_COORDINATES.latitude);
                  setLocationLng(PONDOK_DEFAULT_COORDINATES.longitude);
                  setGpsAccuracy(null);
                }}
                className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Bawaan Pondok</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <div>
                <label className="block text-[11px] text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                  Radius Validasi (Meter)
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={radiusM}
                  onChange={(e) => setRadiusM(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                  Maks. Akurasi GPS (Meter)
                </label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={maxAccuracyM}
                  onChange={(e) => setMaxAccuracyM(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Keterangan Kegiatan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi kegiatan santri..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#146B50] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#146B50] rounded border-stone-300 focus:ring-[#146B50]"
            />
            <label htmlFor="isActActive" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Kegiatan Aktif dalam Sistem
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#146B50] hover:bg-[#0B3D2E] text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
