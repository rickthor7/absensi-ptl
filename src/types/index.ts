export type Role = 'santri' | 'musyrif' | 'admin';

export type AttendanceType = 'hadir' | 'izin';

export type AttendanceStatus =
  | 'hadir_valid'
  | 'izin_diajukan'
  | 'izin_disetujui'
  | 'izin_ditolak'
  | 'perlu_tinjauan'
  | 'ditolak_lokasi'
  | 'belum_absen';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  student_number?: string; // NIS
  group_name?: string; // Kamar / Kelompok
  is_active: boolean;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  active_days: number[]; // 1=Senin, 2=Selasa, ..., 7=Minggu
  start_time: string; // HH:mm format e.g. "04:15"
  end_time: string; // HH:mm format e.g. "05:15"
  crosses_midnight: boolean;
  location_lat: number;
  location_lng: number;
  radius_m: number;
  max_gps_accuracy_m: number;
  late_after_minutes?: number;
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_number?: string;
  group_name?: string;
  activity_id: string;
  activity_name: string;
  operational_date: string; // YYYY-MM-DD
  attendance_type: AttendanceType;
  status: AttendanceStatus;
  photo_path: string; // Base64 data URL or storage path
  latitude: number;
  longitude: number;
  gps_accuracy_m: number;
  location_captured_at: string;
  distance_from_site_m: number;
  submitted_at: string;
  permission_reason?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_note?: string;
  audit_corrections?: {
    original_status: AttendanceStatus;
    corrected_status: AttendanceStatus;
    reason: string;
    corrected_by: string;
    corrected_at: string;
  }[];
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  reason?: string;
  created_at: string;
}
