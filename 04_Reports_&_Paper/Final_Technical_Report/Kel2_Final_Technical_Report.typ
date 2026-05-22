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
  Final Release - 22 Mei 2026
]

#pagebreak()

 #align(center)[#text(16pt, weight: "bold")[Daftar Isi]]
#outline()

#pagebreak()

= Ringkasan Proyek

== Latar Belakang
Bacarita adalah platform pembelajaran membaca berbasis web yang dirancang untuk membantu anak disleksia melalui pendekatan multimodal. Implementasi saat ini menggabungkan _eye-tracking_ berbasis kamera di sisi klien, evaluasi pembacaan lisan berbasis sesi tes, kurikulum cerita berlevel, integrasi AI melalui OpenRouter untuk pembuatan soal STT, serta dashboard pemantauan bagi guru, orang tua, dan admin. Pada fase final ini, fokus pengembangan tidak hanya pada fungsionalitas aplikasi, tetapi juga pada penguatan kontrol keamanan yang sesuai dengan kebutuhan data anak dan aktivitas pembelajaran.

== Tujuan Final Release
Dokumen ini menyatukan hasil implementasi teknis, struktur kode sumber, kontrol keamanan, pengujian, dan panduan operasional sistem. Dengan demikian, laporan ini berfungsi sebagai:

- kompilasi artefak teknis untuk penilaian akhir;
- jembatan antara dokumen desain awal dan implementasi aktual;
- panduan instalasi, pengoperasian, dan verifikasi fitur inti;
- ringkasan penerapan kontrol AAA, digital signature, dan perlindungan database.

== Ruang Lingkup Implementasi
Final release Bacarita mencakup empat area utama yang saling terintegrasi:

- aplikasi backend berbasis NestJS untuk autentikasi, otorisasi, logika domain, dan manajemen data;
- aplikasi frontend berbasis Next.js untuk pengalaman belajar dan dashboard per peran;
- halaman audit login di aplikasi frontend admin untuk meninjau _security audit log_ langsung dari backend;
- dashboard logging terpisah untuk visualisasi _security audit log_ melalui _standalone proxy_.

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

- `src/feature/auth/` untuk login multi-peran, `AuthGuard`, audit log autentikasi, dan digital signature RSA;
- `src/feature/users/` untuk domain akun guru, siswa, orang tua, admin, dan kurator;
- `src/feature/account-management/` untuk pendaftaran siswa oleh guru beserta relasi orang tua;
- `src/feature/dashboard/` untuk ringkasan dan detail dashboard guru serta orang tua;
- `src/feature/levels/` untuk konten cerita berlevel dan progres belajar;
- `src/feature/story-management/` untuk manajemen cerita oleh admin dan persetujuan cerita oleh kurator;
- `src/feature/test-session/` untuk sesi evaluasi membaca, STT, _eye distraction event_, ringkasan distraksi, skor, medal, dan tanda tangan hasil;
- `src/feature/ai/` untuk integrasi OpenRouter pada pembangkitan soal pre-test dan soal dari cerita;
- `src/database/`, `src/config/database/`, dan `src/migrations/` untuk _seed_, bootstrap, dan perubahan skema.

== Komponen Frontend
Frontend utama menggunakan Next.js 15, React 19, dan Tailwind CSS v4. Antarmuka dipisahkan per peran pengguna agar jalur kerja lebih jelas, dengan route untuk siswa, guru, orang tua, admin, dan kurator. Di dalam frontend ini juga terdapat _session relay route_ untuk menyimpan `token` dan `role` sebagai _HttpOnly cookie_, middleware proteksi route per peran, halaman admin untuk audit login, serta komponen _eye-tracking_ dan _focus detection_ yang dijalankan di sisi klien.

== Logging Dashboard
Dashboard logging dibangun sebagai aplikasi Next.js terpisah pada folder `03_Source_Code/logging-dashboard/`. Versi implementasi saat ini menggunakan Next.js 16, React 19, dan route proxy `/api/audit-logs` yang meneruskan request ke endpoint backend `auth/admin/audit-logs/standalone` dengan header `x-audit-dashboard-key`. Pemisahan ini mempermudah demonstrasi komponen _Accounting_ dari AAA secara eksplisit tanpa mewajibkan browser menyimpan JWT admin.

= Implementasi Keamanan

== Authentication
Lapisan autentikasi mendukung lima peran: `teacher`, `student`, `parent`, `admin`, dan `curator`. Implementasi final mencakup:

