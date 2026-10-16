-- ==============================================================================
-- MIGRATION: 20261016000002_manual_attendance_and_discrepancy.sql
-- Integrasi Absen Manual Musyrif (Hadir, Izin, Alpa) & Deteksi Ketidaksamaan Data
-- ==============================================================================

-- 1. Tambah nilai 'alpa' pada enum attendance_status
DO $$ BEGIN
  ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'alpa';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tambahkan kolom pendukung absen manual dan verifikasi ketidaksamaan
ALTER TABLE IF EXISTS public.attendance_records
  ADD COLUMN IF NOT EXISTS musyrif_status TEXT NULL,
  ADD COLUMN IF NOT EXISTS santri_status attendance_status NULL,
  ADD COLUMN IF NOT EXISTS has_discrepancy BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS discrepancy_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS verified_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS verification_note TEXT NULL;

-- 3. Indeks untuk query ketidaksamaan data secara cepat
CREATE INDEX IF NOT EXISTS idx_attendance_records_discrepancy 
  ON public.attendance_records(has_discrepancy) 
  WHERE has_discrepancy = TRUE;

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_student 
  ON public.attendance_records(session_id, student_id);
