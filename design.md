# Design Specification --- Website Absensi Santri

## 1. Arah Visual

Gunakan identitas visual Islami yang modern, tenang, dan mudah
digunakan. Hindari ornamen berlebihan atau tampilan seperti template
administrasi generik. Elemen Islami hadir melalui palet warna, pola
geometris tipis, dan ilustrasi arsitektur yang sangat subtil---bukan
memenuhi seluruh halaman.

## 2. Design Principles

-   **Jelas terlebih dahulu:** status absensi, kegiatan aktif, dan aksi
    utama harus mudah ditemukan.
-   **Mobile-first:** alur selfie dan GPS dirancang terutama untuk
    ponsel.
-   **Ramah dan sopan:** bahasa UI singkat, santun, dan tidak
    menghakimi.
-   **Konsisten:** status memiliki warna dan label yang konsisten di
    seluruh halaman.
-   **Aksesibel:** kontras teks memadai, target sentuh minimal sekitar
    44×44 px, fokus keyboard jelas, dan status tidak dibedakan hanya
    dengan warna.

## 3. Palet Warna

-   `Primary / Emerald`: `#146B50` --- tombol utama, navigasi aktif.
-   `Deep Green`: `#0B3D2E` --- sidebar dan heading penting.
-   `Gold Accent`: `#D6A84F` --- aksen dan highlight terbatas.
-   `Cream Background`: `#F7F5EF` --- latar halaman.
-   `Surface`: `#FFFFFF` --- kartu dan panel.
-   `Text Primary`: `#202B26` --- teks utama.
-   `Text Muted`: `#68756E` --- teks sekunder.
-   `Success`: `#237A4B` --- hadir valid.
-   `Warning`: `#A96512` --- menunggu review/perlu perhatian.
-   `Danger`: `#B42318` --- ditolak/error.
-   `Info`: `#245E9A` --- informasi umum.

Pastikan kombinasi teks dan latar memenuhi kontras WCAG AA, khususnya
teks kecil.

## 4. Tipografi dan Bentuk

-   Gunakan `Plus Jakarta Sans` atau `Inter` untuk UI utama.
-   Gunakan font sans-serif yang mendukung karakter Indonesia dengan
    baik.
-   Heading 24--32 px desktop; body 14--16 px; label 12--14 px.
-   Radius kartu 14--18 px; input 10--12 px.
-   Bayangan ringan dan border netral; hindari efek glassmorphism yang
    mengurangi keterbacaan.
-   Ikon dari satu keluarga konsisten, misalnya Lucide.

## 5. Struktur Navigasi

### Dashboard Santri

Navigasi utama: 1. Beranda 2. Absensi 3. Kalender 4. Riwayat 5. Profil

Pada layar ponsel, gunakan bottom navigation untuk halaman utama dan
tampilkan aksi absensi sebagai tombol yang paling menonjol.

### Dashboard Musyrif

Navigasi desktop berupa sidebar: 1. Ringkasan 2. Data Santri 3. Absensi
4. Perizinan 5. Kegiatan & Jadwal 6. Rekap Laporan 7. Pengaturan

Di layar kecil, sidebar berubah menjadi drawer. Tabel panjang harus
mendukung tampilan kartu atau scroll horizontal yang terkontrol.

## 6. Halaman Santri

### Beranda

-   Sapaan singkat dan tanggal hari ini.
-   Kartu "Kegiatan Saat Ini" dengan nama kegiatan, rentang waktu, dan
    status buka/tutup.
-   Tombol utama "Mulai Absensi".
-   Ringkasan statistik: hadir, izin, dan perlu ditinjau.
-   Pratinjau kalender/riwayat terbaru.

### Halaman Absensi

Gunakan wizard bertahap agar proses tidak membingungkan: 1. **Pilih
status:** dua pilihan besar, "Hadir" dan "Izin". 2. **Ambil selfie:**
area pratinjau kamera dengan panduan posisi wajah; tombol "Ambil Foto"
dan opsi "Ulangi". 3. **Verifikasi lokasi:** status izin lokasi, akurasi
GPS, dan indikator "Dalam radius" atau "Di luar radius" untuk pilihan
hadir. 4. **Konfirmasi:** thumbnail foto, nama kegiatan, status yang
dipilih, waktu, dan status lokasi. 5. **Hasil:** sukses, perlu ditinjau,
atau gagal dengan alasan dan tindakan selanjutnya.

Jangan aktifkan tombol kirim sebelum foto dan data lokasi yang
diwajibkan tersedia. Untuk pilihan izin, tetap ambil foto dan lokasi
sesuai kebijakan, tetapi jangan tampilkan seolah lokasi menentukan
persetujuan izin.

### Kalender

-   Kalender bulanan dengan indikator kecil per status.
-   Ringkasan jumlah hadir, izin, dan status lain pada bulan terpilih.
-   Ketuk tanggal untuk melihat rincian tiap kegiatan.
-   Sediakan tampilan daftar sebagai alternatif kalender.

### Riwayat

-   Daftar absensi terbaru, dengan label status, nama kegiatan, tanggal,
    dan waktu.
-   Filter berdasarkan bulan dan kegiatan.
-   Detail menampilkan foto bukti secara aman, status lokasi, serta
    catatan review jika ada.

