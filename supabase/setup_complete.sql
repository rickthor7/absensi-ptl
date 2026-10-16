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
    'belum_absen',
    'alpa'
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
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS generation TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS class_tahfidz_pagi TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS class_tahfidz_malam TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS lid TEXT;

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
  musyrif_status TEXT NULL,
  santri_status attendance_status NULL,
  has_discrepancy BOOLEAN DEFAULT FALSE,
  discrepancy_reason TEXT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ NULL,
  verified_by TEXT NULL,
  verification_note TEXT NULL,
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

INSERT INTO public.profiles (id, email, password_hash, full_name, nickname, role, student_number, group_name, generation, class_tahfidz_pagi, class_tahfidz_malam, lid, phone, is_active)
VALUES
  -- Angkatan 2023
  ('usr-santri-1', 'dliya@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD DLIYAAUL HAQ SHIDQEY', 'DLIYA''', 'santri', 'STR-2023-001', 'Angkatan 2023', '2023', 'B', 'A', '181041662808088@lid', '6282143863964', true),
  ('usr-santri-2', 'akbar@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD AKBAR GALEH MAULANA', 'AKBAR', 'santri', 'STR-2023-002', 'Angkatan 2023', '2023', 'A', 'A', '70270631022704@lid', '6285726189100', true),
  ('usr-santri-3', 'sakhowi@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD SAKHOWI AL WAHIDI', 'SAKHOWI', 'santri', 'STR-2023-003', 'Angkatan 2023', '2023', 'A', 'A', '100141759488198@lid', '6287715625085', true),
  ('usr-santri-4', 'putra@santri.nurulfalah.ac.id', 'password123', 'RAHMAT HADI SAPUTRA', 'PUTRA', 'santri', 'STR-2023-004', 'Angkatan 2023', '2023', 'B', 'A', '124443053568081@lid', '6285728979999', true),

  -- Angkatan 2024
  ('usr-santri-5', 'yazid@santri.nurulfalah.ac.id', 'password123', 'ACHMAD YAZID AL BUSTHAMI', 'YAZID', 'santri', 'STR-2024-005', 'Angkatan 2024', '2024', 'B', 'A', '154335589728408@lid', '6282331468836', true),
  ('usr-santri-6', 'dimas@santri.nurulfalah.ac.id', 'password123', 'DIMAS SATRIA SHOFIYULLAH', 'DIMAS', 'santri', 'STR-2024-006', 'Angkatan 2024', '2024', 'B', 'A', '183395472666764@lid', '6285704420656', true),
  ('usr-santri-7', 'zuhdi@santri.nurulfalah.ac.id', 'password123', 'MOCHAMMAD ZUHDI FIRDAUS', 'ZUHDI', 'santri', 'STR-2024-007', 'Angkatan 2024', '2024', '-', '-', '117798621692111@lid', '62895351234556', true),
  ('usr-santri-8', 'alfian@santri.nurulfalah.ac.id', 'password123', 'MOHAMMAD ALFIAN RAHMATULLAH', 'ALFIAN', 'santri', 'STR-2024-008', 'Angkatan 2024', '2024', 'B', 'A', '63862321733811@lid', '6281555433698', true),
  ('usr-santri-9', 'thoriq@santri.nurulfalah.ac.id', 'password123', 'MOHAMMAD THORIQ DHIYA UL HAQ', 'THORIQ', 'santri', 'STR-2024-009', 'Angkatan 2024', '2024', 'B', 'A', '34317208150168@lid', '6281213338952', true),
  ('usr-santri-10', 'fawwaz@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD FAWWAS SYIHAB EL MILLA', 'FAWWAZ', 'santri', 'STR-2024-010', 'Angkatan 2024', '2024', 'A', 'A', '263741258072161@lid', '6281252726705', true),
  ('usr-santri-11', 'rifqi@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD RIFQI ARIFIN', 'RIFQI', 'santri', 'STR-2024-011', 'Angkatan 2024', '2024', 'A', 'A', '157934554226912@lid', '6285748877696', true),

  -- Angkatan 2025
  ('usr-santri-12', 'adzin@santri.nurulfalah.ac.id', 'password123', 'ADZINNUHA ZHALIFUNNAS SANTOSO', 'ADZIN', 'santri', 'STR-2025-012', 'Angkatan 2025', '2025', 'B', 'A', '119782594638061@lid', '6281615946380', true),
  ('usr-santri-13', 'zaki@santri.nurulfalah.ac.id', 'password123', 'AKHMAD ZAKKI UBAIDILLAH', 'ZAKI', 'santri', 'STR-2025-013', 'Angkatan 2025', '2025', 'B', 'A', '83786272399377@lid', '6289508045518', true),
  ('usr-santri-14', 'dika@santri.nurulfalah.ac.id', 'password123', 'DIKA AHMAD SAPUTRA', 'DIKA', 'santri', 'STR-2025-014', 'Angkatan 2025', '2025', 'B', 'A', '41580165595169@lid', '6281234205845', true),
  ('usr-santri-15', 'fakih@santri.nurulfalah.ac.id', 'password123', 'DIN NUR FAKIH', 'FAKIH', 'santri', 'STR-2025-015', 'Angkatan 2025', '2025', 'A', 'B', '163024140816636@lid', '6289649866299', true),
  ('usr-santri-16', 'hisyam@santri.nurulfalah.ac.id', 'password123', 'HISYAM AL HAKIM', 'HISYAM', 'santri', 'STR-2025-016', 'Angkatan 2025', '2025', 'A', 'B', '18154893893886@lid', '6285853901706', true),
  ('usr-santri-17', 'najib@santri.nurulfalah.ac.id', 'password123', 'M. NAJIB ROSYADI AL HASANI', 'NAJIB', 'santri', 'STR-2025-017', 'Angkatan 2025', '2025', 'A', 'A', '206060216426707@lid', '628981718123', true),
  ('usr-santri-18', 'rival@santri.nurulfalah.ac.id', 'password123', 'MOCHAMAD RIVAL SURYA ARDHANA', 'RIVAL', 'santri', 'STR-2025-018', 'Angkatan 2025', '2025', 'A', 'B', '141012718592193@lid', '6281515316851', true),
  ('usr-santri-19', 'dafiq@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD AGUS DAFIQUL ULUM', 'DAFIQ', 'santri', 'STR-2025-019', 'Angkatan 2025', '2025', 'B', 'A', '32530753441998@lid', '62895351707079', true),
  ('usr-santri-20', 'jihad@santri.nurulfalah.ac.id', 'password123', 'MUHAMMAD JIHAD BISMA GHANI', 'JIHAD', 'santri', 'STR-2025-020', 'Angkatan 2025', '2025', 'A', 'B', '277262234607737@lid', '6282124516336', true),

  -- Angkatan 2026
  ('usr-santri-21', 'alam@santri.nurulfalah.ac.id', 'password123', 'A. FAQIH ALAM', 'ALAM', 'santri', 'STR-2026-021', 'Angkatan 2026', '2026', 'B', 'B', '6281334838725', '6281334838725', true),
  ('usr-santri-22', 'hidayat@santri.nurulfalah.ac.id', 'password123', 'A. HIDAYAT YULIAL F', 'HIDAYAT', 'santri', 'STR-2026-022', 'Angkatan 2026', '2026', 'B', 'B', '6283861968833', '6283861968833', true),
  ('usr-santri-23', 'yusuf@santri.nurulfalah.ac.id', 'password123', 'A. YUSUF BAHARUDDIN', 'YUSUF', 'santri', 'STR-2026-023', 'Angkatan 2026', '2026', 'A', 'B', '6289653698927', '6289653698927', true),
  ('usr-santri-24', 'nizar@santri.nurulfalah.ac.id', 'password123', 'A. NIZZAR FAIZ', 'NIZAR', 'santri', 'STR-2026-024', 'Angkatan 2026', '2026', 'A', 'B', '6282250112053', '6282250112053', true),
  ('usr-santri-25', 'linggar@santri.nurulfalah.ac.id', 'password123', 'LINGGAR HANGGAR BIANTORO', 'LINGGAR', 'santri', 'STR-2026-025', 'Angkatan 2026', '2026', 'B', 'B', '6282334962512', '6282334962512', true),
  ('usr-santri-26', 'abyan@santri.nurulfalah.ac.id', 'password123', 'M. ABYAN RAFIF ATILLA', 'ABYAN', 'santri', 'STR-2026-026', 'Angkatan 2026', '2026', 'B', 'B', '6285856413122', '6285856413122', true),
  ('usr-santri-27', 'arjuna@santri.nurulfalah.ac.id', 'password123', 'M. ARJUNA ROHMAN', 'ARJUNA', 'santri', 'STR-2026-027', 'Angkatan 2026', '2026', 'A', 'B', '6285655703193', '6285655703193', true),
  ('usr-santri-28', 'bahrus@santri.nurulfalah.ac.id', 'password123', 'M. BAHRUSSALAM', 'BAHRUS', 'santri', 'STR-2026-028', 'Angkatan 2026', '2026', 'A', 'B', '62895634390675', '62895634390675', true),
  ('usr-santri-29', 'afif@santri.nurulfalah.ac.id', 'password123', 'M. KHOLIL AFIFUDDIN', 'AFIF', 'santri', 'STR-2026-029', 'Angkatan 2026', '2026', 'B', 'B', '6289524866062', '6289524866062', true),
  ('usr-santri-30', 'rizky@santri.nurulfalah.ac.id', 'password123', 'M. RIZKY PUTRA PRATAMA', 'RIZKY', 'santri', 'STR-2026-030', 'Angkatan 2026', '2026', 'A', 'B', '6285784991590', '6285784991590', true),
  ('usr-santri-31', 'wahyu@santri.nurulfalah.ac.id', 'password123', 'M. DIMAS WAHYU', 'WAHYU', 'santri', 'STR-2026-031', 'Angkatan 2026', '2026', 'B', 'B', '6285726132542', '6285726132542', true),
  ('usr-santri-32', 'nailul@santri.nurulfalah.ac.id', 'password123', 'NAILUL AUTHOR', 'NAILUL', 'santri', 'STR-2026-032', 'Angkatan 2026', '2026', 'A', 'B', '6285737023580', '6285737023580', true),

  -- Musyrif & Pengasuhan
  ('usr-musyrif-1', 'mansur@nurulfalah.ac.id', 'password123', 'Ustadz Mansur Hidayat, M.Ag', 'Ustadz Mansur', 'musyrif', null, 'Pengasuhan Asrama Putra', null, null, null, null, '0812-9988-7766', true),
  ('usr-musyrif-2', 'abdullah@nurulfalah.ac.id', 'password123', 'Ustadz Abdullah Robbani, S.Pd.I', 'Ustadz Abdullah', 'musyrif', null, 'Bidang Kedisiplinan & Tahfidz', null, null, null, null, '0813-5544-3322', true),
  ('usr-musyrif-3', 'fauzan@nurulfalah.ac.id', 'password123', 'Ustadz Fauzan Adzima, Lc', 'Ustadz Fauzan', 'musyrif', null, 'Bidang Ta’lim & Bahasa Arab', null, null, null, null, '0812-3344-5577', true),
  ('usr-musyrif-4', 'nurul@nurulfalah.ac.id', 'password123', 'Ustadzah Nurul Hidayati, S.Pd', 'Ustadzah Nurul', 'musyrif', null, 'Biro Administrasi & Perizinan', null, null, null, null, '0813-7788-2233', true)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  nickname = EXCLUDED.nickname,
  role = EXCLUDED.role,
  student_number = EXCLUDED.student_number,
  group_name = EXCLUDED.group_name,
  generation = EXCLUDED.generation,
  class_tahfidz_pagi = EXCLUDED.class_tahfidz_pagi,
  class_tahfidz_malam = EXCLUDED.class_tahfidz_malam,
  lid = EXCLUDED.lid,
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
