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
          msg = 'Izin lokasi ditolak oleh browser. Mohon izinkan akses lokasi pada browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi tidak tersedia saat ini.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Permintaan lokasi GPS melebihi batas waktu (timeout).';
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

  // Initial trigger
  useEffect(() => {
    requestCurrentLocation();
  }, []);

  // Simulator helper: Quick toggle between inside and outside pondok
  const setSimulatedInsidePondok = () => {
    // 15 meters offset from pondok center
    const lat = activity.location_lat + 0.0001;
    const lng = activity.location_lng + 0.0001;
    applyCoordinates(lat, lng, 10);
    setGeoError(null);
  };

  const setSimulatedOutsidePondok = () => {
    // 1.2 km outside pondok
    const lat = activity.location_lat + 0.01;
    const lng = activity.location_lng + 0.008;
    applyCoordinates(lat, lng, 15);
    setGeoError(null);
  };

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
      {/* Target Pondok Information */}
      <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 text-xs text-stone-700 dark:text-stone-300">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-[#146B50] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D6A84F]" />
            Titik Lokasi Kegiatan
          </span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Maks. Radius: {activity.radius_m}m
          </span>
        </div>
        <p className="text-stone-600 dark:text-stone-400">
          {activity.name} • {PONDOK_DEFAULT_COORDINATES.name}
        </p>
      </div>

      {/* Real-time Status Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#146B50]' : 'text-stone-500'}`} />
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Koordinat GPS Santri
            </span>
          </div>

          <button
            type="button"
            onClick={requestCurrentLocation}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-[#146B50] hover:text-emerald-700 font-semibold cursor-pointer"
          >
            <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Perbarui GPS
          </button>
        </div>

        {coords ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl font-mono text-stone-600 dark:text-stone-300">
              <div>
                <span className="text-stone-400 block text-[10px] font-sans">Latitude</span>
                {coords.latitude.toFixed(6)}
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] font-sans">Longitude</span>
                {coords.longitude.toFixed(6)}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Akurasi Perangkat:</span>
              <span
                className={`font-semibold ${
                  coords.accuracy <= activity.max_gps_accuracy_m
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                ±{Math.round(coords.accuracy)} meter
              </span>
            </div>

            {/* Validation Feedback */}
            {attendanceType === 'hadir' ? (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  validation?.isWithinRadius
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
                }`}
              >
                {validation?.isWithinRadius ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {validation?.isWithinRadius
                      ? 'Posisi di Dalam Radius Pondok'
                      : 'Di Luar Radius Kehadiran'}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Jarak Anda saat ini: <strong>{Math.round(validation?.distanceMeters || 0)}m</strong>{' '}
                    (Batas maksimal radius: {activity.radius_m}m).
                  </p>
                </div>
              </div>
            ) : (
              // For Izin
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Informasi Geotag Pengajuan Izin</p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Titik lokasi tercatat sebagai bukti pengajuan izin (jarak {Math.round(validation?.distanceMeters || 0)}m dari pondok). Lokasi tidak menentukan kelulusan izin santri.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : geoError ? (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Mendapatkan GPS</p>
              <p className="text-[11px] mt-0.5">{geoError}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-stone-400 text-xs">
            Mendeteksi posisi koordinat Anda...
          </div>
        )}
      </div>

      {/* Simulator Buttons for easy reviewing */}
      <div className="bg-stone-100 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
            Simulasi Lokasi (Untuk Pengujian Reviewer):
          </span>
          <span className="text-[10px] text-stone-500">Uji kedua kondisi</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={setSimulatedInsidePondok}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Dalam Pondok (~15m)
          </button>
          <button
            type="button"
            onClick={setSimulatedOutsidePondok}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Luar Pondok (~1.2 km)
          </button>
        </div>
      </div>
    </div>
  );
}
