# Architecture --- Sistem Absensi Santri

## 1. Ringkasan Arsitektur

Aplikasi menggunakan **Next.js (App Router) + TypeScript** untuk
frontend dan server-side logic, **Supabase Auth** untuk autentikasi,
**Supabase PostgreSQL** untuk data, **Supabase Storage** untuk foto
selfie, serta **Vercel** untuk deployment.

``` text
Browser Santri / Musyrif
        |
        | HTTPS
        v
Next.js App (Vercel)
  |-- UI / App Router
  |-- Server Actions / Route Handlers
  |-- Validasi sesi, role, jadwal, dan radius
        |
        +------ Supabase Auth
        +------ Supabase PostgreSQL (RLS)
        +------ Supabase Storage (private bucket)
```

## 2. Stack Teknologi

-   Next.js App Router, TypeScript.
-   Tailwind CSS untuk styling.
-   Komponen UI aksesibel (misalnya shadcn/ui) dan Lucide icons.
-   Supabase Auth untuk login dan manajemen sesi.
-   Supabase PostgreSQL untuk data relasional.
-   Supabase Storage bucket privat untuk selfie.
-   Vercel untuk hosting dan environment variables.
-   Opsional: PostGIS untuk validasi geospasial dan query radius yang
    efisien.

## 3. Struktur Direktori yang Disarankan

``` text
src/
  app/
    (auth)/
      login/page.tsx
    (santri)/
      santri/page.tsx
      santri/absensi/page.tsx
      santri/kalender/page.tsx
      santri/riwayat/page.tsx
      santri/profil/page.tsx
    (musyrif)/
      musyrif/page.tsx
      musyrif/santri/page.tsx
      musyrif/absensi/page.tsx
      musyrif/perizinan/page.tsx
      musyrif/kegiatan/page.tsx
      musyrif/laporan/page.tsx
    api/
      attendance/route.ts
      schedule/active/route.ts
      permissions/[id]/review/route.ts
  components/
    layout/
    attendance/
    calendar/
    schedule/
    students/
    ui/
  lib/
    supabase/
      browser.ts
      server.ts
      admin.ts
    auth/
    attendance/
    geo/
    schedule/
    validation/
  types/
  utils/
supabase/
  migrations/
  seed.sql
```

## 4. Model Data

### `profiles`

-   `id uuid primary key references auth.users(id)`
-   `full_name text not null`
-   `role text check in ('santri','musyrif','admin')`
-   `student_number text unique null`
-   `group_name text null` --- misalnya kamar/kelompok
-   `is_active boolean default true`
-   `created_at timestamptz`
-   `updated_at timestamptz`

### `activities`

-   `id uuid primary key`
-   `name text not null`
-   `code text unique not null`
-   `is_active boolean default true`
-   `active_days int[] not null` --- ISO weekday: Senin=1 sampai
    Minggu=7
-   `start_time time not null`
-   `end_time time not null`
-   `crosses_midnight boolean default false`
-   `location_lat double precision not null`
-   `location_lng double precision not null`
-   `radius_m integer not null`
-   `max_gps_accuracy_m integer default 100`
-   `late_after_minutes integer null`
-   `created_by uuid references profiles(id)`
-   `created_at timestamptz`
-   `updated_at timestamptz`

Seed kegiatan: - Senin--Jumat: Qiyamul Lail, Setoran Pagi, Shubuh,
Madin, Maghrib, Isya, Setoran Malam. - Sabtu: Ngaji Kitab.

Model ini menganggap satu konfigurasi jadwal per kegiatan. Jika jam atau
titik lokasi berbeda per hari, gunakan tabel `activity_schedules`
terpisah yang memiliki `activity_id`, `day_of_week`, `start_time`,
`end_time`, dan parameter lokasi/radius.

### `attendance_sessions`

Mewakili satu jendela kegiatan pada tanggal operasional tertentu. -
`id uuid primary key` - `activity_id uuid references activities(id)` -
`operational_date date not null` - `opens_at timestamptz not null` -
`closes_at timestamptz not null` -
`status text check in ('scheduled','open','closed')` - unique
`(activity_id, operational_date)`

Sesi dapat dibuat sebelumnya melalui proses terjadwal atau dihitung dari
jadwal konfigurasi. Jangan mengandalkan cron Vercel untuk menentukan
kegiatan aktif pada setiap request; validasi jadwal juga dilakukan
secara langsung di server.

### `attendance_records`

