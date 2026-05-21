#set document(title: "Final Technical Report Bacarita", author: "Kelompok 02")
#set text(lang: "id")
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 2.5cm, right: 2.5cm),
  numbering: "1",
)
#set par(justify: true, leading: 0.72em)
#set heading(numbering: "1.1.")

#align(center)[
  #v(3.5cm)
  #text(20pt, weight: "bold")[FINAL TECHNICAL REPORT]
  #v(0.4cm)
  #text(13pt)[Dokumen Kompilasi Implementasi dan User Manual]
  #v(1.0cm)
  #text(18pt, weight: "bold")[Bacarita]
  #v(0.2cm)
  #text(12pt)[Platform Pembelajaran Membaca Adaptif Berbasis Web]
  #linebreak()
  #text(12pt)[Terintegrasi AI Eye-Tracking untuk Anak Disleksia]
  #v(1.2cm)
  #text(11pt, weight: "semibold", fill: rgb("#555555"))[Repositori]
  #linebreak()
  `KOM1315_SmtGenap26_Kelompok02_Bacarita`
  #v(0.8cm)
  #text(11pt, weight: "semibold", fill: rgb("#555555"))[Program]
  #linebreak()
  Mata Kuliah Keamanan Informasi (KOM1315)
  #v(0.8cm)
  #text(11pt, weight: "semibold", fill: rgb("#555555"))[Versi Dokumen]
  #linebreak()
  Final Release - 21 Mei 2026
]

#pagebreak()

 #align(center)[#text(16pt, weight: "bold")[Daftar Isi]]
#outline()

#pagebreak()

= Ringkasan Proyek

== Latar Belakang
Bacarita adalah platform pembelajaran membaca berbasis web yang dirancang untuk membantu anak disleksia melalui pendekatan multimodal. Sistem menggabungkan _eye-tracking_ berbasis kamera, evaluasi pembacaan lisan, kurikulum cerita berlevel, serta dasbor pemantauan bagi guru dan orang tua. Pada fase final ini, fokus pengembangan tidak hanya pada fungsionalitas aplikasi, tetapi juga pada penguatan kontrol keamanan yang sesuai dengan kebutuhan data anak dan aktivitas pembelajaran.

== Tujuan Final Release
Dokumen ini menyatukan hasil implementasi teknis, struktur kode sumber, kontrol keamanan, pengujian, dan panduan operasional sistem. Dengan demikian, laporan ini berfungsi sebagai:

- kompilasi artefak teknis untuk penilaian akhir;
- jembatan antara dokumen desain awal dan implementasi aktual;
- panduan instalasi, pengoperasian, dan verifikasi fitur inti;
- ringkasan penerapan kontrol AAA, digital signature, dan perlindungan database.

== Ruang Lingkup Implementasi
Final release Bacarita mencakup tiga area utama yang saling terintegrasi:

- aplikasi backend berbasis NestJS untuk autentikasi, otorisasi, logika domain, dan manajemen data;
- aplikasi frontend berbasis Next.js untuk pengalaman belajar dan dashboard per peran;
- dashboard logging terpisah untuk visualisasi _security audit log_ dan hasil pengujian keamanan.

= Struktur Implementasi

== Struktur Repositori
Struktur repositori akhir disusun agar selaras dengan arahan pengelolaan PBL, namun tetap mempertahankan organisasi kode yang stabil selama pengembangan.

