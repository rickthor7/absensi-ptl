-- ==============================================================================
-- MIGRATION: CUSTOM NOMINAL SPP PER ANGKATAN (ANGKATAN 2026 = RP 170.000)
-- Pondok Pesantren Nurul Falah, Ketintang Surabaya
-- ==============================================================================

-- 1. Tambah kolom generation_amounts pada tabel spp_settings jika belum ada
ALTER TABLE public.spp_settings
  ADD COLUMN IF NOT EXISTS generation_amounts JSONB DEFAULT '{"2026": 170000}'::jsonb;

-- 2. Update default settings agar mencakup tarif custom angkatan 2026 (Rp 170.000)
UPDATE public.spp_settings
SET generation_amounts = '{"2026": 170000}'::jsonb
WHERE id = 'default' AND (generation_amounts IS NULL OR generation_amounts = '{}'::jsonb);
