'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';
import {
  X,
  MapPin,
  Locate,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Save,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GeotagLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_RADII = [50, 75, 100, 150, 200];

export default function GeotagLocationModal({ isOpen, onClose }: GeotagLocationModalProps) {
  const { activities, updateGeotagLocation } = useStore();

  // Initial reference: first activity or pondok default
  const referenceActivity = activities[0];
  const initialLat = referenceActivity ? referenceActivity.location_lat : PONDOK_DEFAULT_COORDINATES.latitude;
  const initialLng = referenceActivity ? referenceActivity.location_lng : PONDOK_DEFAULT_COORDINATES.longitude;
  const initialRadius = referenceActivity ? referenceActivity.radius_m : PONDOK_DEFAULT_COORDINATES.defaultRadiusMeters;

  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [radiusM, setRadiusM] = useState<number>(initialRadius);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [targetMode, setTargetMode] = useState<'all' | 'custom'>('all');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(
    activities.map((a) => a.id)
  );

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      const ref = activities[0];
      setLat(ref ? ref.location_lat : PONDOK_DEFAULT_COORDINATES.latitude);
      setLng(ref ? ref.location_lng : PONDOK_DEFAULT_COORDINATES.longitude);
      setRadiusM(ref ? ref.radius_m : 75);
      setTargetMode('all');
      setSelectedActivityIds(activities.map((a) => a.id));
      setAccuracy(null);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, activities]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time GPS detection
  const handleDetectGPS = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!('geolocation' in navigator)) {
      setErrorMsg('Browser Anda tidak mendukung deteksi lokasi Geolocation.');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = Number(position.coords.latitude.toFixed(7));
        const detectedLng = Number(position.coords.longitude.toFixed(7));
        const detectedAcc = Math.round(position.coords.accuracy);

        setLat(detectedLat);
        setLng(detectedLng);
        setAccuracy(detectedAcc);
        setIsDetecting(false);
        setSuccessMsg(`Titik GPS berhasil dikunci dengan akurasi ±${detectedAcc} meter!`);
      },
      (err) => {
        setIsDetecting(false);
        let msg = 'Gagal mendeteksi lokasi GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin akses lokasi ditolak. Harap izinkan akses lokasi pada browser/perangkat Anda.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Sinyal lokasi perangkat tidak tersedia atau GPS mati.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan sinyal GPS habis (timeout).';
        }
        setErrorMsg(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Reset to default Pondok
  const handleResetDefault = () => {
    setLat(PONDOK_DEFAULT_COORDINATES.latitude);
    setLng(PONDOK_DEFAULT_COORDINATES.longitude);
    setRadiusM(PONDOK_DEFAULT_COORDINATES.defaultRadiusMeters);
    setAccuracy(null);
    setSuccessMsg('Koordinat telah direset ke titik bawaan Pondok Pesantren Nurul Falah.');
    setErrorMsg(null);
  };

  // Toggle activity checkbox
  const toggleActivity = (id: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isNaN(lat) || isNaN(lng)) {
      setErrorMsg('Koordinat Latitude dan Longitude harus berupa angka yang valid.');
      return;
    }

    if (targetMode === 'custom' && selectedActivityIds.length === 0) {
      setErrorMsg('Pilih minimal 1 kegiatan yang ingin diperbarui titik lokasinya.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateGeotagLocation({
        latitude: lat,
        longitude: lng,
        radiusM: Number(radiusM),
        activityIds: targetMode === 'all' ? undefined : selectedActivityIds,
      });

      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui titik lokasi geotag.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-[#1C3A2E] overflow-hidden my-8 animate-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07241B] via-[#0B3D2E] to-[#146B50] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#D6A84F]/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D6A84F]/40 flex items-center justify-center text-[#D6A84F] shadow-sm">
              <Crosshair className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Perbarui Titik Geotag Presensi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D6A84F]/20 text-[#D6A84F] border border-[#D6A84F]/30">
                  GPS
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                Kalibrasi lokasi pusat absensi pondok dengan koordinat GPS real-time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action 1: GPS Capture Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-[#D4A24C]/10 dark:from-[#162B22] dark:to-[#0B3D2E]/40 border border-emerald-200 dark:border-[#1C3A2E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D7B5F] dark:text-[#D6A84F] flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#0D7B5F] dark:text-[#D6A84F]" />
                <span>Sensor GPS Perangkat Musyrif</span>
              </span>
              {accuracy !== null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                  Akurasi: ±{accuracy}m
                </span>
              )}
            </div>

            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              Jika Anda sedang berada langsung di lokasi pondok/masjid presensi, klik tombol di bawah untuk mengunci titik koordinat GPS terkini secara presisi.
            </p>

            <button
              type="button"
              disabled={isDetecting}
              onClick={handleDetectGPS}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D6A84F] via-[#E8C36E] to-[#D6A84F] hover:brightness-105 text-[#082F23] font-extrabold text-xs transition shadow-md active:scale-98 cursor-pointer disabled:opacity-60"
            >
              <Locate className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Mendeteksi Sinyal GPS...' : 'Ambil Titik Lokasi Saya Saat Ini (GPS)'}</span>
            </button>
          </div>

          {/* Coordinate Fields */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Koordinat Geografis (Latitude & Longitude)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Garis Lintang (Latitude) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Garis Bujur (Longitude) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#0D7B5F]/30 focus:border-[#0D7B5F] outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions for Maps & Default */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0D7B5F] dark:text-[#D6A84F] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Verifikasi di Google Maps</span>
              </a>

              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Titik Bawaan Pondok</span>
              </button>
            </div>
          </div>

          {/* Section: Radius Geofence */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-[#1C3A2E]">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-stone-800 dark:text-stone-200">
                Radius Toleransi Geofence (Meter)
              </label>
              <span className="font-mono font-bold text-[#0D7B5F] dark:text-[#D6A84F] text-xs">
                {radiusM} Meter
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_RADII.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusM(r)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer font-bold ${
                    radiusM === r
                      ? 'bg-[#0D7B5F] text-white border-[#0D7B5F]'
                      : 'bg-stone-50 dark:bg-[#162B22] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#1C3A2E] hover:border-[#0D7B5F]/50'
                  }`}
                >
                  {r}m {r === 75 ? '(Bawaan)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Target Kegiatan */}
          <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-[#1C3A2E]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Terapkan Pada Kegiatan
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-stone-50 dark:bg-[#162B22]/50 cursor-pointer">
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'all'}
                  onChange={() => setTargetMode('all')}
                  className="w-4 h-4 text-[#0D7B5F] focus:ring-[#0D7B5F]"
                />
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Semua Kegiatan Pondok ({activities.length} Kegiatan)
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">
                    Rekomendasi: Seluruh sesi presensi santri akan menggunakan titik baru ini
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-stone-50 dark:bg-[#162B22]/50 cursor-pointer">
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'custom'}
                  onChange={() => setTargetMode('custom')}
                  className="w-4 h-4 text-[#0D7B5F] focus:ring-[#0D7B5F]"
                />
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Pilih Kegiatan Tertentu
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">
                    Terapkan koordinat baru hanya untuk kegiatan spesifik yang dipilih
                  </span>
                </div>
              </label>

              {targetMode === 'custom' && (
                <div className="p-3 rounded-2xl border border-stone-200 dark:border-[#1C3A2E] bg-white dark:bg-[#162B22] space-y-2 animate-in fade-in">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                    Centang kegiatan target:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activities.map((act) => (
                      <label
                        key={act.id}
                        className="flex items-center gap-2 text-xs text-stone-800 dark:text-stone-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedActivityIds.includes(act.id)}
                          onChange={() => toggleActivity(act.id)}
                          className="w-3.5 h-3.5 text-[#0D7B5F] rounded border-stone-300"
                        />
                        <span className="truncate">{act.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-[#1C3A2E]">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0D7B5F] via-[#096B52] to-[#082F23] hover:from-[#096B52] hover:to-[#051A13] text-white font-bold transition shadow-md active:scale-95 cursor-pointer border border-[#D6A84F]/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D6A84F]" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan & Terapkan Titik Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