#table(
  columns: (1.4fr, 2.6fr),
  inset: 6pt,
  stroke: 0.5pt,
  table.header(
    [Folder],
    [Keterangan],
  ),
  [`01_Proposal_&_Analisis/`], [Proposal teknis dan dokumen threat modeling awal.],
  [`02_Design_Documents/`], [Dokumen ERD, diagram arsitektur, dan rencana pengujian AAA.],
  [`03_Source_Code/backend/`], [Implementasi utama server, domain logic, autentikasi, database, dan logging.],
  [`03_Source_Code/frontend/`], [Aplikasi web untuk siswa, guru, orang tua, admin, dan kurator.],
  [`03_Source_Code/logging-dashboard/`], [Dashboard visual untuk aktivitas audit dan hasil uji keamanan.],
  [`03_Source_Code/database/`], [Entrypoint kompatibilitas untuk artefak database yang direferensikan dari backend.],
  [`03_Source_Code/digital_signature/`], [Entrypoint kompatibilitas untuk modul tanda tangan digital RSA.],
  [`04_Reports_&_Paper/`], [Laporan monitoring, laporan teknis final, dan tempat paper ilmiah.],
  [`05_Testing/`], [Log pengujian keamanan dan audit aktivitas AAA.],
)

== Komponen Backend
Backend Bacarita dibangun dengan NestJS 11 dan TypeScript. Struktur modul utamanya dipisahkan ke dalam beberapa area:

- `src/feature/auth/` untuk login multi-peran, guard otorisasi, audit log, dan digital signature;
- `src/feature/users/` untuk domain akun guru, siswa, orang tua, admin, dan kurator;
- `src/feature/levels/` untuk konten cerita berlevel dan progres belajar;
- `src/feature/test-session/` untuk sesi evaluasi membaca, _eye distraction event_, dan integrasi hasil;
- `src/database/` dan `src/migrations/` untuk seed, bootstrap, dan perubahan skema.

== Komponen Frontend
Frontend menggunakan Next.js 15, React 19, dan Tailwind CSS v4. Antarmuka dipisahkan per peran pengguna agar jalur kerja lebih jelas. Fitur _eye-tracking_ dijalankan di sisi klien sehingga pemrosesan landmark wajah dilakukan di browser, sementara hasil yang relevan saja dikirim ke backend.

== Logging Dashboard
Dashboard logging dibangun sebagai aplikasi Next.js terpisah untuk menampilkan metrik audit, log stream, distribusi peran, alert keamanan, serta ringkasan hasil pengujian keamanan. Pemisahan ini mempermudah demonstrasi komponen _Accounting_ dari AAA secara eksplisit.

= Implementasi Keamanan

== Authentication
Lapisan autentikasi mendukung lima peran: `teacher`, `student`, `parent`, `admin`, dan `curator`. Implementasi final mencakup:

- JWT sebagai _access token_;
- penyimpanan token dalam _HttpOnly cookie_ melalui relay session route di frontend;
- pembatasan laju login berbasis IP;
- _account lockout_ setelah beberapa kegagalan login;
- validasi panjang minimum password;
- verifikasi hash token SHA-256 terhadap nilai di database.

Kontrol ini ditujukan untuk menutup temuan awal pada _threat modeling_, khususnya risiko pencurian token, _credential stuffing_, dan penyalahgunaan sesi.

== Authorization
Otorisasi diterapkan melalui dekorator peran dan `AuthGuard` pada endpoint backend. Pendekatan ini memisahkan jalur akses berdasarkan peran operasional masing-masing pengguna:

- siswa hanya mengakses alur belajar dan tes membaca;
- guru mengelola murid serta memantau performa;
- orang tua melihat perkembangan anak;
- admin mengelola konten tingkat sistem;
- kurator meninjau dan menyetujui cerita.

Pemisahan peran ini mengurangi risiko _privilege escalation_ dan memastikan setiap pengguna hanya dapat mengakses data yang relevan.

== Accounting dan Audit Log
Komponen _Accounting_ diwujudkan melalui log keamanan terstruktur untuk peristiwa seperti:

- login berhasil;
- login gagal;
- akun terkunci;
- logout;
- aktivitas pengujian dan pemantauan.

Artefak log yang disimpan pada folder `05_Testing/` dan dashboard visual yang terpisah memberikan bukti bahwa pencatatan aktivitas telah menjadi bagian dari _main workflow_, bukan sekadar skrip demonstrasi.