- JWT sebagai _access token_;
- penyimpanan `token` dan `role` dalam _HttpOnly cookie_ melalui route frontend `/api/auth/set-session`;
- pembatasan laju login berbasis `ThrottlerGuard` dengan batas global `5 request / 60 detik`;
- _account lockout_ setelah 5 kegagalan login selama 15 menit;
- validasi panjang minimum password pada DTO login/registrasi sesuai peran (6 atau 8 karakter, tergantung endpoint);
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
- logout.

Pada implementasi saat ini, event di atas disimpan ke tabel `auth_audit_logs` di database lengkap dengan `userId`, `role`, `ipAddress`, `userAgent`, dan `createdAt`. Frontend admin dan dashboard standalone membaca data audit ini secara langsung dari backend. Kode backend juga mencoba menulis baris JSON ke sebuah file audit, namun path file tersebut saat ini masih berupa path absolut lokal pengembang; karena itu artefak `05_Testing/auth_activity.log` di repositori lebih tepat diperlakukan sebagai contoh bukti, sedangkan sumber audit operasional utamanya adalah database.

== Digital Signature
Implementasi tanda tangan digital menggunakan RSA-SHA256. Modul ini menghasilkan pasangan kunci dari variabel lingkungan bila tersedia, atau membuat pasangan ephemeris untuk lingkungan pengembangan. Pada kode saat ini, tanda tangan diterapkan ketika `finishTestSession()` menyimpan hasil akhir sesi tes, dengan payload yang mencakup `id`, `studentId`, `score`, dan `medal`, lalu disimpan ke `resultSignature`. Hal ini memberikan jejak integritas dan _non-repudiation_ pada hasil evaluasi siswa.

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
  [Integrasi], [Finish test session dan unit test signature], [Membuktikan modul dipakai di alur hasil evaluasi],
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
Guru dapat melakukan registrasi akun guru serta menambahkan siswa dan relasi orang tua melalui backend. Seeder juga menyiapkan akun admin dan kurator berbasis environment untuk keperluan pengelolaan konten. Aturan validasi password saat ini tidak sepenuhnya seragam antar endpoint, namun semua alur login dan registrasi tetap melewati validasi DTO dan hashing `bcrypt`.

== Login Multi-Peran
Pengguna melakukan login melalui antarmuka sesuai peran. Setelah kredensial diverifikasi, token ditetapkan melalui jalur session yang lebih aman. Pada setiap request berikutnya, backend memvalidasi token dan memeriksa kesesuaian peran sebelum memberikan akses data.

== Sesi Membaca dan Eye-Tracking
Siswa membaca materi sesuai level. Komponen _eye-tracking_ dan _focus detection_ dijalankan di browser untuk mengamati pola perhatian, sementara backend mengelola sesi tes, soal STT, penyimpanan jawaban, event distraksi, ringkasan distraksi, perhitungan skor, dan medal. Untuk pre-test dan pembuatan soal dari cerita, backend memanfaatkan OpenRouter agar prompt evaluasi dapat dibangkitkan dinamis.

== Kurasi dan Persetujuan Cerita
Cerita baru atau perubahan konten melewati jalur admin dan kurator. Dengan demikian, konten pembelajaran tidak langsung masuk ke alur utama tanpa proses validasi.

= Hasil Pengujian

== Bukti Pengujian Keamanan
Pengujian keamanan yang terdokumentasi langsung di repositori saat ini terdiri dari:

- verifikasi `AuthGuard` untuk kasus akses benar, salah peran, dan tanpa token;
- verifikasi modul RSA signature terhadap payload valid, payload termodifikasi, dan signature palsu;
- pengujian unit untuk komponen inti backend lain yang terkait alur domain;
- _source code_ e2e test untuk autentikasi admin, guru, siswa, orang tua, dan dashboard.

Artefak eksekusi yang dibundel dalam repositori tersedia pada `05_Testing/unit-test-security.log`, sedangkan `05_Testing/auth_activity.log` hanya berisi contoh inisialisasi log, bukan dump lengkap aktivitas runtime.

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
  [AuthGuard AAA], [PASS], [Log unit test menunjukkan validasi 401 dan 403 berjalan sesuai ekspektasi.],
  [Digital Signature RSA], [PASS], [Log unit test menunjukkan payload valid lolos, payload dan signature termodifikasi ditolak.],
  [Regression Unit Backend], [PASS], [`05_Testing/unit-test-security.log` mencatat 9 suite dan 59 test lulus.],
  [E2E Auth dan Dashboard], [AVAILABLE], [Spec tersedia di `backend/test/e2e`, namun log eksekusinya tidak dibundel pada repositori.],
  [Security Audit Log], [IMPLEMENTED], [Audit disimpan di database dan divisualisasikan di frontend admin maupun dashboard standalone.],
)

