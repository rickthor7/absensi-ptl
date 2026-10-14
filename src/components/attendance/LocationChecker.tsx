'use client';

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Info,
  ShieldAlert,
  Radio,
  Compass,
} from 'lucide-react';
import { Activity, AttendanceType } from '@/types';
import { calculateHaversineDistance, validateAttendanceLocation } from '@/lib/geo';
import { PONDOK_DEFAULT_COORDINATES } from '@/lib/constants';

interface LocationCheckerProps {
  activity: Activity;
  attendanceType: AttendanceType;
  onLocationVerified: (coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceMeters: number;
    isPass: boolean;
  }) => void;
}

export default function LocationChecker({
  activity,
  attendanceType,
  onLocationVerified,
}: LocationCheckerProps) {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Request actual device GPS
  const requestCurrentLocation = () => {
    setIsLoading(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Perangkat atau browser tidak mendukung fitur Geolocation.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const userAcc = position.coords.accuracy || 15;

        applyCoordinates(userLat, userLng, userAcc);
        setIsLoading(false);
      },
      (error) => {
        let msg = 'Gagal membaca koordinat GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak oleh browser. Mohon izinkan akses lokasi pada browser perangkat Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi satelit GPS tidak tersedia saat ini.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Permintaan sinyal GPS melebihi batas waktu (timeout).';
        }
        setGeoError(msg);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const applyCoordinates = (lat: number, lng: number, acc: number) => {
    setCoords({ latitude: lat, longitude: lng, accuracy: acc });

    const distance = calculateHaversineDistance(
      { latitude: lat, longitude: lng },
      { latitude: activity.location_lat, longitude: activity.location_lng }
    );

    const isPass =
      attendanceType === 'izin'
        ? true
        : distance <= activity.radius_m && acc <= activity.max_gps_accuracy_m;

    onLocationVerified({
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      distanceMeters: distance,
      isPass,
    });
  };

  useEffect(() => {
    requestCurrentLocation();
  }, []);

  const validation = coords
    ? validateAttendanceLocation(
        { latitude: coords.latitude, longitude: coords.longitude },
        { latitude: activity.location_lat, longitude: activity.location_lng },
        activity.radius_m,
        activity.max_gps_accuracy_m,
        coords.accuracy
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Target Pondok Card with Visual Mini Radar Map Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B3D2E] to-[#146B50] p-4 text-white shadow-md border border-[#D6A84F]/30">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D6A84F] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#D6A84F]" />
              Titik Presensi Geotag
            </span>
            <h4 className="text-sm font-bold">{PONDOK_DEFAULT_COORDINATES.name}</h4>
            <p className="text-[11px] text-emerald-100/80 line-clamp-1">
              {PONDOK_DEFAULT_COORDINATES.address}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-emerald-200 block font-medium">Batas Maksimal</span>
            <span className="text-base font-extrabold text-[#D6A84F]">{activity.radius_m} Meter</span>
          </div>
        </div>

        {/* Decorative radar circles in background */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full border border-white/5 pointer-events-none" />
      </div>

      {/* Real-time GPS Detection Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-[#146B50]">
              <Compass className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#D6A84F]' : ''}`} />
            </div>
            <div>
              <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Deteksi Posisi Real-Time
              </h5>
              <p className="text-[10px] text-stone-400">Satelit GPS ponsel Anda</p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestCurrentLocation}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 hover:text-[#146B50] font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#146B50]' : ''}`} />
            <span>{isLoading ? 'Mencari...' : 'Perbarui'}</span>
          </button>
        </div>

        {coords ? (
          <div className="space-y-3.5">
            {/* Coordinates Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800/60 font-mono">
              <div>
                <span className="text-stone-400 block text-[10px] font-sans font-medium">Latitude</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{coords.latitude.toFixed(6)}°</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] font-sans font-medium">Longitude</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{coords.longitude.toFixed(6)}°</span>
              </div>
            </div>

            {/* Distance & Accuracy Meter */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-stone-500">Akurasi Sinyal GPS:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                  coords.accuracy <= activity.max_gps_accuracy_m
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                ±{Math.round(coords.accuracy)} meter
              </span>
            </div>

            {/* Geofence Status Callout */}
            {attendanceType === 'hadir' ? (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition ${
                  validation?.isWithinRadius
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                }`}
              >
                {validation?.isWithinRadius ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-700">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-xs">
                    {validation?.isWithinRadius
                      ? 'Posisi Valid di Dalam Area Pondok'
                      : 'Posisi di Luar Radius Kehadiran'}
                  </p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    Jarak Anda: <strong>{Math.round(validation?.distanceMeters || 0)}m</strong> dari titik pusat. Batas toleransi radius: <strong>{activity.radius_m}m</strong>.
                  </p>
                </div>
              </div>
            ) : (
              // For Izin
              <div className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 text-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0 text-sky-700">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-xs">Geotag Lokasi Izin Tercatat</p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    Lokasi ini ({Math.round(validation?.distanceMeters || 0)}m dari pondok) akan dilampirkan sebagai verifikasi data pendukung untuk musyrif.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : geoError ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Izin GPS Belum Diberikan</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">{geoError}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-stone-400 text-xs space-y-2">
            <Radio className="w-6 h-6 animate-pulse mx-auto text-[#146B50]" />
            <p>Mencari koordinat satelit GPS perangkat Anda...</p>
          </div>
        )}
      </div>
    </div>
  );
}