== Digital Signature
Implementasi tanda tangan digital menggunakan RSA-SHA256. Modul ini menghasilkan pasangan kunci dari variabel lingkungan bila tersedia, atau membuat pasangan ephemeris untuk lingkungan pengembangan. Tanda tangan digunakan untuk menjamin integritas dan _non-repudiation_ pada hasil sesi tertentu, terutama setelah migrasi dari pendekatan HMAC ke RSA.

#table(
  columns: (1.2fr, 1.8fr, 1.4fr),
  inset: 6pt,
  stroke: 0.5pt,
  table.header(
    [Komponen],
    [Implementasi],
    [Tujuan Keamanan],
  ),
  [Algoritma], [RSA-SHA256], [Menjamin integritas dan non-repudiation],
  [Private key], [Dapat disuplai melalui environment], [Menghindari hardcode kunci di repositori],
  [Public key], [Dapat diekspos untuk verifikasi], [Memungkinkan verifikasi hasil secara terpisah],
  [Integrasi], [Test session dan security tests], [Membuktikan modul dipakai di alur utama],
)

== Keamanan Database
Lapisan database menggunakan MySQL dan TypeORM. Penguatan yang dilakukan pada tahap akhir meliputi:

- migrasi untuk kolom keamanan tambahan;
- penyimpanan hash token, bukan token mentah;
- penambahan kolom _failed login attempts_ dan _locked until_;
- pengelolaan skema melalui migrasi terversi;
- seeder terpisah untuk data awal yang konsisten.

Pendekatan ini meningkatkan keterlacakan perubahan skema sekaligus mempermudah verifikasi kontrol keamanan terhadap data persisten.

= Alur Utama Aplikasi

== Registrasi dan Manajemen Akun
Guru dapat menambahkan siswa dan relasi orang tua melalui backend. Sistem juga mendukung akun admin dan kurator untuk kepentingan pengelolaan konten. Semua akun mengikuti aturan password dan validasi yang sama agar kontrol autentikasi konsisten.

== Login Multi-Peran
Pengguna melakukan login melalui antarmuka sesuai peran. Setelah kredensial diverifikasi, token ditetapkan melalui jalur session yang lebih aman. Pada setiap request berikutnya, backend memvalidasi token dan memeriksa kesesuaian peran sebelum memberikan akses data.

== Sesi Membaca dan Eye-Tracking
Siswa membaca materi sesuai level. Komponen _eye-tracking_ dijalankan di browser untuk mengamati pola perhatian, sementara hasil pembacaan lisan direkam sebagai bagian dari evaluasi. Event distraksi dan hasil evaluasi digunakan untuk menyusun skor dan progres belajar.

== Kurasi dan Persetujuan Cerita
Cerita baru atau perubahan konten melewati jalur admin dan kurator. Dengan demikian, konten pembelajaran tidak langsung masuk ke alur utama tanpa proses validasi.

= Hasil Pengujian

== Bukti Pengujian Keamanan
Pengujian keamanan telah didokumentasikan pada `05_Testing/unit-test-security.log` dan `05_Testing/auth_activity.log`. Berdasarkan log yang tersedia, rangkaian uji mencakup:

- verifikasi `AuthGuard` untuk kasus akses benar, salah peran, dan tanpa token;
- verifikasi modul RSA signature terhadap payload valid, payload termodifikasi, dan signature palsu;
- pengujian unit untuk komponen inti backend lain yang terkait alur domain.

== Ringkasan Hasil
#table(
  columns: (1.8fr, 1fr, 2.2fr),
  inset: 6pt,
  stroke: 0.5pt,
  table.header(
    [Area Uji],
    [Status],
    [Catatan],
  ),
  [Authentication Guard], [PASS], [Validasi 401 dan 403 berjalan sesuai ekspektasi.],
  [Digital Signature RSA], [PASS], [Payload valid lolos, payload dan signature termodifikasi ditolak.],
  [Security Audit Log], [PASS], [Artefak log awal tersimpan untuk bukti accounting.],
  [Regression Backend], [PASS], [Rangkaian unit test keamanan terdokumentasi tanpa kegagalan.],
)

