-- Migration: 20261009000001_initial_schema.sql
-- Sistem Absensi Santri Berbasis Selfie dan Geotag
-- Architecture & PRD compliant schema with RLS and Audit Trail

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUMS & DOMAINS
CREATE TYPE user_role AS ENUM ('santri', 'musyrif', 'admin');
CREATE TYPE attendance_type AS ENUM ('hadir', 'izin');
CREATE TYPE attendance_status AS ENUM (
  'hadir_valid',
  'izin_diajukan',
  'izin_disetujui',
  'izin_ditolak',
  'perlu_tinjauan',
  'ditolak_lokasi',
  'belum_absen'
);
CREATE TYPE session_status AS ENUM ('scheduled', 'open', 'closed');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'santri',
  student_number TEXT UNIQUE NULL, -- NIS
  group_name TEXT NULL, -- Kamar / Asrama / Kelompok
  phone TEXT NULL,
  avatar_url TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  active_days INT[] NOT NULL, -- 1=Senin ... 7=Minggu
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  crosses_midnight BOOLEAN NOT NULL DEFAULT false,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 75,
  max_gps_accuracy_m INTEGER NOT NULL DEFAULT 100,
  late_after_minutes INTEGER NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  operational_date DATE NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  status session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_session_activity_date UNIQUE (activity_id, operational_date)
);

-- 6. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_type attendance_type NOT NULL,
  status attendance_status NOT NULL,
  photo_path TEXT NOT NULL, -- Storage bucket path
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  gps_accuracy_m DOUBLE PRECISION NULL,
  location_captured_at TIMESTAMPTZ NULL,
  distance_from_site_m DOUBLE PRECISION NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  permission_reason TEXT NULL,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ NULL,
  review_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_attendance_session_student UNIQUE (session_id, student_id)
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  before_data JSONB NULL,
  after_data JSONB NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. INDEXES FOR HIGH QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_activity_date ON public.attendance_sessions(activity_id, operational_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.current_user_role() IN ('musyrif', 'admin'));

CREATE POLICY "Musyrif and Admin can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.current_user_role() IN ('musyrif', 'admin'));

-- Activities Policies
CREATE POLICY "Everyone authenticated can view active activities"
  ON public.activities FOR SELECT
  USING (true);

CREATE POLICY "Only Musyrif and Admin can manage activities"
  ON public.activities FOR ALL
  USING (public.current_user_role() IN ('musyrif', 'admin'));

-- Attendance Sessions Policies
CREATE POLICY "Everyone authenticated can view sessions"
  ON public.attendance_sessions FOR SELECT
  USING (true);

-- Attendance Records Policies
CREATE POLICY "Santri can view only their own records"
  ON public.attendance_records FOR SELECT
  USING (
    auth.uid() = student_id OR
    public.current_user_role() IN ('musyrif', 'admin')
  );

CREATE POLICY "Santri can insert their own record"
  ON public.attendance_records FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    public.current_user_role() = 'santri'
  );

CREATE POLICY "Musyrif and Admin can update attendance records (correction/review)"
  ON public.attendance_records FOR UPDATE
  USING (public.current_user_role() IN ('musyrif', 'admin'));

-- Audit Logs Policies
CREATE POLICY "Only Musyrif and Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.current_user_role() IN ('musyrif', 'admin'));

CREATE POLICY "System and Musyrif can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.current_user_role() IN ('musyrif', 'admin'));
