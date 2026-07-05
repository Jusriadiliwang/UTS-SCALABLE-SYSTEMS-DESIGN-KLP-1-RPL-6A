# Scalable System Design

1. Modular Architecture: sistem dibagi menjadi modul.
2. Centralized Database: semua data utama berada dalam satu database.
3. Load Balancing: request dibagi melalui load balancer.
4. Horizontal Scaling: menambah server untuk modul yang ramai.
5. Vertical Scaling: menambah CPU, RAM, dan storage.
6. API-Based Integration: modul mengambil data melalui API.
7. Role-Based Access Control: akses dibatasi berdasarkan role.
8. Database Optimization: index dan query efisien.
9. Caching: data yang sering diakses disimpan sementara.
10. Monitoring dan Logging: aktivitas pengguna dicatat.

## Risiko dan Solusi
| Risiko | Solusi |
|---|---|
| Database bottleneck | Index, cache, vertical scaling |
| Akses jurnal tinggi | Horizontal scaling |
| Data BK bocor | RBAC dan audit log |
| Server gagal | Backup dan monitoring |
