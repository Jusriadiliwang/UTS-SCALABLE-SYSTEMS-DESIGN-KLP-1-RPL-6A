# Perancangan dan Pengembangan Web Sekolah Terintegrasi Berbasis Scalable System Design
> *Proyek Ujian MID Semester — Mata Kuliah: Scalable System Design*

---

## 📌 1. Judul Proyek
**Perancangan dan Pengembangan Web Sekolah Terintegrasi Berbasis Scalable System Design**

---

## 📝 2. Deskripsi Singkat Sistem
Sistem ini merupakan sebuah prototipe **Web Sekolah Terintegrasi** yang dirancang untuk menyelesaikan masalah pembagian data terpisah (*silo*) antar-bagian sekolah. Dengan menggunakan prinsip **Scalable System Design**, semua modul inti sekolah terintegrasi secara modular, menjamin konsistensi data, efisiensi administrasi, otomasi logging, serta keamanan berbasis peran pengguna.

---

## 👥 3. Anggota Kelompok & 4. Pembagian Tugas

* **Hasriana (NIM: 105841107623)** — *System Analyst / Project Lead*
  * Menyusun latar belakang, analisis kebutuhan, alur sistem, dan skenario *Use Case*.
* **Jusriadi Liwang (NIM: 10584117023)** — *System Architect*
  * Merancang arsitektur sistem, pembagian vCPU, integrasi API, strategi scaling, monitoring, dan logging.
* **Andi Naiva Noor (NIM: 105841122223)** — *Database Designer*
  * Menyusun skema database terpusat, ERD, pembuatan indeks, relasi tabel, dan konsistensi data.
* **Muh. Arfan Maulana (NIM: 105841122523)** — *UI/UX & Security Designer*
  * Mengembangkan antarmuka frontend, hak akses pengguna (RBAC), audit log, dan penyusunan laporan.

---

## 📦 5. Daftar Modul & Fitur yang Dibuat
Sistem ini terdiri dari modul-modul utama yang saling terhubung:
1. **Modul Data Kesiswaan:** Tambah, ubah, hapus data siswa, kelola kelas, wali kelas, status siswa, serta import/export data.
2. **Modul Jurnal Mengajar:** Input data harian mengajar guru, pemilihan kelas, mata pelajaran, materi, metode, catatan, dan riwayat rekapitulasi.
3. **Modul BK (Bimbingan Konseling):** Pencatatan kasus pelanggaran siswa, prestasi, konseling, catatan tindakan lanjut, dan rekap kasus.
4. **Modul Manajemen Pengguna:** Login, logout, manajemen akun, manajemen role/peran, reset password, dan pembatasan akses.
5. **Modul Monitoring & Logging:** Audit log pelacakan aktivitas pengguna (`activity_logs`) dan pemantauan sistem secara *real-time*.

---

## 🚀 6. Teknologi yang Digunakan
* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js dan Express.js
* **Database Simulasi:** JSON Lokal sebagai Centralized Database (mensimulasikan server basis data terpusat)
* **Tools:** Visual Studio Code, Git, GitHub

---

