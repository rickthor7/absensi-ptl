-- ==============================================================================
-- MIGRATION: 20261017000001_tahfidz_setoran.sql
-- Input Data Setoran Tahfidz (Juz 1-30, Halaman 1-20) & Validasi Musyrif
-- ==============================================================================

-- 1. Tambahkan kolom pendukung setoran tahfidz pada attendance_records
ALTER TABLE IF EXISTS public.attendance_records
  ADD COLUMN IF NOT EXISTS tahfidz_juz INT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_halaman INT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_status TEXT DEFAULT 'menunggu_validasi',
  ADD COLUMN IF NOT EXISTS tahfidz_validated_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_validated_by_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_validated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS tahfidz_validation_note TEXT NULL;

-- 2. Tambahkan check constraint untuk validasi rentang Juz (1-30) & Halaman (1-20) jika diisi
DO $$ BEGIN
  ALTER TABLE public.attendance_records 
    ADD CONSTRAINT chk_tahfidz_juz CHECK (tahfidz_juz IS NULL OR (tahfidz_juz >= 1 AND tahfidz_juz <= 30));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.attendance_records 
    ADD CONSTRAINT chk_tahfidz_halaman CHECK (tahfidz_halaman IS NULL OR (tahfidz_halaman >= 1 AND tahfidz_halaman <= 20));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Indeks untuk query presensi tahfidz dan status validasi musyrif
CREATE INDEX IF NOT EXISTS idx_attendance_records_tahfidz 
  ON public.attendance_records(tahfidz_status) 
  WHERE tahfidz_juz IS NOT NULL;