## 7. Halaman Musyrif

### Ringkasan

-   Kartu metrik: hadir valid hari ini, izin menunggu, belum absen, dan
    jumlah kegiatan aktif.
-   Panel kegiatan hari ini dalam urutan waktu.
-   Tabel absensi terbaru.
-   Panel "Perlu Tindakan" untuk izin dan absensi bermasalah.

### Data Santri

-   Tabel berisi nama, identitas internal, kelompok/kamar, status akun,
    dan ringkasan kehadiran.
-   Pencarian, filter, pagination, dan aksi detail.
-   Form tambah/edit dengan validasi yang jelas.

### Absensi

-   Filter tanggal, kegiatan, status, dan kelompok.
-   Status menggunakan badge plus teks, bukan warna saja.
-   Detail absensi menampilkan foto melalui signed URL, waktu,
    koordinat/akurasi, jarak ke titik absensi, dan hasil validasi.
-   Aksi koreksi manual ditempatkan di menu detail dan meminta alasan.

### Perizinan

-   Daftar izin dengan status "Menunggu", "Disetujui", atau "Ditolak".
-   Panel detail memuat foto, lokasi tercatat, waktu, dan catatan
    santri.
-   Tombol setujui/tolak harus meminta konfirmasi; penolakan menyediakan
    kolom alasan.
-   Tidak menggunakan lokasi sebagai penentu otomatis sah/tidaknya
    alasan izin.

### Kegiatan & Jadwal

-   Setiap kegiatan ditampilkan sebagai kartu atau baris konfigurasi.
-   Kolom: nama kegiatan, hari aktif, mulai, selesai, titik lokasi,
    radius, toleransi akurasi, aktif/nonaktif.
-   Tampilkan preview jadwal mingguan dan peringatan bentrok.
-   Dukung jadwal lintas tengah malam, khususnya Qiyamul Lail.
-   Perubahan jadwal disimpan dengan konfirmasi dan langsung menjadi
    acuan jadwal berikutnya.

### Rekap Laporan

-   Grafik tren kehadiran sederhana.
-   Ringkasan per kegiatan dan per santri.
-   Filter rentang tanggal.
-   Ekspor CSV; ekspor data sensitif hanya untuk peran yang berwenang.

## 8. Komponen UI

-   `AppShell`, `Sidebar`, `MobileBottomNav`
-   `PageHeader`, `StatCard`, `ActivityCard`
-   `AttendanceStatusBadge`, `ScheduleStatus`
-   `SelfieCapture`, `LocationStatusCard`, `AttendanceReview`
-   `MonthlyAttendanceCalendar`, `AttendanceHistoryList`
-   `StudentTable`, `AttendanceTable`, `PermissionReviewPanel`
-   `ScheduleEditor`, `ScheduleConflictAlert`
-   `ConfirmDialog`, `EmptyState`, `ErrorState`, `SkeletonLoader`,
    `Toast`

## 9. Status dan Microcopy

-   `hadir_valid`: "Hadir tervalidasi"
-   `izin_diajukan`: "Izin terkirim --- menunggu tinjauan"
-   `izin_disetujui`: "Izin disetujui"
-   `izin_ditolak`: "Izin ditolak --- lihat catatan musyrif"
-   `perlu_tinjauan`: "Perlu ditinjau musyrif"
-   `ditolak_lokasi`: "Di luar radius absensi"
-   `belum_absen`: "Belum melakukan absensi"

Pesan error harus menjelaskan solusi, misalnya: "Lokasi belum akurat.
Coba aktifkan GPS, pindah ke area terbuka, lalu ambil lokasi lagi."

## 10. Responsif

-   **Mobile (≤ 640 px):** satu kolom, tombol lebar, wizard selfie fokus
    layar, bottom navigation.
-   **Tablet (641--1024 px):** dua kolom untuk ringkasan; tabel dapat
    beralih menjadi kartu.
-   **Desktop (\> 1024 px):** sidebar tetap, area konten lebar,
    dashboard musyrif menggunakan tabel dan panel.
-   Jangan mengandalkan hover untuk aksi penting.

## 11. Keadaan Antarmuka yang Wajib Dirancang

-   Memuat data, kosong, gagal memuat, offline/jaringan terputus.
-   Kamera ditolak/tidak tersedia.
-   Lokasi ditolak, GPS tidak akurat, atau lokasi di luar radius.
-   Jadwal belum dibuka atau sudah ditutup.
-   Foto gagal diunggah.
-   Absensi sudah dikirim sebelumnya.
-   Izin berhasil diajukan dan izin sudah diputuskan.
-   Sesi login berakhir.

## 12. Privasi dan Keamanan Visual

-   Tampilkan pemberitahuan singkat sebelum meminta kamera dan lokasi.
-   Foto tidak ditampilkan ke pengguna lain yang tidak berwenang.
-   Gunakan signed URL sementara untuk menampilkan foto privat.
-   Jangan menaruh koordinat presisi pada tampilan umum; hanya tampilkan
    detail lokasi kepada musyrif yang berwenang.
-   Sediakan konfirmasi sebelum menghapus atau mengubah data.
