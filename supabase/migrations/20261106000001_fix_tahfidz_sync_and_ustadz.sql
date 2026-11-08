-- ==============================================================================
-- MIGRATION: 20261106000001_fix_tahfidz_sync_and_ustadz.sql
-- Perbaikan Sinkronisasi Absensi Setoran Tahfidz & 4 Ustadz Pengampu Halaqoh
-- ==============================================================================

-- 1. Pastikan kolom-kolom sinkronisasi presensi & tahfidz ada pada attendance_records
ALTER TABLE IF EXISTS public.attendance_records
  ADD COLUMN IF NOT EXISTS activity_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS operational_date DATE NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_class TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_ustadz_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_mode TEXT DEFAULT 'ziyadah',
  ADD COLUMN IF NOT EXISTS tahfidz_juz INT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_halaman INT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_halaman_end INT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_status TEXT DEFAULT 'menunggu_validasi',
  ADD COLUMN IF NOT EXISTS tahfidz_validated_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_validated_by_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_validated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_validation_note TEXT NULL;

-- 2. Pastikan kolom halaqoh tahfidz ada pada tabel profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS class_tahfidz_pagi TEXT DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS class_tahfidz_malam TEXT DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS tahfidz_assigned_class TEXT NULL,
  ADD COLUMN IF NOT EXISTS nickname TEXT NULL,
  ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'password123';

-- 3. Daftarkan / perbarui akun 4 Ustadz Musyrif Pengampu Tahfidz Resmi
INSERT INTO public.profiles (
  id, email, full_name, nickname, role, group_name, tahfidz_assigned_class, is_active, password_hash
) VALUES
  (
    'usr-musyrif-firdaus',
    'firdaus@nurulfalah.ac.id',
    'Ust. Firdaus',
    'firdaus',
    'musyrif',
    'Pengampu Tahfidz Pagi A',
    'tahfidz_pagi_a',
    true,
    'password123'
  ),
  (
    'usr-musyrif-suparlan',
    'suparlan@nurulfalah.ac.id',
    'Ustadz Suparlan',
    'suparlan',
    'musyrif',
    'Pengampu Tahfidz Pagi B',
    'tahfidz_pagi_b',
    true,
    'password123'
  ),
  (
    'usr-musyrif-salman',
    'salman@nurulfalah.ac.id',
    'Ust. Salman',
    'salman',
    'musyrif',
    'Pengampu Tahfidz Malam A',
    'tahfidz_malam_a',
    true,
    'password123'
  ),
  (
    'usr-musyrif-zuhdi',
    'zuhdi@nurulfalah.ac.id',
    'Ust. Zuhdi',
    'zuhdi',
    'musyrif',
    'Pengampu Tahfidz Malam B',
    'tahfidz_malam_b',
    true,
    'password123'
  )
ON CONFLICT (id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  tahfidz_assigned_class = EXCLUDED.tahfidz_assigned_class,
  is_active = true;

-- 4. Pastikan santri yang belum memiliki halaqoh diisi default 'A' atau 'B'
UPDATE public.profiles
SET class_tahfidz_pagi = 'A'
WHERE role = 'santri' AND (class_tahfidz_pagi IS NULL OR class_tahfidz_pagi = '');

UPDATE public.profiles
SET class_tahfidz_malam = 'A'
WHERE role = 'santri' AND (class_tahfidz_malam IS NULL OR class_tahfidz_malam = '');

-- Bagi santri sebagian ke kelas B agar halaqoh terdistribusi
UPDATE public.profiles
SET class_tahfidz_pagi = 'B', class_tahfidz_malam = 'B'
WHERE role = 'santri' AND id IN (
  SELECT id FROM public.profiles WHERE role = 'santri' ORDER BY id OFFSET 2 LIMIT 2
);

-- 5. Backfill data activity_id dan operational_date pada record presensi lama
UPDATE public.attendance_records ar
SET
  activity_id = s.activity_id,
  operational_date = s.operational_date
FROM public.attendance_sessions s
WHERE ar.session_id = s.id
  AND (ar.activity_id IS NULL OR ar.operational_date IS NULL);

-- Fallback backfill jika session tidak ditemukan tetapi nama sesi mengandung setoran
UPDATE public.attendance_records
SET
  operational_date = submitted_at::date
WHERE operational_date IS NULL AND submitted_at IS NOT NULL;

UPDATE public.attendance_records
SET
  activity_id = 'act-3'
WHERE activity_id IS NULL AND (session_id ILIKE '%setoran_pagi%' OR session_id ILIKE '%setoran-pagi%');

UPDATE public.attendance_records
SET
  activity_id = 'act-7'
WHERE activity_id IS NULL AND (session_id ILIKE '%setoran_malam%' OR session_id ILIKE '%setoran-malam%');

-- 6. Index pendukung query halaqoh tahfidz musyrif
CREATE INDEX IF NOT EXISTS idx_attendance_records_activity_date
  ON public.attendance_records(activity_id, operational_date);

CREATE INDEX IF NOT EXISTS idx_attendance_records_tahfidz_class
  ON public.attendance_records(tahfidz_class, operational_date);

