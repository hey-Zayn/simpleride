# Uber Clone Platform - About Documentation

## 1. Project Overview

This is a **real-time ride-hailing platform** (Uber clone) built with a **microservices architecture**. The system consists of:

- **Gateway** (Express + Node.js) - API gateway and WebSocket proxy
- **4 backend services** - auth, location, notification, ride
- **Frontend** - Next.js 16 with React 19
- **Infrastructure** - Docker, Redis, RabbitMQ, PostgreSQL, gRPC, Nginx

All backend services use **Prisma ORM** with **PostgreSQL** and communicate via **RabbitMQ** for event-driven workflows. Real-time features use **Socket.IO** over WebSockets.

---

## 2. Architecture & Infrastructure

### Docker-Compose Setup (`docker-compose.yaml`)

| Service | Ports | Description |
|---------|-------|-------------|
| **nginx** | 8000:80 | Reverse proxy, forwards to gateway |
| **redis** | 6379:6379 | Geo-spatial indexing, caching |
| **rabbitmq** | 5672:5672, 15672:15672 | Message broker for inter-service events |
| **gateway** | 5000:5000 | Express reverse proxy, routes to all services |
| **auth-service** | 3001:4001 | Authentication, JWT, driver management |
| **location-service** | 3002:4002, 50051:50051 | Driver location tracking, gRPC, Redis geo |
| **notification-service** | 3003:4003 | Ride events, Socket.IO, email notifications |
| **ride-service** | 3004:4004 | Ride creation, bidding, status management |

**Nginx Reverse Proxy** (`nginx/nginx.conf`):
- Listens on port 80
- Proxies to `upstream gateway:5000`
- **Critical WebSocket config**: Sets `Upgrade` and `Connection` headers, `proxy_http_version 1.1`
- Required for Socket.IO to work properly

---

## 3. Backend Services

### 3.1 Auth Service (`backend/services/auth-service`)

- **Port**: 4001
- **Tech**: Express, JWT, Bcrypt, Zod validation, PostgreSQL
- **Key Files**:
  - `src/app.js` - Express app with CORS, JSON parser, cookie-parser
  - `src/routes/auth.routes.js` - Auth routes: register, login, refresh, me, driver status, logout
  - `src/controllers/auth.controller.js` - Authentication logic
  - `src/middlewares/` - auth.middleware, rateLimiter, validate (Zod)
  - `src/services/auth.service.js` - Business logic with Prisma transactions
  - `src/utils/jwt.utils.js` - Token generation/verification

- **Database**: User + DriverProfile models (one-to-one, optional)

- **Key Features**:
  - JWT authentication with access tokens (1day) + refresh tokens (7days)
  - Rate limiting: 100 requests/min per IP
  - Cookie-based session management
  - Driver status toggling (online/offline)

### 3.2 Location Service (`backend/services/location-service`)

- **Port**: 4002
- **Tech**: Express, Socket.IO, gRPC, amqplib, ioredis, mongoose
- **Key Files**:
  - `src/index.js` - Express app, RabbitMQ consumer, gRPC server init, Socket.io
  - `src/config/rabbitmq.js` - Consumes ride events, finds nearby drivers, emits to Socket.IO rooms
  - `src/config/grpc.js` - gRPC server loading `location.proto`
  - `src/config/redis.js` - Redis client for geo-indexing driver locations
  - `src/services/location.service.js` - `geoadd`/`geosearch` for spatial queries
  - `src/services/socket.service.js` - Socket.io with JWT auth, `join_ride_room`, `update_location`
  - `grpc/server.js` & `grpc/location.handler.js` - gRPC service implementation
  - `proto/location.proto` - gRPC protocols

- **Database**: PostgreSQL (Prisma) + MongoDB (schematically present)

- **Key Features**:
  - **Redis Geo-indexing**: `drivers:locations` key with `GEOADD`/`GEOSEARCH` for nearby driver queries
  - **gRPC**: `GetNearbyDrivers` RPC from ride service
  - **Socket.IO**: Real-time driver location updates with JWT authentication
  - **RabbitMQ consumer**: Processes ride events to find nearby drivers
  - Dual database: PostgreSQL for persistence + MongoDB for flexible schemas

