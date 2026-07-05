```mermaid
flowchart TD
A[User/Browser] --> B[Load Balancer]
B --> C[Jurnal Mengajar]
B --> D[BK]
B --> E[Data Kesiswaan]
B --> F[User Service]
C --> G[API Gateway]
D --> G
E --> G
F --> G
G --> H[Centralized Database]
H --> I[Monitoring & Logging]
```
