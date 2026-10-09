# PRD --- Sistem Absensi Santri Berbasis Selfie dan Geotag

## 1. Ringkasan Produk

Website absensi santri berbasis Next.js yang memvalidasi kehadiran
menggunakan foto selfie terbaru dan lokasi GPS. Sistem memiliki dua
peran utama: **Santri** dan **Musyrif**. Data aplikasi disimpan di
Supabase, sementara aplikasi web di-deploy melalui Vercel.

## 2. Tujuan

-   Mempermudah pencatatan kehadiran kegiatan santri secara terpusat.
-   Mengurangi absensi titipan melalui selfie dan validasi radius
    lokasi.
-   Memudahkan musyrif mengelola jadwal, kegiatan, data santri, absensi,
    dan izin.
-   Menyediakan riwayat absensi yang mudah dipahami melalui tampilan
    kalender dan ringkasan statistik.

## 3. Pengguna dan Hak Akses

### Santri

-   Melihat status dan ringkasan absensi pribadi.
-   Melakukan absensi **Hadir** atau **Izin** untuk kegiatan yang sedang
    dibuka.
-   Mengambil selfie langsung dari kamera perangkat.
-   Memberikan izin akses lokasi saat melakukan absensi.
-   Melihat riwayat absensi berbentuk kalender dan daftar detail.
-   Melihat status validasi dan alasan jika absensi ditolak.

### Musyrif

-   Melihat ringkasan kehadiran dan kegiatan yang sedang berlangsung.
-   Mengelola data santri dan status akun.
-   Mengelola kegiatan, hari aktif, jam buka, jam tutup, titik lokasi,
    dan radius absensi.
-   Melihat, memfilter, dan meninjau seluruh data absensi.
-   Melihat data izin santri beserta foto, waktu, dan lokasi yang
    tercatat.
-   Melihat rekap kehadiran per santri, kegiatan, dan rentang tanggal.
-   Mengoreksi data absensi secara manual dengan alasan dan catatan
    audit.

## 4. Ruang Lingkup MVP

1.  Autentikasi dan role-based access.
2.  Dashboard santri dan dashboard musyrif.
3.  Pengambilan selfie dari kamera, pengambilan GPS, dan validasi
    radius.
4.  Pencatatan hadir dan izin.
5.  Pengelolaan jadwal kegiatan otomatis berdasarkan waktu.
6.  Kalender dan riwayat absensi santri.
7.  Pengelolaan data santri, absensi, dan izin untuk musyrif.
8.  Filter, pencarian, dan ekspor rekap dasar.
9.  Penyimpanan foto pada Supabase Storage dan metadata pada PostgreSQL
    Supabase.

## 5. Aturan Kegiatan dan Jadwal

### Kegiatan reguler Senin--Jumat

-   Qiyamul Lail
-   Setoran Pagi
-   Shubuh
-   Madin
-   Maghrib
-   Isya
-   Setoran Malam

### Kegiatan Sabtu

-   Ngaji Kitab

Musyrif dapat mengatur jam mulai dan jam berakhir setiap kegiatan, hari
aktif, titik koordinat pondok, serta radius validasi. Jadwal harus
mendukung kegiatan yang melewati tengah malam, misalnya Qiyamul Lail.
Jam ditampilkan dalam zona waktu `Asia/Jakarta`.

### Penentuan kegiatan aktif

-   Sistem membandingkan waktu server dengan jadwal kegiatan yang aktif
    pada hari tersebut.
-   Jika waktu berada dalam jendela absensi, kegiatan terkait otomatis
    ditampilkan sebagai kegiatan aktif.
-   Jika dua jadwal bertumpang tindih, sistem tidak memilih secara
    diam-diam: tampilkan konflik untuk musyrif dan gunakan aturan
    prioritas yang dikonfigurasi.
-   Jika tidak ada kegiatan aktif, santri melihat pesan bahwa absensi
    sedang ditutup.
-   Waktu server/database menjadi acuan, bukan jam perangkat santri.

## 6. Alur Absensi Santri

1.  Santri masuk ke dashboard dan melihat kegiatan yang sedang dibuka.
2.  Santri memilih **Hadir** atau **Izin**.
3.  Sistem meminta akses kamera dan menampilkan pratinjau kamera
    langsung.
4.  Santri mengambil selfie baru; unggahan dari galeri tidak diterima
    untuk alur absensi normal.
5.  Sistem meminta akses lokasi GPS dan membaca koordinat serta akurasi.
6.  Santri meninjau foto dan status lokasi, lalu mengirim absensi.
7.  Server memverifikasi sesi, jadwal, foto, koordinat, akurasi GPS, dan
    duplikasi absensi.
8.  Untuk **Hadir**, sistem menghitung jarak koordinat santri ke titik
    kegiatan:
    -   Dalam radius dan akurasi memenuhi batas: status `hadir_valid`.
    -   Di luar radius: status `perlu_tinjauan` atau `ditolak_lokasi`,
        sesuai kebijakan musyrif.
    -   Lokasi tidak tersedia/akurasi buruk: absensi tidak divalidasi
        otomatis dan santri diminta mencoba lagi atau mengikuti prosedur
        pengecualian.