-   `id uuid primary key`
-   `session_id uuid references attendance_sessions(id)`
-   `student_id uuid references profiles(id)`
-   `attendance_type text check in ('hadir','izin')`
-   `status text check in ('hadir_valid','izin_diajukan','izin_disetujui','izin_ditolak','perlu_tinjauan','ditolak_lokasi')`
-   `photo_path text not null`
-   `latitude double precision not null`
-   `longitude double precision not null`
-   `gps_accuracy_m double precision null`
-   `location_captured_at timestamptz null`
-   `distance_from_site_m double precision null`
-   `submitted_at timestamptz not null default now()`
-   `reviewed_by uuid references profiles(id) null`
-   `reviewed_at timestamptz null`
-   `review_note text null`
-   `created_at timestamptz default now()`
-   unique `(session_id, student_id)`

### `permission_details` (opsional)

Jika proses izin perlu informasi tambahan: -
`attendance_id uuid primary key references attendance_records(id)` -
`reason text` - `review_status text` - `review_note text` -
`reviewed_by uuid references profiles(id)` - `reviewed_at timestamptz`

### `audit_logs`

-   `id uuid primary key`
-   `actor_id uuid references profiles(id)`
-   `action text not null`
-   `entity_type text not null`
-   `entity_id uuid not null`
-   `before_data jsonb`
-   `after_data jsonb`
-   `reason text`
-   `created_at timestamptz default now()`

Hindari menyimpan salinan data pribadi berlebihan dalam
`before_data`/`after_data`. Batasi akses tabel audit hanya untuk pihak
berwenang.

## 5. Proses Absensi

### Alur umum

1.  Browser meminta jadwal aktif dari endpoint server.
2.  Santri memilih Hadir atau Izin.
3.  Browser mengambil selfie melalui `getUserMedia`; jangan menyediakan
    unggahan galeri untuk alur normal.
4.  Browser mengambil posisi melalui
    `navigator.geolocation.getCurrentPosition`.
5.  Foto dikirim ke endpoint upload/atau Storage melalui signed upload
    URL yang dibuat server.
6.  Server memverifikasi sesi login, role santri, sesi kegiatan, jendela
    waktu, ukuran/tipe foto, metadata koordinat, dan akurasi.
7.  Server menghitung jarak terhadap titik kegiatan.
8.  Server menyimpan metadata absensi dan status menggunakan
    transaksi/constraint database.
9.  UI menampilkan hasil dan memperbarui kalender/riwayat.

### Validasi radius

Gunakan PostGIS `ST_DWithin` jika tersedia, atau perhitungan Haversine
di sisi server. Contoh konsep:

``` ts
const distanceMeters = haversine(
  { lat: studentLat, lng: studentLng },
  { lat: activityLat, lng: activityLng }
);

const locationPasses =
  distanceMeters <= activity.radius_m &&
  gpsAccuracyMeters <= activity.max_gps_accuracy_m;
```

Kode tersebut ilustratif; seluruh input harus divalidasi dan hasil akhir
dihitung server-side. Browser tidak boleh menentukan sendiri status
`hadir_valid`.

### Aturan status

-   `hadir` + lokasi memenuhi radius dan akurasi: `hadir_valid`.
-   `hadir` + lokasi di luar radius: `ditolak_lokasi` atau
    `perlu_tinjauan` sesuai kebijakan.
-   `hadir` + GPS tidak memadai: `perlu_tinjauan` atau minta pengambilan
    ulang.
-   `izin`: `izin_diajukan`; simpan foto dan lokasi, tetapi jangan
    mengubahnya menjadi hadir.
-   Musyrif memutuskan izin menjadi `izin_disetujui` atau
    `izin_ditolak`.

## 6. Penentuan Kegiatan Aktif

-   Simpan waktu jadwal sebagai `time` dan waktu kejadian sebagai
    `timestamptz`.
-   Gunakan zona waktu pondok `Asia/Jakarta`.
-   Server mencari sesi yang jendela waktunya mencakup waktu server saat
    ini.
-   Untuk jadwal melewati tengah malam, evaluasi waktu terhadap tanggal
    operasional sebelumnya bila waktu sekarang berada setelah tengah
    malam dan sesi masih berlangsung.
-   Cegah dua sesi aktif yang tumpang tindih, atau definisikan prioritas
    eksplisit.
-   UI hanya menampilkan sesi aktif dari endpoint server; keputusan
    akhir tetap divalidasi saat submit.
-   Vercel Cron opsional untuk membuat sesi, menutup sesi, atau mengirim
    pengingat. Cron bukan sumber kebenaran tunggal karena jadwal dapat
    dihitung dari konfigurasi saat request.

