-- ==============================================================================
-- MIGRATION: Update 32 Santri Profiles, Nickname, Generation, and Tahfidz Classes
-- Pondok Pesantren Nurul Falah, Ketintang Surabaya
-- ==============================================================================

-- 1. Tambah Kolom Baru pada public.profiles jika belum ada
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS generation TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS class_tahfidz_pagi TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS class_tahfidz_malam TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS lid TEXT;

-- 2. Hapus profil santri lama (dummy) dan masukkan 32 santri resmi
DELETE FROM public.profiles WHERE role = 'santri';

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
  ('usr-santri-32', 'nailul@santri.nurulfalah.ac.id', 'password123', 'NAILUL AUTHOR', 'NAILUL', 'santri', 'STR-2026-032', 'Angkatan 2026', '2026', 'A', 'B', '6285737023580', '6285737023580', true)
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