== Keterbatasan yang Masih Perlu Ditingkatkan
Walaupun kontrol inti telah terpasang, beberapa perbaikan lanjutan masih layak dipertimbangkan:

- rotasi kunci RSA secara terjadwal untuk lingkungan produksi;
- enkripsi lebih lanjut untuk data kognitif yang sangat sensitif;
- _end-to-end testing_ lintas frontend-backend yang lebih luas;
- integrasi observabilitas produksi untuk audit log real-time.

= Panduan Instalasi dan Operasional

== Prasyarat
Lingkungan minimum yang diperlukan:

- Node.js 18 atau lebih baru;
- MySQL;
- npm;
- konfigurasi variabel lingkungan backend.

== Menjalankan Backend
1. Buka folder `03_Source_Code/backend/`.
2. Jalankan `npm install`.
3. Salin `.env.example` sesuai kebutuhan lingkungan.
4. Jalankan migrasi dengan `npm run migration:run`.
5. Jalankan seed awal dengan `npm run db:seed`.
6. Mulai server pengembangan dengan `npm run start:dev`.

== Menjalankan Frontend
1. Buka folder `03_Source_Code/frontend/`.
2. Jalankan `npm install`.
3. Pastikan URL backend dan jalur session telah sesuai.
4. Jalankan `npm run dev`.

== Menjalankan Logging Dashboard
1. Buka folder `03_Source_Code/logging-dashboard/`.
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.
4. Gunakan dashboard ini untuk demonstrasi log audit, _alert_, dan ringkasan hasil uji.

== Variabel Lingkungan Penting
#table(
  columns: (1.4fr, 2.4fr),
  inset: 6pt,
  stroke: 0.5pt,
  table.header(
    [Variabel],
    [Fungsi],
  ),
  [`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`], [Koneksi database utama backend.],
  [`JWT_SECRET`, `JWT_EXPIRES_IN`], [Konfigurasi token autentikasi.],
  [`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`], [Pengiriman notifikasi email.],
  [`RSA_PRIVATE_KEY`, `RSA_PUBLIC_KEY`], [Kunci untuk tanda tangan digital produksi.],
  [`OPENAI_API_KEY`], [Akses integrasi AI/LLM bila digunakan.],
)

= Panduan Pengguna

== Siswa
Siswa masuk melalui halaman login siswa, menjalani pre-test atau level yang tersedia, membaca cerita, dan mengikuti sesi evaluasi. Sistem kemudian menyajikan progres berdasarkan hasil yang terkumpul.

== Guru
Guru menggunakan dashboard untuk:

- melihat performa murid;
- menambahkan murid baru;
- memonitor hasil pembacaan;
- menggunakan data performa sebagai dasar intervensi belajar.

== Orang Tua
Orang tua dapat memantau perkembangan anak melalui dashboard yang lebih ringkas, dengan fokus pada capaian belajar dan performa membaca.

== Admin dan Kurator
Admin mengelola konten dan area tingkat sistem, sedangkan kurator memeriksa dan menyetujui cerita. Pemisahan tanggung jawab ini membantu menjaga kualitas konten sekaligus memperkuat kontrol akses.

= Kesimpulan
Bacarita telah berkembang dari artefak desain awal menjadi sistem yang memiliki implementasi backend, frontend, dashboard audit, serta kontrol keamanan yang terintegrasi. Repositori akhir tidak hanya memuat source code, tetapi juga dokumentasi, log pengujian, migrasi database, dan modul tanda tangan digital yang relevan dengan kebutuhan mata kuliah Keamanan Informasi.

Secara khusus, final release ini menunjukkan bahwa kontrol AAA, hash token database, rate limiting, account lockout, audit logging, dan RSA digital signature telah masuk ke alur utama aplikasi. Dengan tambahan laporan ini, repositori memiliki jejak artefak yang lebih lengkap untuk kebutuhan evaluasi teknis maupun operasional.