### 3.3 Notification Service (`backend/services/notification-service`)

- **Port**: 4003
- **Tech**: Express, Socket.IO, amqplib, nodemailer, PostgreSQL/Prisma
- **Key Files**:
  - `src/index.js` - Express app, HTTP server, Socket.io init, RabbitMQ consumer (after socket init)
  - `src/config/rabbitmq.js` - Consumes all `ride.#` events, dispatches to handlers
  - `src/config/db.js` - PostgreSQL + Prisma adapter
  - `src/services/notification.service.js` - Event handlers for all ride lifecycle events
  - `src/services/email.service.js` - Gmail SMTP receipt sending on ride completion
  - `src/socket.js` - Socket.io initialization with `join` and `join_driver_pool` events
  - `src/routes/notification.routes.js` - `GET /user/:userId` for notification history

- **Key Features**:
  - **RabbitMQ topic exchange**: Consumes `ride.#` routes for all ride events
  - **Socket.IO broadcasting**: Dispatches events to driver/rider rooms
  - **Email notifications**: Gmail SMTP for ride completion receipts
  - **Notification history**: API endpoint to fetch user's notification history

### 3.4 Ride Service (`backend/services/ride-service`)

- **Port**: 4004
- **Tech**: Express, BullMQ, amqplib, gRPC, Prisma, PostgreSQL
- **Key Files**:
  - `src/app.js` - Express app with CORS, JSON parser, ride routes
  - `src/index.js` - Server init with RabbitMQ connect, Prisma, BullMQ worker setup
  - `src/config/rabbitmq.js` - Connects to RabbitMQ, provides `publishEvent`
  - `src/config/bullmq.js` - `bidding-lifecycle-queue` with `scheduleBidExpiration` (2-min delay)
  - `src/workers/bidding.worker.js` - Bid expiration worker
  - `src/config/prisma.js` - PostgreSQL + Prisma adapter
  - `src/config/grpcClient.js` - gRPC client to location-service for `GetNearbyDrivers`
  - `src/routes/ride.routes.js` - Estimate, create, bid, status, history routes

- **Database**: Ride + Bid models with enum statuses (REQUESTED, ACCEPTED, COMPLETED, etc.)

- **Key Features**:
  - **BullMQ bidding queue**: 2-minute timeout for ride bids (`CHECK_BID_EXPIRATION` job)
  - **gRPC client**: Calls location-service for nearby drivers
  - **Ride lifecycle**: REQUESTED → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
  - **Counter-bid system**: Riders can see driver's counter-offer
  - **Graceful shutdown**: Handles SIGTERM/SIGINT with Prisma disconnect

---

## 4. Gateway (`backend/gateway`)

- **Port**: 8000 (docker maps to 5000)
- **Tech**: Express 5, `express-http-proxy`, `http-proxy-middleware`, `ioredis`, `jsonwebtoken`
- **Key Functionality**:
  - **HTTP Proxy**: Routes `/auth`, `/location`, `/notification`, `/ride` to respective services
  - **WebSocket Proxy**: Upgrade connections for both notification and location WS
  - **Health check**: `GET /` returns status
  - **CORS**: Configured for `http://localhost:3000`

- **Dependencies**: express, express-http-proxy, http-proxy-middleware, helmet, cors, ioredis, jsonwebtoken, rate-limit-redis

- **Proxy configuration** in `docker-compose.yaml`: depends on all 4 services

---

## 5. Frontend (`frontend/`)

- **Framework**: Next.js 16.3.0, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn-ui components
- **Key directories**:
  - `src/app/` - Root layout and page
  - `src/components/auth/` - AuthLayout, AuthProvider, VehicleSelector, AuthBanner
  - `src/components/rider/` - Rider flow: MapView, BookingPanel, ActiveRideCard
  - `src/components/driver/` - DriverDashboard, RideRequestToast, DriverHeader
  - `src/components/map/` - RideMap component
  - `src/components/ui/` - Full suite of shadcn-ui primitives (button, card, dialog, etc.)
  - `src/components/skeletons/` - MapViewSkeleton, FareSectionSkeleton
  - `src/hooks/` - Custom hooks: `useDriverLocation`, `useRiderGpsTracker`, `useDriverSockets`, `useRiderSockets`, `useMobile`
  - `src/providers/` - `SocketProvider` (wraps AuthProvider + SocketProvider, provides toast notifications)
  - `src/lib/sockets.ts` - Creates `notificationSocket` and `locationSocket`

