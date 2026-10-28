-- ==============================================================================
-- Migration: 20261028000001_multi_activity_permission.sql
-- Description: Add permission_batch_id to attendance_records for multi-activity permissions
-- ==============================================================================

-- 1. Tambah kolom permission_batch_id pada attendance_records
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS permission_batch_id TEXT;

-- 2. Buat index untuk optimasi query batch izin
CREATE INDEX IF NOT EXISTS idx_attendance_records_batch_id
ON public.attendance_records(permission_batch_id);

-- 3. Tambahkan komentar dokumentasi kolom
COMMENT ON COLUMN public.attendance_records.permission_batch_id IS 'ID batch untuk izin multi-kegiatan yang diajukan bersamaan oleh santri dalam satu kali pengiriman';
