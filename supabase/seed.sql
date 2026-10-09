-- Seed Data for Pondok Pesantren Nurul Falah, Ketintang Surabaya
-- Coordinates: -7.312540, 112.728520

-- Insert Activities
INSERT INTO public.activities (id, name, code, description, is_active, active_days, start_time, end_time, crosses_midnight, location_lat, location_lng, radius_m, max_gps_accuracy_m, late_after_minutes)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Qiyamul Lail', 'QIYAM', 'Sholat malam dan dzikir bersama di Masjid Utama', true, ARRAY[1,2,3,4,5], '03:00', '04:00', false, -7.312540, 112.728520, 75, 100, 15),
  ('a2222222-2222-2222-2222-222222222222', 'Shubuh Berjamaah', 'SHUBUH', 'Sholat Shubuh berjamaah dan kultum pagi', true, ARRAY[1,2,3,4,5], '04:15', '05:15', false, -7.312540, 112.728520, 75, 100, 10),
  ('a3333333-3333-3333-3333-333333333333', 'Setoran Pagi', 'SETORAN_PAGI', 'Halaqoh tahfidz dan ziyadah hafalan baru', true, ARRAY[1,2,3,4,5], '05:30', '06:45', false, -7.312540, 112.728520, 75, 100, 15),
  ('a4444444-4444-4444-4444-444444444444', 'Madrasah Diniyah (Madin)', 'MADIN', 'Kajian kitab fikih, nahwu, shorof, dan akhlaq', true, ARRAY[1,2,3,4,5], '15:30', '17:00', false, -7.312540, 112.728520, 75, 100, 10),
  ('a5555555-5555-5555-5555-555555555555', 'Maghrib & Dzikir', 'MAGHRIB', 'Sholat Maghrib berjamaah dan Al-Ma’tsurat', true, ARRAY[1,2,3,4,5], '17:45', '18:45', false, -7.312540, 112.728520, 75, 100, 10),
  ('a6666666-6666-6666-6666-666666666666', 'Isya Berjamaah', 'ISYA', 'Sholat Isya berjamaah dan taklim adab santri', true, ARRAY[1,2,3,4,5], '19:00', '20:00', false, -7.312540, 112.728520, 75, 100, 10),
  ('a7777777-7777-7777-7777-777777777777', 'Setoran Malam / Muroja’ah', 'SETORAN_MALAM', 'Muroja’ah hafalan mandiri dan sima’an antarsantri', true, ARRAY[1,2,3,4,5], '20:15', '21:45', false, -7.312540, 112.728520, 75, 100, 15),
  ('a8888888-8888-8888-8888-888888888888', 'Ngaji Kitab Kuning', 'NGAJI_SABTU', 'Bandongan Kitab Ta’limul Muta’allim bersama Pengasuh', true, ARRAY[6], '08:00', '10:30', false, -7.312540, 112.728520, 75, 100, 15)
ON CONFLICT (code) DO NOTHING;