9.  Untuk **Izin**, foto, waktu, dan lokasi tetap disimpan sebagai bukti
    pengajuan. Lokasi **tidak** dipakai untuk mengesahkan kehadiran;
    status dicatat sebagai `izin_diajukan` dan dapat memerlukan
    persetujuan musyrif.
10. Sistem menampilkan hasil dan memperbarui riwayat santri.

**Catatan produk:** memilih "Izin" tidak boleh dihitung sebagai hadir.
Jika ingin izin langsung disetujui tanpa review, jadikan kebijakan yang
dapat diatur musyrif dan tampilkan dengan jelas.

## 7. Aturan Validasi

-   Foto harus diambil dari kamera saat proses berlangsung dan memiliki
    batas ukuran/format.
-   Minta izin kamera dan lokasi hanya saat diperlukan; jelaskan alasan
    akses kepada pengguna.
-   Validasi radius dilakukan di server, bukan hanya di browser.
-   Gunakan rumus jarak geodesik/Haversine atau PostGIS `ST_DWithin`.
-   Simpan koordinat, akurasi GPS, timestamp pengambilan lokasi, dan
    hasil validasi.
-   Terapkan satu catatan absensi per santri per kegiatan dan
    tanggal/jadwal, kecuali koreksi resmi.
-   Cegah pengiriman berulang dengan constraint database dan idempotency
    key.
-   GPS dan selfie bukan bukti anti-kecurangan yang sempurna; sediakan
    audit dan peninjauan manual.

## 8. Kalender dan Ringkasan Santri

-   Kalender bulanan dengan penanda jumlah/status absensi per hari.
-   Filter berdasarkan bulan dan kegiatan.
-   Detail harian menampilkan kegiatan, status, waktu kirim, dan
    catatan.
-   Ringkasan jumlah hadir valid, izin, terlambat (jika diaktifkan),
    ditolak, dan belum absen.
-   Data hanya menampilkan catatan milik santri yang sedang masuk.

## 9. Dashboard Musyrif

-   Kartu ringkasan: hadir valid hari ini, izin menunggu review, belum
    absen, dan kegiatan aktif.
-   Tabel absensi dengan filter tanggal, kegiatan, kelas/kamar/kelompok,
    status, dan pencarian santri.
-   Halaman perizinan dengan foto bukti, lokasi pada peta (opsional),
    waktu, dan aksi setujui/tolak disertai catatan.
-   Manajemen santri: tambah, ubah, nonaktifkan, dan reset akses.
-   Manajemen kegiatan: nama, hari aktif, jam mulai/akhir, lokasi,
    radius, toleransi akurasi, dan status aktif.
-   Detail santri: kalender, persentase kehadiran, dan histori.
-   Koreksi manual harus meminta alasan dan tercatat di audit log.

## 10. Kebutuhan Nonfungsional

-   Responsif untuk ponsel, tablet, dan desktop.
-   Gunakan HTTPS; kamera dan geolokasi browser membutuhkan secure
    context.
-   Akses berbasis peran, kebijakan RLS Supabase, dan validasi server.
-   Foto tidak boleh menggunakan URL publik permanen; gunakan bucket
    privat dan signed URL.
-   Rahasiakan service-role key di server; jangan pernah mengeksposnya
    ke browser.
-   Patuhi prinsip minimisasi data, retensi foto, dan
    persetujuan/pemberitahuan kepada santri.
-   Antarmuka memiliki status loading, error, izin ditolak, GPS tidak
    akurat, dan jaringan terputus.
-   Gunakan audit trail untuk keputusan izin dan koreksi data.

## 11. Kriteria Penerimaan

-   Santri hanya dapat melihat data absensi miliknya.
-   Musyrif dapat mengelola kegiatan dan radius tanpa perubahan kode.
-   Kegiatan yang tepat muncul berdasarkan jadwal dan zona waktu pondok.
-   Absensi hadir hanya berstatus valid jika syarat radius dan akurasi
    terpenuhi.
-   Absensi izin tersimpan sebagai izin, bukan kehadiran.
-   Foto dan metadata lokasi tersimpan terpisah dengan hubungan yang
    konsisten.
-   Absensi ganda untuk satu jadwal dicegah oleh database.
-   Kalender santri mencerminkan status terbaru setelah pengiriman
    absensi.
-   Setiap keputusan review dan koreksi manual tercatat di audit log.

## 12. Di Luar Ruang Lingkup MVP

-   Pengenalan wajah biometrik otomatis.
-   Notifikasi WhatsApp/SMS.
-   Sinkronisasi offline penuh.
-   Integrasi kartu RFID/NFC.
-   Analitik prediktif dan laporan lanjutan.