## 📂 7. Struktur Folder Proyek
Susunan repositori proyek terstruktur rapi sesuai bagan berikut:
```text
UTS-SCALABLE-SYSTEMS-DESIGN-KLP-1-RPL-6A-main/
├── data/               # Menyimpan file basis data simulasi (JSON lokal)
├── docs/               # Menyimpan file dokumentasi, arsitektur sistem, dan ERD
├── public/             # File statis frontend (HTML, CSS, dan JavaScript client)
├── .env.example        # Template konfigurasi environment (kredensial contoh)
├── .gitignore          # File untuk mengabaikan folder node_modules dan file rahasia .env
├── package.json        # Manajer dependensi npm proyek
├── package-lock.json   # Pengunci versi dependensi npm
├── README.md           # Berkas dokumentasi utama proyek ini
└── server.js           # Berkas server backend utama (Express.js)

---

## 🏗️ 8. Rancangan Arsitektur Sistem & Pembagian vCPU
Sistem dimodelkan menggunakan pendekatan **Modular Monolith menuju Service-Based Architecture**. Distribusi beban kerja disimulasikan menggunakan 6 node virtual (vCPU) demi menjamin skalabilitas horizontal:
* **vCPU 1:** Layanan Web Jurnal Mengajar (Dipisah karena beban tinggi diakses berkala oleh guru setiap hari).
* **vCPU 2:** Layanan Web BK Service (Dipisah demi menjaga kerahasiaan data kasus dan informasi sensitif siswa).
* **vCPU 3:** Layanan Web Kesiswaan Service (Mengelola operasional data utama siswa).
* **vCPU 4:** Layanan Web Akademik & User Service (Manajemen akun pengguna dan otorisasi sistem).
* **vCPU 5:** *Database Server* Terpusat (Node khusus MySQL/PostgreSQL demi stabilitas penyimpanan data).
* **vCPU 6:** *Load Balancer (Nginx)*, Backup otomatis harian/mingguan, Monitoring Server, dan Layanan Logging.

---

## 💾 9. Rancangan Database
Sistem mewajibkan penggunaan **Centralized Database (Satu Database Utama)** agar data tetap konsisten dan bebas dari duplikasi data redundan.

### Tabel Utama yang Tersedia:
* `users` & `roles` (Manajemen login & perizinan role)
* `students` & `classes` (Data siswa dan pemetaan kelas)
* `teachers` & `subjects` (Master data guru dan mata pelajaran)
* `academic_years` & `semesters` (Pengaturan waktu akademik)
* `teaching_journals` (Catatan harian mengajar)
* `bk_cases`, `bk_counseling_notes`, `student_violations`, `student_achievements` (Log catatan BK)
* `schedules` (Jadwal pelajaran sekolah)
* `activity_logs` (Pusat audit log sistem)

*(Diagram ERD dan visualisasi arsitektur lengkap diletakkan di dalam folder `docs/`)*.

---

## ⚙️ 10. Cara Instalasi
1. Unduh atau clone proyek web sekolah terintegrasi ini.
2. Jalankan perintah di bawah ini melalui terminal di root folder untuk memasang dependensi:
   ```bash
   npm install
🖥️ 11. Cara Menjalankan Aplikasi
Start server aplikasi dengan mengeksekusi perintah berikut:

    ```Bash
    npm start
Buka peramban internet (browser) Anda lalu jalankan alamat:
Plaintext
http://localhost:3000

🔐 12. Akun Login Demo
Uji coba simulasi hak akses (Role-Based Access Control) dapat dilakukan menggunakan akun dummy berikut dengan password default password123:

- Peran: Admin
    Email: admin@sekolah.test
    Hak Akses Utama: Mengelola seluruh data master sekolah & melihat seluruh log audit.

- Peran: Kepala Sekolah
    Email: kepala@sekolah.test
    Hak Akses Utama: Memantau dasbor performa guru dan laporan rekapitulasi sekolah.

- Peran: Guru
    Email: guru@sekolah.test
    Hak Akses Utama: Mengisi input data jurnal mengajar harian milik pribadi.

-Peran: Guru BK
    Email: bk@sekolah.test
    Hak Akses Utama: Mengelola catatan konseling, pelanggaran, dan kasus rahasia kesiswaan.

- Peran: Wali Kelas
    Email: wali@sekolah.test
    Hak Akses Utama: Melihat data khusus siswa terbatas hanya untuk kelas bimbingannya.

- Peran: Siswa
    Email: siswa@sekolah.test
    Hak Akses Utama: Memeriksa data akademik personal dan jadwal mata pelajaran.

- Peran: Orang Tua
    Email: ortu@sekolah.test
    Hak Akses Utama: Memantau perkembangan belajar serta absensi anak yang terhubung.

📺 13. Link Video Presentasi YouTube
Tautan dokumentasi video presentasi kelompok kami terkait pemaparan arsitektur dan demo aplikasi:
🔗 Tautan YouTube: 

⚡ 14. Penerapan Unsur Scalable System Design
- Modular Architecture: Setiap fungsi dipisahkan ke modul logis (Kesiswaan, Jurnal, BK) agar kode bersifat loose-coupling dan aman saat dikembangkan di masa depan.
-Centralized Database: Mengintegrasikan seluruh modul ke satu database utama guna menghindari data ganda dan ketidaksinkronan data siswa.
-API-Based Integration: Komunikasi data dilakukan berbasis RESTful API sehingga sistem siap beralih ke struktur Microservices murni kapan saja.
-Role-Based Access Control (RBAC): Proteksi hak akses ketat guna mengunci data sensitif seperti rahasia BK dari role lain.
-Database Optimization & Caching: Pembuatan indeks pada kolom relasional kunci (student_id, class_id, dll.) guna mempercepat laju pembacaan query basis data.
-Monitoring & Logging: Aktivitas sistem dicatat langsung di activity_logs guna mempermudah penanganan error atau deteksi beban puncak aplikasi.