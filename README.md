# MID SSD Web Sekolah Terintegrasi

## Judul Proyek
Perancangan dan Pengembangan Web Sekolah Terintegrasi Berbasis Scalable System Design

## Deskripsi Singkat
Repository ini berisi prototipe web sekolah terintegrasi untuk Ujian MID mata kuliah Scalable System Design. Sistem memiliki modul Jurnal Mengajar, BK, Data Kesiswaan, Manajemen Pengguna, Monitoring & Logging, serta dokumentasi arsitektur scalable.

## Modul yang Dibuat
1. Data Kesiswaan
2. Jurnal Mengajar
3. Bimbingan Konseling / BK
4. Manajemen Pengguna
5. Monitoring dan Logging
6. Dokumentasi Scalable System Design

## Teknologi
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js dan Express.js
- Database simulasi: JSON lokal sebagai centralized database
- Tools: VS Code, GitHub

## Cara Instalasi
```bash
npm install
```

## Cara Menjalankan
```bash
npm start
```

Buka:
```text
http://localhost:3000
```

## Akun Demo
| Role | Email | Password |
|---|---|---|
| Admin | admin@sekolah.test | password123 |
| Kepala Sekolah | kepala@sekolah.test | password123 |
| Guru | guru@sekolah.test | password123 |
| Guru BK | bk@sekolah.test | password123 |
| Wali Kelas | wali@sekolah.test | password123 |
| Siswa | siswa@sekolah.test | password123 |
| Orang Tua | ortu@sekolah.test | password123 |

## Struktur Folder
```text
public/
data/
docs/
screenshots/
server.js
package.json
README.md
.env.example
```

## Scalable System Design
- Modular Architecture: sistem dibagi menjadi beberapa modul.
- Centralized Database: semua modul memakai satu database utama.
- API-Based Integration: frontend mengambil data melalui API.
- Role-Based Access Control: menu dan data dibatasi berdasarkan role.
- Monitoring & Logging: aktivitas pengguna dicatat pada activity_logs.
- Horizontal Scaling: server modul ramai dapat ditambah.
- Vertical Scaling: database server dapat ditingkatkan CPU/RAM/storage.
- Caching: data kelas, guru, mapel, dan jadwal dapat di-cache.
- Database Optimization: index pada student_id, teacher_id, class_id, subject_id.

## Link Video YouTube
Isi setelah upload video:
```text
https://youtube.com/...
```
