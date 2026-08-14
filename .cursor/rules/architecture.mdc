# Architecture Overview

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Language** | TypeScript (frontend) / JavaScript (backend) | Shared types via protobuf |
| **Frontend** | Next.js 14 (App Router) • React 18 • Tailwind CSS • Zustand • Leaflet | SSR & SSG for pages, CSR for interactive parts |
| **Backend Services** | Node.js • Express • gRPC • Socket.io • BullMQ • Prisma ORM | Four microservices: auth, location, notification, ride |
| **Databases** | PostgreSQL (via Prisma) • Redis (geospatial & caching) • RabbitMQ (event bus) | MongoDB is listed in tech‑stack.md but not currently used |
| **Protobuf** | `@grpc/proto-loader` • `proto/location.proto` | Defines `DriverLocation`, `NearbyDriversRequest/Response` |
| **Container & Orchestration** | Docker • docker‑compose • Nginx reverse proxy | Services exposed on ports 4001‑4004, gateway on 8000 |
| **CI / CD** | Git • GitHub Actions (implicit) | Lint/typecheck not configured yet |
| **Other** | Nodemailer • Leaflet • jsonwebtoken • BullMQ workers | |

## High‑Level Architecture

```
+---------------------+      HTTPS/WSS      +----------------------+
|   Frontend (Next)   | <-----------------|   API Gateway (8000) |
+----------+----------+                    +--------+------------+
           |                                           |
           |   REST      WS      gRPC               |
           v                                           v
+----------------------+   +----------------------+   +----------------------+
|   Auth Service (4001)|   | Location Service (4002) |   | Notification Service (4003) |
+----------+-----------+   +----------+------------+   +----------+-------------+
           |                     |   geo/redis        |   |   PostgreSQL      |
           |   JWT           WS   |   geosearch       |   |   (Prisma)        |
           v                     v   +--------+--------+   v   +----------+----------+
+----------------------+   +----------------------+   +----------------------+
|   Ride Service (4004)                                    |
+----------------------+                                       |
        |            REST / gRPC / RabbitMQ                   |
        v                                                   v
  +----------------------+                        +---------------------+
  |   PostgreSQL (via Prisma)                    RabbitMQ (ride_events) |
  +----------------------+                        +---------------------+

```

### Data Flow

1. **User onboards / logs in** → Auth service issues JWT (access & refresh).
2. Frontend stores token; every API call includes `Authorization: Bearer <access>`.
3. **Ride request**: Frontend → Gateway → Ride service.
   - Ride service validates rider bid, fetches nearby drivers via gRPC to Location service (Redis Geo‑search).
   - Publishes `ride.requested` event to RabbitMQ.
4. **Location updates**: Driver client sockets (Socket.io) send `update_location` → Location service stores in Redis Geo; broadcasts to relevant ride rooms.
5. **Bid process**: BullMQ worker checks bid expiration; if no acceptance within 2 min, marks ride `EXPIRED` and publishes `ride.expired`.
6. **Driver accepts** → Ride service atomically updates ride status, cancels expiration job, publishes `ride.accepted`.
7. **Ride completion** → Notification service creates DB entry, sends Socket.io events to rider & driver, triggers email receipt via Nodemailer.
8. **Gateway**: Proxies HTTP & WebSocket traffic to the appropriate service; also handles Socket.io polling fallback.

### Service Responsibilities

| Service | Primary Role | Key APIs / Events |
|---------|--------------|-------------------|
| **Auth** | User/Driver registration, login, token issuance & rotation | `POST /register`, `POST /login`, `POST /refresh`, WS `logout` |
| **Location** | Real‑time driver location, geofence queries, nearby‑driver discovery | `POST /update`, `GET /nearby`, gRPC `GetNearbyDrivers`, WS `update_location` |
| **Notification** | Ride‑state events, email receipts, in‑app alerts | `GET /user/:userId`, WS events: `ride.requested`, `ride.accepted`, `ride.completed`, `ride.expired` |
| **Ride** | Ride creation, bid/counter‑bid handling, status transitions, job scheduling | `POST /request`, `POST /:id/accept`, `POST /:id/counter`, `PUT /:id/status`, BullMQ `CHECK_BID_EXPIRATION` |
| **Gateway** | Single entry point, CORS, request forwarding, WS upgrade | HTTP proxy `/auth`, `/location`, `/notification`, `/ride`; WS `/socket.io` |

### Frontend Details

- **Routing**: Next.js App Router, pages under `src/app/`. Route groups `(rider)` and `(driver)` for role‑based UI.
- **State Management**: Zustand store (`store/`); holds auth token, current ride, driver list.
- **API Client**: Axios instance with automatic token attachment; interceptors refresh token on 401.
- **UI Components**: `src/components/` – Auth layout, vehicle selector, ride request toast, driver dashboard, etc.
- **Styling**: Tailwind CSS with custom theme; responsive design.
- **Maps**: Leaflet integrated for rider‑driver map view; location markers updated via WebSocket.
- **Performance**: 
  - `useDeferredValue` / `useTransition` for heavy lists.
  - React.memo on expensive components (e.g., driver list).
  - WebSocket reconnection with exponential backoff.
  - Code‑splitting via dynamic `import()` for route‑specific chunks.

### Infrastructure

- **Docker Compose** spins up all services, Redis, RabbitMQ, and PostgreSQL.
- **Nginx** listens on port 8000, terminates TLS (if configured), and proxies to the gateway.
- **Health checks** exist in each service’s `index.js`; gateway also provides a `/health` endpoint.
- **Environment variables** (` .env` files) configure DB URLs, Redis URI, RabbitMQ credentials, JWT secrets.

### Possible Improvements (Roadmap)

1. **Type‑safe API** – Generate TS clients from OpenAPI/Swagger specs.
2. **Edge caching** – Deploy Vite/Edge config for static assets.
3. **Server Components** – Move data‑fetch logic to Next.js server components to reduce JS bundle.
4. **GraphQL** – Optional if more flexible client queries are needed.
5. **Circuit Breaker** – For gRPC/third‑party calls.
6. **Observability** – Add OpenTelemetry tracing across services.
7. **Unit / Integration Tests** – Currently missing; add Jest + Supertest for backend, React Testing Library for frontend.

---

*Generated from codebase inspection (Aug 2025).*