- **Key Frontend Features**:
  - **Socket.IO client**: `notificationSocket` goes through gateway (`/socket.io` path), `locationSocket` connects directly to location-service:3002
  - **Map integration**: leaflet, mapbox-gl, react-leaflet, maplibre-gl
  - **State management**: zustand + react-query (tanstack)
  - **Forms**: react-hook-form with Zod validation
  - **Date handling**: date-fns
  - **Carousels**: embla-carousel-react

- **Environment variables**: `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_LOCATION_SOCKET_URL`

---

## 6. Communication Patterns

### Event-Driven Workflow (RabbitMQ)

```
ride_events topic exchange
│
├── ride.requested          → Location service finds drivers + Notification to driver pool
├── ride.accepted           → Rider notified, driver pool cleared
├── ride.counter_bid        → Rider sees driver's counter-offer
├── ride.status_updated     → Socket.IO updates (ARRIVED, IN_PROGRESS, COMPLETED)
├── ride.completed          → Email receipt sent, notification broadcast
└── ride.cancelled          → Cleanup, notifications sent
```

### Real-Time Infrastructure

**Dual Socket.IO setup**:

1. **`notificationSocket`** (frontend):
   - Connects to gateway:8000 `/socket.io`
   - Proxied to notification-service via nginx
   - Handles: ride events, notifications, completion alerts

2. **`locationSocket`** (frontend):
   - Connects directly to location-service:3002
   - Includes JWT auth token
   - Handles: driver location updates, ride tracking

### gRPC Calls

- **Ride Service** → **Location Service**: `GetNearbyDrivers` RPC
- Returns nearby drivers based on passenger location + radius

### HTTP Proxy (Gateway)

- `/auth/*` → auth-service:4001
- `/location/*` → location-service:4002
- `/notification/*` → notification-service:4003
- `/ride/*` → ride-service:4004

---

## 7. Security & Patterns

### Authentication & Authorization

- **JWT tokens**: Access tokens (1 day expiration) + Refresh tokens (7 day expiration)
- **Cookie-based auth**: Cookies stored in httpOnly flags where applicable
- **Role-based access**: Regular users vs drivers (DriverProfile one-to-one with User)
- **Middleware protection**: auth.middleware in all services validates tokens

### Input Validation

- **Zod schemas**: Used across all services for registration, login, driver status, ride estimation
- **Centralized validation**: validate middleware wrapper
- **Type-safe**: Zod inferred types match Prisma schemas

### Headers & Observability

- **Helmet headers**: Enabled in gateway and all services (XSS, CSP, HSTS, etc.)
- **Rate limiting**: Auth service has 100 requests/min per IP (rateLimiter middleware)
- **Global error handlers**: Present in all service `app.js` files
- **Graceful shutdown**: Ride service handles SIGTERM/SIGINT with Prisma disconnect

### Data Patterns

- **Prisma ORM**: Consistent across all 4 services with PostgreSQL
- **Enum statuses**: Ride statuses (REQUESTED, ACCEPTED, COMPLETED, CANCELLED) in ride-service
- **Geo-spatial**: Redis GEOADD/GEOSEARCH for driver proximity queries
- **One-to-one relationships**: User ↔ DriverProfile (auth-service)

### Job Queue Patterns

- **BullMQ**: Bidding lifecycle queue with 2-minute bid expiration timeout
- **Scheduled jobs**: `scheduleBidExpiration` checks and rejects expired bids
- **Workers**: `bidding.worker.js` processes bid expiration logic

---

## 8. Current Data & Status

### Services Running

Based on docker-compose configuration, all services are set up with:

