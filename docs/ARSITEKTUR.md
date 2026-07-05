# Rancangan Arsitektur Sistem

```text
User / Browser
    |
Load Balancer / Nginx
    |
    +-- vCPU 1: Modul Jurnal Mengajar
    +-- vCPU 2: Modul BK
    +-- vCPU 3: Modul Data Kesiswaan
    +-- vCPU 4: Akademik & Manajemen Pengguna
            |
        API Gateway
            |
        vCPU 5: Centralized Database
            |
        vCPU 6: Backup, Monitoring, Logging
```

## Pembagian vCPU

| vCPU | Layanan | Alasan |
|---|---|---|
| vCPU 1 | Jurnal Mengajar | Banyak diakses guru setiap hari |
| vCPU 2 | BK | Data sensitif dan akses terbatas |
| vCPU 3 | Data Kesiswaan | Sumber data siswa |
| vCPU 4 | Akademik & User Service | Akun dan hak akses |
| vCPU 5 | Database Server | Pusat penyimpanan |
| vCPU 6 | Load Balancer, Backup, Monitoring, Logging | Stabilitas dan audit |