== Keterbatasan yang Masih Perlu Ditingkatkan
Walaupun kontrol inti telah terpasang, beberapa perbaikan lanjutan masih layak dipertimbangkan:

- rotasi kunci RSA secara terjadwal untuk lingkungan produksi;
- normalisasi path file audit agar tidak bergantung pada path absolut lokal pengembang;
- enkripsi lebih lanjut untuk data kognitif yang sangat sensitif;
- _end-to-end testing_ lintas frontend-backend yang lebih luas;
- penguatan fallback bila layanan OpenRouter tidak tersedia;
- integrasi observabilitas produksi untuk audit log real-time.

= Panduan Instalasi dan Operasional

== Prasyarat
Lingkungan minimum yang diperlukan:

- Node.js 18 atau lebih baru;
- MySQL;
- npm;
- konfigurasi variabel lingkungan backend, frontend, dan dashboard standalone.

== Menjalankan Backend
1. Buka folder `03_Source_Code/backend/`.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.development` untuk pengembangan lokal.
4. Buat folder `logs/` bila dibutuhkan oleh logger lokal.
5. Jalankan migrasi dengan `npm run migration:run`.
6. Jalankan seed awal dengan `npm run db:seed`.
7. Mulai server pengembangan dengan `npm run start:dev`.

Catatan: backend tidak membaca file `.env` biasa. Aplikasi memuat `.env.development`, `.env.production`, atau `.env.test` sesuai `NODE_ENV`.

== Menjalankan Frontend
1. Buka folder `03_Source_Code/frontend/`.
2. Jalankan `npm install`.
3. Siapkan `.env.local` dengan `NEXT_PUBLIC_API_URL` yang mengarah ke backend.
4. Jalankan `npm run dev`.

== Menjalankan Logging Dashboard
1. Buka folder `03_Source_Code/logging-dashboard/`.
2. Jalankan `npm install`.
3. Siapkan `.env.local` dengan `BACARITA_API_URL` dan `AUDIT_DASHBOARD_ACCESS_KEY`.
4. Jalankan `npm run dev`.
5. Bila frontend utama juga berjalan di port default Next.js, jalankan salah satunya pada port berbeda.
6. Gunakan dashboard ini untuk demonstrasi log audit, _alert_, dan ringkasan hasil uji.

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
  [`JWT_SECRET`, `JWT_EXPIRES`], [Konfigurasi token autentikasi backend.],
  [`AUDIT_DASHBOARD_ACCESS_KEY`], [Kunci akses untuk endpoint audit standalone dan logging dashboard terpisah.],
  [`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`], [Pengiriman notifikasi email.],
  [`RSA_PRIVATE_KEY`, `RSA_PUBLIC_KEY`], [Kunci untuk tanda tangan digital produksi.],
  [`OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`], [Akses integrasi AI/LLM untuk pembangkitan soal STT.],
  [`NEXT_PUBLIC_API_URL`], [Base URL backend untuk frontend utama.],
  [`BACARITA_API_URL`], [Base URL backend untuk logging dashboard standalone.],
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
Admin mengelola level, cerita, dan audit login melalui dashboard admin, sedangkan kurator memeriksa cerita berstatus menunggu persetujuan, melihat histori approval, lalu menyetujui atau menolak cerita. Pemisahan tanggung jawab ini membantu menjaga kualitas konten sekaligus memperkuat kontrol akses.

= Kesimpulan
Bacarita telah berkembang dari artefak desain awal menjadi sistem yang memiliki implementasi backend, frontend, dashboard audit, serta kontrol keamanan yang terintegrasi. Repositori akhir tidak hanya memuat source code, tetapi juga dokumentasi, log pengujian, migrasi database, dan modul tanda tangan digital yang relevan dengan kebutuhan mata kuliah Keamanan Informasi.

Secara khusus, final release ini menunjukkan bahwa kontrol AAA, hash token database, _rate limiting_, _account lockout_, audit logging berbasis database, integrasi OpenRouter, dan RSA digital signature telah masuk ke alur utama aplikasi. Dengan revisi laporan ini, deskripsi teknis kini lebih selaras dengan struktur folder, modul aktif, variabel lingkungan, dan bukti pengujian yang benar-benar tersedia pada repositori saat ini.
