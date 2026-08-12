# Tech Stack Reference

| Service          | Framework           | Port         | Primary DB / Storage | Communication          |
| :--------------- | :------------------ | :----------- | :------------------- | :--------------------- |
| **Gateway**      | Express / Nginx     | 5000 / 8000  | N/A                  | REST / WS Proxy        |
| **Auth**         | Node.js / Express   | 4001         | MongoDB / PostgreSQL | REST                   |
| **Location**     | Express / Socket.IO | 4002 / 50051 | Redis (Geospatial)   | WS / gRPC              |
| **Notification** | Express / Socket.IO | 4003         | PostgreSQL           | Socket.IO / RabbitMQ   |
| **Ride**         | Express / BullMQ    | 4004         | PostgreSQL           | REST / gRPC / RabbitMQ |

**Key Dependencies:** Prisma ORM, Socket.IO, BullMQ, Nodemailer, Leaflet, Zustand.
