-- ==============================================================================
-- MIGRATION: SISTEM SPP BULANAN & TRANSPARANSI KEUANGAN PESANTREN
-- Pondok Pesantren Nurul Falah, Ketintang Surabaya
-- ==============================================================================

-- 1. TABEL SPP SETTINGS (Pengaturan Biaya Bulanan & Rekening Pondok)
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

-- Seed pengaturan default SPP jika belum ada
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

-- 2. TABEL SPP PAYMENTS (Pengajuan & Bukti Pembayaran SPP Santri)
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
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'verified' | 'rejected'
  reviewed_by TEXT NULL,
  reviewed_by_name TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_spp_payments_student ON public.spp_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_spp_payments_period ON public.spp_payments(year, month);
CREATE INDEX IF NOT EXISTS idx_spp_payments_status ON public.spp_payments(status);

-- 3. TABEL FINANCIAL TRANSACTIONS (Pencatatan Keuangan / Transparansi Kas Terbuka)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'income' | 'expense'
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

CREATE INDEX IF NOT EXISTS idx_financial_tx_date ON public.financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_tx_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_tx_category ON public.financial_transactions(category);

-- 4. STORAGE BUCKET SPP PROOFS
INSERT INTO storage.buckets (id, name, public)
VALUES ('spp-proofs', 'spp-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. RLS POLICIES (Publik dapat membaca transparansi kas & SPP settings)
ALTER TABLE public.spp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spp_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

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