## 7. Keamanan dan RLS Supabase

Aktifkan Row Level Security pada semua tabel yang dapat diakses klien. -
Santri hanya boleh membaca profil dan catatan absensi miliknya. - Santri
tidak boleh mengubah `status`, `distance_from_site_m`, `reviewed_by`,
atau kolom keputusan lain. - Musyrif hanya boleh mengakses data sesuai
cakupan tugasnya; jika ada banyak pondok/unit, tambahkan
`organization_id` dan kebijakan scope. - Hanya musyrif berwenang yang
dapat mengelola kegiatan, meninjau izin, atau melakukan koreksi. - Foto
berada di bucket privat; gunakan signed URL dengan masa berlaku
singkat. - `SUPABASE_SERVICE_ROLE_KEY` hanya di server dan tidak pernah
memakai prefiks `NEXT_PUBLIC_`. - Jangan percaya role dari payload
browser; ambil role dari profil yang terhubung dengan sesi
terverifikasi. - Gunakan Zod atau validator sejenis pada semua
request. - Batasi ukuran foto, MIME type, dan jumlah request;
pertimbangkan rate limiting. - Catat koreksi manual, review izin, dan
perubahan konfigurasi dalam audit log.

## 8. Penyimpanan Foto

-   Bucket: `attendance-selfies` (private).
-   Path yang disarankan:
    `{student_id}/{session_id}/{attendance_id}.webp`.
-   Foto dikompresi di browser sebelum unggah, dengan batas
    resolusi/ukuran yang ditentukan.
-   Simpan path, bukan URL publik permanen, di database.
-   Tentukan kebijakan retensi, misalnya menghapus foto setelah periode
    yang disetujui pengelola pondok; pastikan aturan ini disampaikan
    kepada pengguna.
-   Jika unggahan berhasil tetapi insert database gagal, lakukan
    pembersihan file yatim atau proses rekonsiliasi.

## 9. Indeks dan Konsistensi

-   Unique index pada `(session_id, student_id)` untuk mencegah absensi
    ganda.
-   Index `attendance_records(student_id, submitted_at desc)`.
-   Index `attendance_records(status, submitted_at desc)`.
-   Index `attendance_sessions(activity_id, operational_date)`.
-   Validasi radius, status, dan pembuatan record sebaiknya dilakukan
    dalam satu operasi server/database yang konsisten.
-   Pertimbangkan PostgreSQL function/RPC untuk transaksi yang perlu
    atomik.

## 10. Deployment dan Environment

Vercel environment variables: - `NEXT_PUBLIC_SUPABASE_URL` -
`NEXT_PUBLIC_SUPABASE_ANON_KEY` - `SUPABASE_SERVICE_ROLE_KEY` ---
server-only

Supabase: - Buat tabel dan RLS lewat migration SQL. - Buat bucket
privat. - Konfigurasikan redirect URL Auth untuk domain production dan
preview yang diperlukan. - Gunakan project terpisah untuk development
dan production. - Jangan menyimpan secret di repository Git.

## 11. Pengujian

-   Unit test perhitungan jarak dan jadwal lintas tengah malam.
-   Test jadwal pada batas waktu mulai/akhir.
-   Test RLS: santri A tidak dapat membaca data santri B.
-   Test absensi duplikat dan request yang dikirim ulang.
-   Test kamera/lokasi ditolak, GPS tidak akurat, jaringan gagal, dan
    foto gagal diunggah.
-   Test izin tidak dihitung sebagai hadir.
-   Test zona waktu `Asia/Jakarta` dan pergantian tanggal.
-   Uji alur di perangkat ponsel nyata karena akses kamera/GPS
    bergantung browser dan HTTPS.

## 12. Catatan Risiko

-   GPS dapat dipalsukan pada perangkat tertentu; selfie dan geotag
    mengurangi tetapi tidak menghapus risiko kecurangan.
-   Foto wajah dan lokasi adalah data sensitif dari sisi privasi. Batasi
    akses, masa simpan, dan penggunaan sekunder.
-   Browser harus mendapat izin eksplisit untuk kamera dan lokasi.
-   Validasi jarak sebaiknya mempertimbangkan akurasi GPS agar pengguna
    tidak langsung ditolak akibat sinyal buruk.
-   Jika aturan izin berbeda antarpondok, jadikan kebijakan konfigurasi,
    bukan logika yang tersebar di komponen UI.
