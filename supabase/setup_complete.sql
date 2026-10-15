-- ==============================================================================
-- SETUP COMPLETE DATABASE ABSENSI SANTRI (REAL PRODUCTION READY)
-- Pondok Pesantren Nurul Falah, Ketintang Surabaya
-- ==============================================================================
-- Petunjuk Eksekusi:
-- 1. Buka Supabase SQL Editor: https://supabase.com/dashboard/project/tzwtncikrblqynupkjng/sql/new
-- 2. Paste seluruh isi script ini ke dalam SQL Editor
-- 3. Klik tombol "RUN" (atau tekan Ctrl + Enter)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('santri', 'musyrif', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_type AS ENUM ('hadir', 'izin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'hadir_valid',
    'izin_diajukan',
    'izin_disetujui',
    'izin_ditolak',
    'perlu_tinjauan',
    'ditolak_lokasi',
    'belum_absen'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('scheduled', 'open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. HAPUS TRIGGER, FUNGSI, & KEBIJAKAN RLS LAMA SECARA BERSIH
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;

-- Hapus seluruh policy RLS lama pada schema public agar tidak mengunci perubahan tipe kolom
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Lepas seluruh foreign key lama agar tidak menghambat perubahan tipe data ke TEXT
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey;
ALTER TABLE IF EXISTS public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;
ALTER TABLE IF EXISTS public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_reviewed_by_fkey;
ALTER TABLE IF EXISTS public.attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_activity_id_fkey;
ALTER TABLE IF EXISTS public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE IF EXISTS public.activities DROP CONSTRAINT IF EXISTS activities_created_by_fkey;

-- 4. TABEL PROFILES (Akun Santri & Musyrif)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT 'password123',
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

ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'password123';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 5. TABEL ACTIVITIES (Jadwal Kegiatan Pondok)
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
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
  created_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE IF EXISTS public.activities ALTER COLUMN id TYPE TEXT;

-- 6. TABEL ATTENDANCE SESSIONS (Sesi Presensi per Tanggal)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  operational_date DATE NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  status session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_session_activity_date UNIQUE (activity_id, operational_date)
);

ALTER TABLE IF EXISTS public.attendance_sessions ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.attendance_sessions ALTER COLUMN activity_id TYPE TEXT;

-- 7. TABEL ATTENDANCE RECORDS (Rekam Presensi Real Geotag & Foto)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  attendance_type attendance_type NOT NULL,
  status attendance_status NOT NULL,
  photo_path TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  gps_accuracy_m DOUBLE PRECISION NULL,
  location_captured_at TIMESTAMPTZ NULL,
  distance_from_site_m DOUBLE PRECISION NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  permission_reason TEXT NULL,
  reviewed_by TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  review_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE IF EXISTS public.attendance_records ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.attendance_records ALTER COLUMN session_id TYPE TEXT;
ALTER TABLE IF EXISTS public.attendance_records ALTER COLUMN student_id TYPE TEXT;
ALTER TABLE IF EXISTS public.attendance_records ALTER COLUMN reviewed_by TYPE TEXT;

-- 8. TABEL AUDIT LOGS (Riwayat Koreksi Musyrif)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_data JSONB NULL,
  after_data JSONB NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN actor_id TYPE TEXT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN entity_id TYPE TEXT;

-- 9. INDEKS EFISIENSI QUERY
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_activity_date ON public.attendance_sessions(activity_id, operational_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);

-- 10. KEBIJAKAN RLS BARU (Full Permissive untuk Aplikasi)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all attendance" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all audit" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 11. STORAGE BUCKET FOTO PRESENSI
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access attendance-photos" ON storage.objects;
CREATE POLICY "Public Access attendance-photos" ON storage.objects FOR ALL USING (bucket_id = 'attendance-photos') WITH CHECK (bucket_id = 'attendance-photos');

-- 12. SEED DATA AKUN RESMI SANTRI & MUSYRIF PONDOK
DELETE FROM public.profiles;

INSERT INTO public.profiles (id, email, password_hash, full_name, role, student_number, group_name, phone, is_active)
VALUES
  -- Kamar Al-Fatih 01
  ('usr-santri-1', 'fauzi@santri.nurulfalah.ac.id', 'password123', 'Ahmad Fauzi Rahman', 'santri', 'STR-2026-042', 'Kamar Al-Fatih 01', '0812-3456-7890', true),
  ('usr-santri-2', 'rizky@santri.nurulfalah.ac.id', 'password123', 'Muhammad Rizky Pratama', 'santri', 'STR-2026-043', 'Kamar Al-Fatih 01', '0813-8822-1100', true),
  ('usr-santri-6', 'hanif@santri.nurulfalah.ac.id', 'password123', 'Hanif Arsyad Robbani', 'santri', 'STR-2026-047', 'Kamar Al-Fatih 01', '0812-7711-2233', true),
  ('usr-santri-7', 'daffa@santri.nurulfalah.ac.id', 'password123', 'Daffa Pratama Kusuma', 'santri', 'STR-2026-048', 'Kamar Al-Fatih 01', '0813-9944-5566', true),

  -- Kamar Shalahuddin 02
  ('usr-santri-3', 'umar@santri.nurulfalah.ac.id', 'password123', 'Umar Al-Faruq', 'santri', 'STR-2026-044', 'Kamar Shalahuddin 02', '0857-9911-3322', true),
  ('usr-santri-4', 'bilal@santri.nurulfalah.ac.id', 'password123', 'Bilal Habasyi', 'santri', 'STR-2026-045', 'Kamar Shalahuddin 02', '0819-2233-4455', true),
  ('usr-santri-8', 'salman@santri.nurulfalah.ac.id', 'password123', 'Salman Al-Farisi', 'santri', 'STR-2026-049', 'Kamar Shalahuddin 02', '0852-3344-5566', true),
  ('usr-santri-9', 'hamzah@santri.nurulfalah.ac.id', 'password123', 'Hamzah Asadullah', 'santri', 'STR-2026-050', 'Kamar Shalahuddin 02', '0877-6655-4433', true),

  -- Kamar Khalid 03
  ('usr-santri-5', 'zaid@santri.nurulfalah.ac.id', 'password123', 'Zaid bin Tsabit', 'santri', 'STR-2026-046', 'Kamar Khalid 03', '0878-1122-9988', true),
  ('usr-santri-10', 'ali@santri.nurulfalah.ac.id', 'password123', 'Ali Zainal Abidin', 'santri', 'STR-2026-051', 'Kamar Khalid 03', '0853-2211-4433', true),
  ('usr-santri-11', 'fatih@santri.nurulfalah.ac.id', 'password123', 'Fatih Rabbani Al-Hafidz', 'santri', 'STR-2026-052', 'Kamar Khalid 03', '0812-4455-6677', true),
  ('usr-santri-12', 'rayhan@santri.nurulfalah.ac.id', 'password123', 'Rayhan Al-Ghifari', 'santri', 'STR-2026-053', 'Kamar Khalid 03', '0813-2233-8899', true),

  -- Kamar Thariq 04
  ('usr-santri-13', 'thariq@santri.nurulfalah.ac.id', 'password123', 'Thariq bin Ziyad', 'santri', 'STR-2026-054', 'Kamar Thariq 04', '0856-1122-3344', true),
  ('usr-santri-14', 'usamah@santri.nurulfalah.ac.id', 'password123', 'Usamah bin Zaid', 'santri', 'STR-2026-055', 'Kamar Thariq 04', '0878-3344-5566', true),
  ('usr-santri-15', 'ibnusina@santri.nurulfalah.ac.id', 'password123', 'Ibnu Sina Ramadhan', 'santri', 'STR-2026-056', 'Kamar Thariq 04', '0812-9900-1122', true),
  ('usr-santri-16', 'farhan@santri.nurulfalah.ac.id', 'password123', 'Farhan Kamil Hakim', 'santri', 'STR-2026-057', 'Kamar Thariq 04', '0813-7788-9900', true),

  -- Kamar Ali 05
  ('usr-santri-17', 'hasan@santri.nurulfalah.ac.id', 'password123', 'Hasan Al-Bashri', 'santri', 'STR-2026-058', 'Kamar Ali 05', '0852-1199-8877', true),
  ('usr-santri-18', 'husain@santri.nurulfalah.ac.id', 'password123', 'Husain Al-Baqir', 'santri', 'STR-2026-059', 'Kamar Ali 05', '0812-5566-7788', true),
  ('usr-santri-19', 'luqman@santri.nurulfalah.ac.id', 'password123', 'Luqman Hakim An-Nafi', 'santri', 'STR-2026-060', 'Kamar Ali 05', '0877-2233-4455', true),
  ('usr-santri-20', 'ihsan@santri.nurulfalah.ac.id', 'password123', 'Ihsan Maulana Syarif', 'santri', 'STR-2026-061', 'Kamar Ali 05', '0813-6677-8899', true),

  -- Musyrif & Pengasuhan
  ('usr-musyrif-1', 'mansur@nurulfalah.ac.id', 'password123', 'Ustadz Mansur Hidayat, M.Ag', 'musyrif', null, 'Pengasuhan Asrama Putra', '0812-9988-7766', true),
  ('usr-musyrif-2', 'abdullah@nurulfalah.ac.id', 'password123', 'Ustadz Abdullah Robbani, S.Pd.I', 'musyrif', null, 'Bidang Kedisiplinan & Tahfidz', '0813-5544-3322', true),
  ('usr-musyrif-3', 'fauzan@nurulfalah.ac.id', 'password123', 'Ustadz Fauzan Adzima, Lc', 'musyrif', null, 'Bidang Ta’lim & Bahasa Arab', '0812-3344-5577', true),
  ('usr-musyrif-4', 'nurul@nurulfalah.ac.id', 'password123', 'Ustadzah Nurul Hidayati, S.Pd', 'musyrif', null, 'Biro Administrasi & Perizinan', '0813-7788-2233', true)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  student_number = EXCLUDED.student_number,
  group_name = EXCLUDED.group_name,
  phone = EXCLUDED.phone;

-- 13. SEED JADWAL KEGIATAN RUTIN PONDOK
DELETE FROM public.activities;

INSERT INTO public.activities (id, name, code, description, is_active, active_days, start_time, end_time, crosses_midnight, location_lat, location_lng, radius_m, max_gps_accuracy_m, late_after_minutes)
VALUES
  ('act-1', 'Qiyamul Lail', 'QIYAM', 'Sholat malam dan dzikir bersama di Masjid Utama', true, ARRAY[1,2,3,4,5], '03:00', '04:00', false, -7.312540, 112.728520, 75, 100, 15),
  ('act-2', 'Shubuh Berjamaah', 'SHUBUH', 'Sholat Shubuh berjamaah dan kultum pagi', true, ARRAY[1,2,3,4,5], '04:15', '05:15', false, -7.312540, 112.728520, 75, 100, 10),
  ('act-3', 'Setoran Pagi', 'SETORAN_PAGI', 'Halaqoh tahfidz dan ziyadah hafalan baru', true, ARRAY[1,2,3,4,5], '05:30', '06:45', false, -7.312540, 112.728520, 75, 100, 15),
  ('act-4', 'Madrasah Diniyah (Madin)', 'MADIN', 'Kajian kitab fikih, nahwu, shorof, dan akhlaq', true, ARRAY[1,2,3,4,5], '15:30', '17:00', false, -7.312540, 112.728520, 75, 100, 10),
  ('act-5', 'Maghrib & Dzikir', 'MAGHRIB', 'Sholat Maghrib berjamaah dan Al-Ma’tsurat', true, ARRAY[1,2,3,4,5], '17:45', '18:45', false, -7.312540, 112.728520, 75, 100, 10),
  ('act-6', 'Isya Berjamaah', 'ISYA', 'Sholat Isya berjamaah dan taklim adab santri', true, ARRAY[1,2,3,4,5], '19:00', '20:00', false, -7.312540, 112.728520, 75, 100, 10),
  ('act-7', 'Setoran Malam / Muroja’ah', 'SETORAN_MALAM', 'Muroja’ah hafalan mandiri dan sima’an antarsantri', true, ARRAY[1,2,3,4,5], '20:15', '21:45', false, -7.312540, 112.728520, 75, 100, 15),
  ('act-8', 'Ngaji Kitab Kuning', 'NGAJI_SABTU', 'Bandongan Kitab Ta’limul Muta’allim bersama Pengasuh', true, ARRAY[6], '08:00', '10:30', false, -7.312540, 112.728520, 75, 100, 15)
ON CONFLICT (code) DO UPDATE
SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng,
  radius_m = EXCLUDED.radius_m;

-- 14. TABEL SPP SETTINGS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.spp_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  monthly_amount NUMERIC NOT NULL DEFAULT 120000,
  bank_name TEXT NOT NULL DEFAULT 'Bank Syariah Indonesia (BSI)',
  bank_account_number TEXT NOT NULL DEFAULT '7128938475',
  bank_account_holder TEXT NOT NULL DEFAULT 'Pondok Pesantren Nurul Falah',
  qris_image_url TEXT NULL,
  notes TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by TEXT NULL
);

INSERT INTO public.spp_settings (id, monthly_amount, bank_name, bank_account_number, bank_account_holder, notes)
VALUES (
  'default',
  120000,
  'Bank Syariah Indonesia (BSI)',
  '7128938475',
  'Pondok Pesantren Nurul Falah',
  'Harap transfer sesuai nominal yang ditentukan. Cantumkan berita transfer: SPP [Bulan] [Nama Santri] [NIS]. Unggah bukti transfer di formulir ini.'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.spp_payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_number TEXT NULL,
  group_name TEXT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 120000,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  proof_image_url TEXT NOT NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT NULL,
  reviewed_by_name TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. TABEL FINANCIAL TRANSACTIONS (Transparansi Kas Terbuka)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NULL,
  proof_image_url TEXT NULL,
  created_by TEXT NULL,
  created_by_name TEXT NULL,
  spp_payment_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. STORAGE BUCKET SPP PROOFS
INSERT INTO storage.buckets (id, name, public)
VALUES ('spp-proofs', 'spp-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read spp_settings" ON public.spp_settings;
CREATE POLICY "Public Read spp_settings" ON public.spp_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated Manage spp_settings" ON public.spp_settings;
CREATE POLICY "Authenticated Manage spp_settings" ON public.spp_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read spp_payments" ON public.spp_payments;
CREATE POLICY "Public Read spp_payments" ON public.spp_payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated Manage spp_payments" ON public.spp_payments;
CREATE POLICY "Authenticated Manage spp_payments" ON public.spp_payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read financial_transactions" ON public.financial_transactions;
CREATE POLICY "Public Read financial_transactions" ON public.financial_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated Manage financial_transactions" ON public.financial_transactions;
CREATE POLICY "Authenticated Manage financial_transactions" ON public.financial_transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access spp-proofs" ON storage.objects;
CREATE POLICY "Public Access spp-proofs" ON storage.objects FOR ALL USING (bucket_id = 'spp-proofs') WITH CHECK (bucket_id = 'spp-proofs');
