# Sistem Absensi Santri Berbasis Selfie dan Geotag

Aplikasi website absensi santri berbasis **Next.js (App Router) + TypeScript** yang memvalidasi kehadiran santri menggunakan foto selfie kamera dan verifikasi koordinat lokasi GPS (geodesic distance / Haversine) secara real-time.

Dibuat berdasarkan spesifikasi teknis dan desain pada:
- [`prd.md`](./prd.md) (Product Requirement Document)
- [`design.md`](./design.md) (Design Specification & Islamic Modern UI)
- [`arsitektur.md`](./arsitektur.md) (System Architecture, Data Models & Security)

---

## 🌟 Fitur Utama

### 1. Portal Santri
- **Beranda & Kegiatan Aktif**: Otomatis mendeteksi jadwal kegiatan pondok yang sedang dibuka berdasarkan waktu server `Asia/Jakarta`.
- **Wizard Absensi 5 Langkah**:
  1. *Pilih Status*: Hadir atau Izin (dengan pengisian alasan udzur syar'i).
  2. *Swafoto (Selfie) Kamera*: Pengambilan gambar langsung dari webcam/kamera perangkat dengan panduan posisi wajah (oval guide). Terdapat tombol sampel foto untuk pengujian.
  3. *Verifikasi Geotag GPS*: Membaca koordinat latitude/longitude dan akurasi perangkat. Membandingkan jarak meter terhadap titik pusat pondok pesantren. Tersedia simulator pengujian "Dalam Pondok (~15m)" dan "Luar Pondok (~1.2 km)".
  4. *Konfirmasi*: Ringkasan foto, status, waktu kirim, dan jarak.
  5. *Hasil & Resi*: Validasi status otomatis (`hadir_valid`, `izin_diajukan`, `perlu_tinjauan`, atau `ditolak_lokasi`) dengan animasi selebrasi confetti.
- **Kalender Absensi**: Tampilan kalender bulanan dengan penanda status titik warna-warni, ringkasan bulanan, dan klik tanggal untuk melihat rincian kegiatan.
- **Riwayat Absensi**: Daftar riwayat kehadiran lengkap dengan filter kegiatan dan status, pencarian, serta modal pratinjau foto aman.
- **Profil Santri**: Biodata santri, NIS, kamar asrama, dan akumulasi tingkat kehadiran.

### 2. Portal Musyrif (Pengasuhan & Pengawasan)
- **Dashboard Ringkasan**:
  - 4 Kartu Metrik: Hadir Valid Hari Ini, Izin Menunggu Review, Belum Absen, dan Kegiatan Aktif Saat Ini.
  - *Panel Perlu Tindakan*: Daftar permohonan izin dan absensi bermasalah yang menunggu keputusan musyrif.
  - Timeline jadwal kegiatan hari ini.
  - Live feed rekaman absensi terbaru santri.
- **Data Santri**: Manajemen data santri (CRUD), pencarian, filter kamar asrama, dan status aktif akun.
- **Kelola Absensi**: Monitoring seluruh catatan absensi santri, detail koordinat/jarak, serta tombol **Koreksi Manual** yang mewajibkan input alasan dan tercatat di audit log.
- **Perizinan Santri**: Tab Menunggu, Disetujui, dan Ditolak. Dilengkapi foto bukti, lokasi geotag, dan formulir setujui/tolak dengan catatan musyrif.
- **Kegiatan & Jadwal**: Konfigurasi nama kegiatan, jam mulai & akhir, hari aktif, titik koordinat pondok, radius meter, toleransi akurasi GPS, serta dukungan **kegiatan lintas tengah malam** (*crosses midnight*, contoh: Qiyamul Lail).
- **Rekap & Laporan**: Statistik per kegiatan, persentase kehadiran per santri, filter rentang tanggal, dan tombol **Ekspor Rekap CSV**.
- **Audit Log Trail**: Rekam jejak seluruh koreksi manual status dan keputusan perizinan oleh musyrif.

### 3. Pengalih Peran (Role Switcher) & Simulasi Waktu
- Tombol **Ganti Pengguna & Peran** di navigasi atas: Berpindah langsung antara berbagai profil Santri (Ahmad Fauzi, M. Rizky, Umar Al-Faruq) dan Musyrif (Ustadz Mansur, Ustadz Abdullah).
- **Simulasi Waktu (Time Simulator)**: Menguji jendela absensi kegiatan kapan saja (misal loncat ke jam Shubuh 04:30, Setoran Pagi 06:00, Madin 16:00, atau Qiyamul Lail 03:30) tanpa harus menunggu jam operasional asli.

---

## 🛠️ Stack Teknologi

- **Frontend & Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans font
- **Animasi & Interaksi**: Canvas Confetti
- **Geolokasi**: Rumus Geodesik / Haversine Distance (`src/lib/geo.ts`)
- **Database Schema**: Supabase PostgreSQL dengan PostGIS, Row Level Security (RLS), dan migration script (`supabase/migrations/`)

---

## 🚀 Menjalankan Secara Lokal

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan development server**:
   ```bash
   npm run dev
   ```

3. **Buka di browser**:
   Akses [http://localhost:3000](http://localhost:3000)

4. **Build untuk production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🗄️ Struktur Folder

```text
src/
  app/
    layout.tsx               # Root layout & StoreProvider
    page.tsx                 # Halaman utama landing portal
    login/page.tsx           # Halaman login & demo account selector
    santri/
      page.tsx               # Beranda santri
      absensi/page.tsx       # Wizard absensi 5-langkah
      kalender/page.tsx      # Kalender bulanan santri
      riwayat/page.tsx       # Riwayat absensi santri
      profil/page.tsx        # Profil santri
    musyrif/
      page.tsx               # Dashboard ringkasan musyrif
      santri/page.tsx        # Manajemen data santri
      absensi/page.tsx       # Monitoring & koreksi absensi
      perizinan/page.tsx     # Review permohonan izin
      kegiatan/page.tsx      # Manajemen kegiatan & jadwal
      laporan/page.tsx       # Rekap analitik & ekspor CSV
      audit/page.tsx         # Audit trail log
  components/
    layout/Navbar.tsx        # Navigasi Islami, role switcher & time simulator
    layout/MobileNav.tsx     # Bottom navigation mobile
    attendance/
      SelfieCapture.tsx      # Live webcam snapshot & sample fallback
      LocationChecker.tsx    # GPS tracker & inside/outside simulator
      AttendanceWizard.tsx   # 5-step wizard
      AttendanceDetailModal.tsx
      CorrectionModal.tsx
      PermissionReviewModal.tsx
    calendar/
      AttendanceCalendar.tsx # Kalender bulanan interaktif
    students/
      StudentModal.tsx
    schedule/
      ActivityModal.tsx
  lib/
    constants.ts             # Seed data kegiatan, santri, musyrif, koordinat
    geo.ts                   # Perhitungan Haversine formula & radius check
    schedule.ts              # Evaluasi jadwal aktif & lintas tengah malam
    store.tsx                # React Context state management & local storage
  types/
    index.ts                 # TypeScript type definitions
supabase/
  migrations/                # Migration SQL schema & RLS policies
  seed.sql                   # Seed SQL kegiatan pondok
```