- **Auth Service**: Ready, handles user authentication
- **Location Service**: Ready, tracks driver locations via Redis geo
- **Notification Service**: Ready, handles ride events + emails
- **Ride Service**: Ready, manages ride creation + bidding
- **Gateway**: Ready, proxies to all services
- **Nginx**: Ready, handles WebSocket upgrades
- **Redis**: Ready, geo-indexing active
- **RabbitMQ**: Ready, event routing active

### Databases

- **PostgreSQL**: Used by all 4 services via Prisma
- **Redis**: Used for geo-spatial indexing + caching
- **RabbitMQ**: Used for inter-service events (guest/guest credentials)
- **MongoDB**: Referenced in location-service but commented out in docker-compose (not currently running)

### Key Environment Variables

**Gateway** (`backend/gateway/.env`):
- `GATEWAY_URL`, CORS origins, JWT secrets

**Auth Service** (`backend/services/auth-service/.env`):
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, rate limiter config

**Location Service** (`backend/services/location-service/.env`):
- `REDIS_URL`, `RABBITMQ_URL`, gRPC config

**Notification Service** (`backend/services/notification-service/.env`):
- `EMAIL_USER`, `EMAIL_PASS` (Gmail SMTP), RabbitMQ config

**Ride Service** (`backend/services/ride-service/.env`):
- `RABBITMQ_URL`, BullMQ queue names, gRPC client config

**Frontend** (`frontend/.env`):
- `NEXT_PUBLIC_GATEWAY_URL`
- `NEXT_PUBLIC_LOCATION_SOCKET_URL`

---

## 9. Development & Deployment

### Local Development

1. **Start infrastructure**: `docker-compose up -d redis rabbitmq nginx`
2. **Start services**: `docker-compose up -d` (each service builds from its directory)
3. **Frontend**: `npm run dev` in frontend directory (Next.js 16)
4. **Access points**:
   - Frontend: `http://localhost:3000` (via nginx on port 80) or `http://localhost:3000` directly
   - Gateway: `http://localhost:5000`
   - Services internal: ports 4001-4004

### Project Structure Summary

```
uber-clone/
├── docker-compose.yaml       # Infrastructure orchestration
├── nginx/
│   └── nginx.conf          # Reverse proxy with WebSocket support
├── backend/
│   ├── gateway/            # Express proxy (port 5000)
│   └── services/           # 4 microservices (ports 4001-4004)
│       ├── auth-service/
│       ├── location-service/
│       ├── notification-service/
│       └── ride-service/
└── frontend/               # Next.js 16 + React 19 + TypeScript
```

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (ES modules, `"type": "module"`) |
| **Web Framework** | Express (backend), Next.js 16 (frontend) |
| **Database** | PostgreSQL (all services) + MongoDB (location-service, commented out) |
| **ORM** | Prisma Client v7 with PostgreSQL adapter |
| **Cache/Store** | Redis (ioredis) for geo-spatial + BullMQ for job queues |
| **Messaging** | RabbitMQ (topic exchange for ride events) |
| **gRPC** | @grpc/grpc-js + @grpc/proto-loader for location service |
| **Real-time** | Socket.IO (both sides) |
| **Frontend UI** | React 19, Next.js 16, Tailwind CSS v4, shadcn-ui |
| **HTTP Client** | axios |
| **Validation** | Zod, Joi |
| **Container** | Docker |

---

## 10. Key Architecture Decisions

1. **Microservices over monolith**: Each concern (auth, location, notifications, rides) is isolated
2. **Dual real-time channels**: Separate Socket.IO connections for notifications vs location tracking
3. **Spatial indexing with Redis**: Geo-queries for nearby drivers without database spatial extensions
4. **Event-driven lifecycle**: RabbitMQ events coordinate complex ride workflows across services
5. **Gateway as single entry point**: Simplifies frontend service interactions + provides WS proxy
6. **Nginx edge layer**: Required for Socket.IO WebSocket upgrade headers
7. **BullMQ for background jobs**: Bid expiration decoupled from main request cycle
8. **Prisma consistent ORM**: Same pattern across all services for database consistency

This documentation was generated from codebase analysis and represents the current state of the Uber clone platform.