/**
 * Geolocation & Geodesic utilities
 * Implements Haversine distance formula as specified in prd.md and arsitektur.md
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates geodesic distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

export interface GeolocationValidationResult {
  isWithinRadius: boolean;
  isAccuracyAcceptable: boolean;
  distanceMeters: number;
  accuracyMeters: number;
  message: string;
}

export function validateAttendanceLocation(
  studentCoord: Coordinates,
  activityCoord: Coordinates,
  radiusMeters: number,
  maxAccuracyMeters: number,
  accuracyMeters: number
): GeolocationValidationResult {
  const distance = calculateHaversineDistance(studentCoord, activityCoord);
  const isAccuracyAcceptable = accuracyMeters <= maxAccuracyMeters;
  const isWithinRadius = distance <= radiusMeters;

  let message = '';
  if (!isAccuracyAcceptable) {
    message = `Akurasi GPS kurang memadai (±${Math.round(
      accuracyMeters
    )}m, maksimal ±${maxAccuracyMeters}m). Harap aktifkan GPS presisi tinggi atau pindah ke area terbuka.`;
  } else if (!isWithinRadius) {
    message = `Posisi Anda (${Math.round(
      distance
    )}m) berada di luar radius pondok yang diizinkan (${radiusMeters}m).`;
  } else {
    message = `Lokasi terverifikasi di area pondok. Jarak ${Math.round(
      distance
    )}m (radius: ${radiusMeters}m).`;
  }

  return {
    isWithinRadius,
    isAccuracyAcceptable,
    distanceMeters: distance,
    accuracyMeters,
    message,
  };
}
