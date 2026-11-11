# 🕌 Sistem Presensi Santri & Raport Mutaba'ah Digital
### Pondok Pesantren Nurul Falah, Ketintang Surabaya
> *Smart Attendance, Biometric Selfie Verification, Geofence Engine, Tahfidz Tracking & Official Mutaba'ah Report*

---

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Storage-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Timezone](https://img.shields.io/badge/Timezone-Asia%2FJakarta_(WIB)-146B50?style=for-the-badge)](https://en.wikipedia.org/wiki/Time_in_Indonesia)
[![Production Ready](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)](https://github.com/rickthor7/absensi-ptl)

---

## 📌 Ringkasan Eksekutif

**Sistem Presensi Santri & Raport Mutaba'ah Digital** adalah platform web terpadu yang dirancang khusus untuk memenuhi standar kedisiplinan dan pencatatan kepesantrenan modern. 

Platform ini menggabungkan **verifikasi swafoto kamera langsung (selfie live-capture)**, **validasi geolokasi GPS berbasis formula Geodesik Haversine**, modul **Raport Mutaba'ah Bulanan Resmi** (cetak PDF Kop Resmi & ekspor CSV), **pencatatan setoran Tahfidz Al-Qur'an terhubung WhatsApp Wali Santri**, serta **pembukuan kas SPP & Keuangan pesantren**.

Seluruh sistem beroperasi dalam standar **Waktu Indonesia Barat (WIB / UTC+7)** dengan format waktu 24 jam (`HH:mm WIB`) untuk menjamin kepastian jadwal ibadah dan kegiatan pondok.

---

## 🌟 Fitur Utama Sistem

### 📱 1. Portal Santri (Presensi Mandiri)
- **Deteksi Kegiatan Cerdas Real-Time**: Mengidentifikasi kegiatan aktif saat ini secara otomatis sesuai jadwal hari dan jam operasional pondok.
- **Wizard Presensi 5 Langkah**:
  1. **Pilihan Status Sebaris**: Opsi Hadir vs Izin yang responsif dan ergonomis di smartphone.
  2. **Swafoto Langsung (Live Camera)**: Panduan oval guideline wajah, anti-fake, dan konversi resolusi optimal.
  3. **Verifikasi Geotagging GPS**: Menghitung jarak geodesik meter terhadap titik episentrum pondok (`-7.31254, 112.72852`) dengan toleransi radius geofence.
  4. **Pengajuan Izin Bebas Radius**: Santri yang sedang udzur syar'i (sakit/pulang) dapat mengajukan izin dari lokasi mana pun tanpa terkena batasan radius, dengan seleksi kegiatan yang terikat ketat pada jadwal aktif hari tersebut.
  5. **Tiket Resi Presensi**: Penerbitan resi status langsung (`hadir_valid`, `izin_diajukan`, `perlu_tinjauan`, `ditolak_lokasi`) yang tersimpan ke cloud.
- **Kalender Interaktif**: Kalender kehadiran bulanan dengan indikator dot berwarna, statistik persentase kehadiran, dan rincian catatan tiap sesi.
- **Riwayat & Retake**: Rekam jejak presensi lengkap dengan foto selfie, rincian GPS, dan opsi retake mandiri pada hari yang sama.
- **Penyimpanan Sesi / Cookies Login**: Sesi login otomatis tersimpan di perangkat santri sehingga tidak perlu login ulang berulang kali.

---

### 🛡️ 2. Portal Musyrif (Pengawasan & Manajemen Pondok)
- **Dashboard Analitik Eksekutif**:
  - Monitoring metrik harian (Hadir Valid, Izin Menunggu, Belum Absen, Sesi Aktif).
  - **Early Warning System (<70%)**: Peringatan dini otomatis untuk santri dengan tingkat kehadiran di bawah ambang batas kelulusan.
- **Editor Absensi Santri 1 Bulan Penuh**:
  - Memilih santri dan bulan berjalan/lampau untuk melihat seluruh sesi kalender dalam 1 layar.
  - Kontrol 3-Way Segmented (`Hadir`, `Izin`, `Alpa`) per kegiatan harian.
  - Fitur 1-Klik Massal: *Tandai Semua Sesi Bulan Ini Hadir* atau *Hadirkan Semua Sesi Hari Ini*.
  - Dilengkapi input alasan dan audit trail resmi pondok.
- **Absensi Manual Batch per Kegiatan**: Absensi serentak seluruh santri di satu sesi dengan deteksi ketidaksamaan (*discrepancy resolution*).
- **Pusat Persetujuan Izin**: Tinjau permohonan izin santri dilengkapi foto bukti, alasan syar'i, dan persetujuan/penolakan berdasar pertimbangan musyrif.
- **Manajemen Database Santri**: Tambah santri baru, kelola kamar asrama/kelompok, aktif/nonaktifkan akun, ubah kata sandi, dan unduh data.

---

### 📜 3. Raport Mutaba'ah Resmi & Ekspor Laporan
- **Standar Format Spreadsheet Pondok**:
  - Menampilkan 7 pilar kegiatan resmi: `LAIL`, `SUBUH`, `TAHFIDZ_PAGI`, `NGAJI_KITAB`, `MAGHRIB`, `ISYA`, dan `TAHFIDZ_MALAM`.
  - Sistem penilaian terstandarisasi: **Hadir = 1.0 poin**, **Izin = 0.5 poin**, **Alpa = 0 poin**.
  - Sinkronisasi penuh dengan data Kalender & Riwayat (status seragam, pencegahan Alpa prematur untuk kegiatan hari ini yang belum dimulai).
- **Cetak Raport PDF Ber-Kop Resmi**: Desain cetak siap pakai dengan kop surat Pondok Pesantren Nurul Falah, tanda tangan Musyrif Pembina, dan Wali Santri.
- **Ekspor Dokumen Excel / CSV**: Unduh rekap bulanan seluruh santri lengkap dalam format spreadsheet.

---

### 📖 4. Validasi Tahfidz & Notifikasi WhatsApp Wali
- **Pencatatan Setoran Ziyadah & Muroja'ah**: Catat juz, nomor halaman awal–akhir, surat, dan kelancaran setoran.
- **Predikat Kelancaran**: Kategori penilaian *Mutqin* (Sangat Lancar), *Jayyid* (Baik), *Maqbul* (Cukup), dan *Ulangi*.
- **Integrasi WhatsApp 1-Klik**: Musyrif dapat langsung mengirim ringkasan capaian setoran tahfidz ke nomor WhatsApp orang tua/wali santri.

---

### 💳 5. Pembukuan Kas & Pembayaran SPP
- **Pembayaran SPP Santri**: Pilihan pembayaran bulanan dengan upload bukti transfer bank.
- **Verifikasi Bendahara**: Konfirmasi bukti bayar santri dengan status *Lunas* atau *Pending*.
- **Penerimaan Tunai / Manual**: Musyrif dapat menginput pembayaran tunai langsung di pondok pesantren.
- **Buku Kas Operasional**: Catatan mutasi debit/kredit pengeluaran dan pemasukan pondok pesantren secara transparan.

---

## 📐 Arsitektur Validasi Geofencing

Jarak santri ke titik pusat pondok dihitung secara real-time pada browser dan diverifikasi di server menggunakan **Formula Geodesik Haversine**:

$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

$$d = R \cdot \Delta\sigma$$

*Keterangan:*
- $\phi_1, \phi_2$: Latitude posisi santri dan koordinat pusat pondok.
- $\Delta\lambda$: Selisih longitude.
- $R$: Radius bumi rata-rata ($6.371.000\text{ meter}$).
- Status `hadir_valid` hanya diterbitkan jika $d \le \text{radius kegiatan} + \text{toleransi GPS}$.

---

## 🏗️ Struktur Proyek

```plaintext
ABSENSI-SANTRI/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── login/                    # Login Santri & Musyrif
│   │   ├── santri/                   # Portal Santri
│   │   │   ├── absensi/              # Wizard Presensi 5-Langkah
│   │   │   ├── kalender/             # Kalender Kehadiran Bulanan
│   │   │   ├── riwayat/              # Riwayat Presensi & Retake
│   │   │   ├── profil/               # Biodata & Kartu Santri
│   │   │   └── spp/                  # Pembayaran SPP Santri
│   │   ├── musyrif/                  # Portal Musyrif / Admin
│   │   │   ├── absensi/              # Monitoring & Verifikasi Manual
│   │   │   ├── laporan/              # Rekap Bulanan & Raport Mutaba'ah
│   │   │   ├── perizinan/            # Approval Izin Santri
│   │   │   ├── santri/               # Manajemen Kesiswaan Santri
│   │   │   ├── tahfidz/              # Validasi Setoran Tahfidz & WA
│   │   │   ├── kegiatan/             # Jadwal & Geofence Kegiatan
│   │   │   ├── keuangan/             # Pembukuan Kas & SPP
│   │   │   └── audit/                # Audit Logs & Riwayat Koreksi
│   ├── components/                   # Komponen Modular React
│   │   ├── attendance/               # Wizard, Selfie, Geotag, Editor Bulanan
│   │   ├── reports/                  # RaportSantriModal (Kop Resmi & Print)
│   │   ├── tahfidz/                  # Modal Setoran & WhatsApp Dispatcher
│   │   ├── calendar/                 # AttendanceCalendar Widget
│   │   └── layout/                   # Navbar, MobileNav, AppShell
│   ├── lib/                          # Core Business Logic & State
│   │   ├── store.tsx                 # Centralized React Context Store & DB Sync
│   │   ├── schedule.ts               # Evaluator Jadwal WIB (Asia/Jakarta)
│   │   ├── scoring.ts                # Perhitungan Skor Kehadiran & Nilai
│   │   ├── geo.ts                    # Geodesic Haversine Calculation
│   │   ├── cookies.ts                # Session Cookie Persistence
│   │   ├── supabase.ts               # Supabase Client & Connection Checker
│   │   └── constants.ts              # Master Data & Initial Seed Records
│   └── types/                        # TypeScript Type Definitions
├── supabase/
│   ├── setup_complete.sql            # Master DDL Schema, RLS, Storage Bucket
│   └── migrations/                   # Skrip Migrasi SQL Tambahan
└── README.md                         # Dokumentasi Resmi Proyek
```

---

## ⚡ Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js**: Versi 18.18+ atau 20+
- **NPM** atau **Yarn** / **PNPM**
- Browser dengan akses izin Kamera & Lokasi (GPS)

### 2. Kloning Repositori
```bash
git clone https://github.com/rickthor7/absensi-ptl.git
cd absensi-ptl
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Buat file `.env.local` pada direktori root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
*(Catatan: Aplikasi telah dilengkapi offline fallback store sehingga tetap dapat dijalankan dan diuji secara penuh tanpa ketergantungan koneksi Supabase).*

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 6. Build untuk Lingkungan Produksi
```bash
npm run build
npm run start
```

---

## 🔐 Manajemen Akses & Autentikasi

Sistem mengimplementasikan otentikasi berbasis peran (*Role-Based Access Control* / RBAC):
- **Musyrif / Pengurus**: Memiliki wewenang manajemen presensi harian, audit perizinan, evaluasi setoran tahfidz, serta pelaporan Raport Mutaba'ah santri.
- **Santri**: Akses presensi mandiri (swafoto & geotag GPS), pengajuan permohonan izin terprogram, pemantauan kalender kehadiran pribadi, dan kartu santri digital.

> [!NOTE]
> Kredensial akun santri dan musyrif dikelola secara terpusat dan aman oleh Administrator Pondok Pesantren Nurul Falah demi menjaga privasi dan keamanan data kepesantrenan.

---

## 📜 Lisensi & Pengembang

Dikembangkan dengan penuh dedikasi untuk efisiensi dan transparansi kedisiplinan **Pondok Pesantren Nurul Falah, Ketintang Surabaya**.

Hak Cipta © 2026 Pondok Pesantren Nurul Falah. Seluruh hak cipta dilindungi undang-undang.

