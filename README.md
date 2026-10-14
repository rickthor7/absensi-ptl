# Sistem Absensi Santri Berbasis Selfie dan Geotag (Production Ready)
Pondok Pesantren Nurul Falah, Ketintang Surabaya

Aplikasi web presensi santri berbasis **Next.js (App Router) + TypeScript + Supabase Database & Storage** yang memvalidasi kehadiran santri menggunakan foto selfie kamera langsung dan verifikasi koordinat lokasi GPS (geodesic distance / Haversine) secara real-time.

Dibuat berdasarkan spesifikasi teknis dan desain pada:
- [`prd.md`](./prd.md) (Product Requirement Document)
- [`design.md`](./design.md) (Design Specification & Islamic Modern UI)
- [`arsitektur.md`](./arsitektur.md) (System Architecture, Data Models & Security)

---

## 🌟 Fitur Utama (Real & Siap Pakai)

### 1. Portal Santri
- **Beranda & Deteksi Kegiatan**: Otomatis mendeteksi jadwal kegiatan pondok yang sedang aktif berdasarkan jam operasional real-time WIB (`Asia/Jakarta`).
- **Alur Absensi 5 Langkah**:
  1. *Pilih Status*: Hadir atau Izin (wajib alasan udzur syar'i).
  2. *Swafoto (Selfie) Kamera*: Pengambilan gambar langsung dari webcam/kamera perangkat dengan panduan oval guideline wajah.
  3. *Verifikasi Geotag GPS*: Membaca koordinat latitude/longitude dan akurasi perangkat via Geolocation API. Menghitung jarak meter terhadap titik pusat pondok pesantren (-7.31254, 112.72852) dan memvalidasi radius.
  4. *Tinjau & Konfirmasi*: Ringkasan pratinjau foto selfie, nama kegiatan, waktu kirim, dan jarak.
  5. *Hasil & Tiket Resi*: Validasi status otomatis (`hadir_valid`, `izin_diajukan`, `perlu_tinjauan`, atau `ditolak_lokasi`) dengan animasi selebrasi. Foto tersimpan ke Supabase Storage.
- **Kalender Absensi Bulanan**: Tampilan kalender interaktif santri dengan penanda status kehadiran harian, statistik hadir/izin, dan rincian per kegiatan.
- **Riwayat Absensi**: Catatan kehadiran lengkap dengan filter kegiatan, pencarian, dan pratinjau foto.
- **Profil Santri**: Identitas lengkap santri, NIS, kamar asrama, dan akumulasi tingkat kehadiran.

### 2. Portal Musyrif (Pengawasan & Manajemen)
- **Dashboard Ringkasan Real-time**:
  - 4 Kartu Metrik: Hadir Valid Hari Ini, Izin Menunggu Review, Belum Absen, dan Kegiatan Aktif Saat Ini.
  - *Banner Peringatan Real-Time*: Deteksi otomatis santri dengan skor kehadiran di bawah batas kelulusan (< 70%).
  - *Panel Perlu Tindakan*: Daftar permohonan izin dan absensi bermasalah yang menunggu keputusan musyrif.
- **Data Santri (Kesiswaan)**: Kelola data santri (tambah santri baru, ubah kamar asrama, status aktif/nonaktif, nomor kontak wali santri).
- **Verifikasi Seluruh Absensi**: Monitoring seluruh catatan presensi santri, foto selfie, koordinat GPS, jarak geodesik, serta **Koreksi Manual** yang mencatat alasan dan jejak audit.
- **Persetujuan Perizinan**: Tab Menunggu, Disetujui, dan Ditolak dilengkapi foto bukti, alasan udzur, dan catatan pertimbangan musyrif.
- **Kegiatan & Jadwal Pondok**: Konfigurasi nama kegiatan, jam buka/tutup, hari aktif, titik koordinat, batas radius geofence, dan toleransi GPS, termasuk dukungan **kegiatan lintas tengah malam** (*crosses midnight*).
- **Rekap & Laporan Bulanan**: Skor kehadiran terpadu (Hadir=1, Izin=0.5, Alpa=0), persentase kelulusan presensi, dan tombol **Ekspor CSV Lengkap**.
- **Audit Trail**: Rekam jejak seluruh aksi koreksi manual dan peninjauan izin oleh musyrif.

### 3. Autentikasi Resmi
- **Portal Login Terpisah**: Portal Santri (menggunakan Nomor Induk Santri / Email) dan Portal Musyrif (Email dinas pesantren).
- **Akun Resmi Tersedia**:
  - *Musyrif*: `mansur@nurulfalah.ac.id`, `ustadz.faqih@nurulfalah.ac.id`, `admin@nurulfalah.ac.id` (Kata Sandi: `password123`)
  - *Santri*: NIS `STR-2026-042` (Ahmad Fauzi), `STR-2026-043` (Muhammad Rizky), `STR-2026-044` (Umar Al-Faruq), dll. (Kata Sandi: `password123`)

---

## 🛠️ Stack Teknologi

- **Frontend & Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons, Modern Islamic Emerald & Gold Theme
- **Geolokasi**: Rumus Geodesik / Haversine Distance (`src/lib/geo.ts`)
- **Backend & Database**: Supabase PostgreSQL dengan PostGIS, Supabase Storage (`attendance-photos`), dan Row Level Security (RLS)

---

## 🚀 Menjalankan Aplikasi

1. **Jalankan development server**:
   ```bash
   npm run dev
   ```

2. **Akses di browser**:
   Buka [http://localhost:3000](http://localhost:3000)

3. **Sinkronisasi Database Supabase (Opsional jika ingin reset total)**:
   - Buka SQL Editor di project Supabase Anda:
     [https://supabase.com/dashboard/project/tzwtncikrblqynupkjng/sql/new](https://supabase.com/dashboard/project/tzwtncikrblqynupkjng/sql/new)
   - Buka file [`supabase/setup_complete.sql`](./supabase/setup_complete.sql), copy dan paste ke SQL Editor, lalu klik tombol **RUN**.
   - Skrip tersebut otomatis menyiapkan tabel profiles, activities, attendance_records, sessions, audit_logs, storage bucket, dan akun resmi santri & musyrif.
