# 🚗 Uber Clone — Full Stack Backend

A production-grade, microservices-based ride-hailing backend built with Node.js, Socket.IO, RabbitMQ, Redis, gRPC, and Docker. Inspired by Uber''s real architecture.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Services](#services)
3. [Technology Stack](#technology-stack)
4. [Port Reference](#port-reference)
5. [API Endpoints](#api-endpoints)
6. [WebSocket Events](#websocket-events)
7. [How It All Works Together](#how-it-all-works-together)
8. [Running the Project](#running-the-project)
9. [Environment Variables](#environment-variables)

---

## Architecture Overview

This backend uses a **microservices architecture** with four independent services behind an API Gateway. Each service owns its own database schema and communicates with others through:

- **HTTP (REST)** — via the API Gateway for client-facing requests
- **RabbitMQ (AMQP)** — for async event-driven communication between services
- **gRPC** — for high-performance synchronous calls (location → ride service)
- **Socket.IO (WebSockets)** — for real-time push to connected clients
- **Redis** — for geospatial driver indexing and BullMQ job queues

```
                         ┌─────────────────────────────────────┐
                         │          Docker Compose              │
                         │                                      │
  Browser / App          │  [Nginx :80]                         │
      │                  │       │                              │
      └──────────────────│───────▼                              │
                         │  [Gateway :5000]                     │
                         │    │  HTTP Proxy + WS Proxy          │
                         │    ├──/auth────────► [auth-service :4001]
                         │    ├──/location───► [location-service :4002]
                         │    ├──/notification► [notification-service :4003]
                         │    └──/ride────────► [ride-service :4004]
                         │                                      │
                         │  [RabbitMQ :5672]                    │
                         │    ├── ride.requested ──► location-service
                         │    ├── ride.requested ──► notification-service
                         │    ├── ride.accepted  ──► notification-service
                         │    ├── ride.completed ──► notification-service + location-service
                         │    ├── ride.cancelled ──► notification-service + location-service
                         │    └── ride.expired   ──► notification-service
                         │                                      │
                         │  [Redis :6379]                       │
                         │    ├── drivers:locations (GEO index) │
                         │    ├── driver:active:<id> (TTL keys) │
                         │    └── BullMQ job queues             │
                         └─────────────────────────────────────┘
```

---

## Services

### 1. API Gateway (`gateway`)
**Port:** 5000 (internal) | **Nginx:** 8000 (public)

The single entry point for all client requests. Routes HTTP traffic to the correct microservice and proxies WebSocket upgrade connections to both `notification-service` and `location-service`.

**Responsibilities:**
- HTTP reverse proxy for all 4 services
- WebSocket proxy for Socket.IO connections
- CORS handling for the frontend (origin: `http://localhost:3000`)

---

### 2. Auth Service (`auth-service`)
**Port:** 4001 (internal) | 3001 (Docker host)

Handles user registration, login, and JWT token generation/validation. Uses MongoDB for user persistence.

**Responsibilities:**
- Register users (RIDER / DRIVER roles)
- Login and issue JWT access + refresh tokens
- Token verification middleware shared across services

---

### 3. Location Service (`location-service`)
**Port:** 4002 (HTTP/WS) | 50051 (gRPC)

Manages driver live location using Redis geospatial commands. Runs a Socket.IO server for real-time GPS streaming and a gRPC server for nearby driver lookups.

**Responsibilities:**
- Store/update driver GPS coordinates in Redis `GEOSEARCH` index
- Serve `GetNearbyDrivers` via gRPC to the ride-service
- Stream live driver location to riders over WebSocket
- Clean up tracking rooms when rides end (via RabbitMQ events)

---

### 4. Notification Service (`notification-service`)
**Port:** 4003

Consumes RabbitMQ ride lifecycle events and pushes real-time notifications to connected clients via Socket.IO. Also persists notifications to a PostgreSQL database and sends Gmail email receipts on ride completion.

**Responsibilities:**
- Socket.IO server for ride event push notifications
- Consume all `ride.*` RabbitMQ events
- Log notifications to database
- Send Gmail receipts on ride completion

---

### 5. Ride Service (`ride-service`)
**Port:** 4004 (internal) | 3004 (Docker host)

Core business logic for the entire ride lifecycle — from fare estimation to OTP-verified trip start to completion. Implements a bidding system with race-condition protection.

**Responsibilities:**
- Fare estimation for BIKE, MINI, COMFORT vehicle types
- Create ride requests with custom rider bids
- Driver bid acceptance (atomic, race-condition safe)
- Driver counter-bidding and rider acceptance
- OTP verification to start trips
- Status transitions: SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
- Schedule/cancel ride expiration jobs via BullMQ
- Publish ride lifecycle events to RabbitMQ

---

## Technology Stack

| Technology    | Role                                              |
|---------------|---------------------------------------------------|
| Node.js + ESM | Runtime for all services                          |
| Express.js    | HTTP server framework                             |
| Socket.IO     | Real-time WebSocket communication                 |
| RabbitMQ      | Async event bus (topic exchange `ride_events`)    |
| Redis         | Geospatial driver index + BullMQ queue backend    |
| BullMQ        | Delayed job queue for ride expiration             |
| gRPC          | High-performance RPC between ride and location    |
| Prisma ORM    | Database access for ride, auth, notification      |
| PostgreSQL    | Ride, notification, and auth data persistence     |
| MongoDB       | Auth user storage                                 |
| Nodemailer    | Gmail SMTP email receipts                         |
| Docker        | Container runtime for all services                |
| Nginx         | Reverse proxy public entry point                  |
| JWT           | Authentication tokens                             |

---

## Port Reference

| Service              | Internal | Host  | Protocol       |
|----------------------|----------|-------|----------------|
| Nginx (public)       | 80       | 8000  | HTTP           |
| Gateway              | 5000     | 5000  | HTTP + WS      |
| auth-service         | 4001     | 3001  | HTTP           |
| location-service     | 4002     | 3002  | HTTP + WS      |
| location-service     | 50051    | 50051 | gRPC           |
| notification-service | 4003     | 3003  | HTTP + WS      |
| ride-service         | 4004     | 3004  | HTTP           |
| RabbitMQ             | 5672     | 5672  | AMQP           |
| RabbitMQ UI          | 15672    | 15672 | HTTP           |
| Redis                | 6379     | 6379  | Redis Protocol |

---

## API Endpoints

All routes below are accessed through the **Gateway** at `http://localhost:5000`.
> Append the prefix before each route path. E.g., `POST /auth/api/auth/register`

### 🔐 Auth Service — Prefix: `/auth`

| Method | Path                      | Auth | Description                          | Request Body / Params |
|--------|---------------------------|------|--------------------------------------|-----------------------|
| POST   | `/api/auth/register`      | ❌   | Register a new rider or driver       | `{ name, email, password, role }` |
| POST   | `/api/auth/login`         | ❌   | Login and receive JWT tokens         | `{ email, password }` |
| POST   | `/api/auth/refresh`       | ❌   | Refresh access token                 | `{ refreshToken }` |
| GET    | `/api/auth/profile`       | ✅   | Get current user profile             | — |
| POST   | `/api/auth/logout`        | ✅   | Invalidate tokens                    | — |

---

### 📍 Location Service — Prefix: `/location`

| Method | Path                         | Auth | Description                                | Request Body |
|--------|------------------------------|------|--------------------------------------------|--------------|
| POST   | `/api/location/update`       | ✅   | Update driver GPS coordinates in Redis     | `{ lat, lng }` |
| POST   | `/api/location/offline`      | ✅   | Remove driver from Redis geo-index         | — |
| GET    | `/api/location/nearby`       | ✅   | Find drivers near a coordinate (REST)      | `?lat=&lng=&radius=` |

---

### 🔔 Notification Service — Prefix: `/notification`

| Method | Path                                  | Auth | Description                         | Response |
|--------|---------------------------------------|------|-------------------------------------|----------|
| GET    | `/api/notifications/user/:userId`     | ❌   | Get all notifications for a user    | `{ success, data: [...notifications] }` |

---

### 🚗 Ride Service — Prefix: `/ride`

All ride endpoints require JWT auth (`Authorization: Bearer <token>`).

#### Fare Estimation

| Method | Path                  | Auth | Description                           | Request Body |
|--------|-----------------------|------|---------------------------------------|--------------|
| POST   | `/api/rides/estimate` | ✅   | Estimate fare for BIKE, MINI, COMFORT | `{ pickup: { lat, lng }, dropoff: { lat, lng } }` |

**Response:**
```json
{
  "success": true,
  "data": {
    "distanceKm": 8.4,
    "durationMins": 17,
    "estimates": {
      "BIKE":    { "fare": 120, "breakdown": {...} },
      "MINI":    { "fare": 210, "breakdown": {...} },
      "COMFORT": { "fare": 350, "breakdown": {...} }
    }
  }
}
```

---

#### Create Ride Request

| Method | Path               | Auth | Description                                     |
|--------|--------------------|------|-------------------------------------------------|
| POST   | `/api/rides/request` | ✅ | Create a ride with rider''s custom bid (in PKR) |

**Request Body:**
```json
{
  "pickupLat": 31.5204,
  "pickupLng": 74.3587,
  "pickupAddress": "Gulberg, Lahore",
  "dropoffLat": 31.4697,
  "dropoffLng": 74.2728,
  "dropoffAddress": "DHA Phase 5, Lahore",
  "vehicleType": "MINI",
  "offeredFare": 220
}
```

**Bid Validation:** Rider''s `offeredFare` must be within -5% to +15% of the system-calculated fare.

**Response:**
```json
{
  "success": true,
  "message": "Ride requested with bid",
  "data": {
    "id": "clx12abc",
    "status": "SEARCHING",
    "otp": "4829",
    "calculatedFare": 210,
    "offeredFare": 220,
    "nearbyDrivers": [...]
  }
}
```

---

#### Ride History

| Method | Path                   | Auth | Description                |
|--------|------------------------|------|----------------------------|
| GET    | `/api/rides/history/me` | ✅  | Get current user ride history |
| GET    | `/api/rides/:id`        | ✅  | Get single ride details    |

---

#### Driver Bidding

| Method | Path                               | Auth | Description                            | Body |
|--------|------------------------------------|------|----------------------------------------|------|
| PATCH  | `/api/rides/:id/accept`            | ✅   | Driver accepts rider''s offered fare   | — |
| POST   | `/api/rides/:id/counter`           | ✅   | Driver sends a counter offer           | `{ counterFare: 230 }` |
| PATCH  | `/api/rides/:id/counter/:bidId/accept` | ✅ | Rider accepts a driver counter offer | — |

**Counter bid response:**
```json
{
  "success": true,
  "message": "Counter bid sent to rider",
  "data": {
    "id": "bid_abc",
    "rideId": "ride_xyz",
    "driverId": "driver_id",
    "counterFare": 230,
    "status": "PENDING"
  }
}
```

---

#### Trip Status Updates

| Method | Path                   | Auth | Description                                                          |
|--------|------------------------|------|----------------------------------------------------------------------|
| PATCH  | `/api/rides/:id/status` | ✅  | Update trip status. OTP required for `IN_PROGRESS` transition only.  |

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "otp": "4829"
}
```

**Valid status transitions:**

```
SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
    └─────────────────────────────────────────► CANCELLED
EXPIRED (automatic after 2 minutes if no driver accepts)
```

---

## WebSocket Events

> See `sockets.md` for the full WebSocket documentation with Postman testing instructions.

### Notification Service Socket (`ws://localhost:5000`)

No JWT required. Connect and emit `join` with your `userId` immediately.

| Event (send)          | Payload                       | Effect                              |
|-----------------------|-------------------------------|-------------------------------------|
| `join`                | `{ userId }`                  | Join your private notification room |
| `join_driver_pool`    | `{ vehicleType }`             | Join driver pool for `BIKE/MINI/COMFORT` |

| Event (receive)       | Payload                       | Trigger                              |
|-----------------------|-------------------------------|--------------------------------------|
| `ride:expired`        | `{ rideId, message, status }` | No driver accepted in 2 minutes      |
| `ride:removed`        | `{ rideId, reason }`          | Ride cleaned up from driver pool     |

---

### Location Service Socket (`ws://localhost:3002`)

JWT required in `auth.token` or `Authorization` header.

| Event (send)             | Payload                    | Effect                              |
|--------------------------|----------------------------|-------------------------------------|
| `join_ride_room`         | `{ rideId }`               | Start receiving live GPS updates    |
| `update_location`        | `{ lat, lng, rideId? }`    | Broadcast your GPS to ride room     |

| Event (receive)          | Payload                                    | Trigger                     |
|--------------------------|--------------------------------------------|-----------------------------|
| `room_joined`            | `{ success, room }`                        | After join_ride_room        |
| `driver_location_updated`| `{ driverId, lat, lng, timestamp }`        | Driver emits update_location|
| `ride_ended`             | `{ rideId, status, message }`              | Ride completed or cancelled |

---

## How It All Works Together

### Full Ride Lifecycle

```
1. FARE ESTIMATE
   Rider → POST /ride/api/rides/estimate
   ← Gets BIKE, MINI, COMFORT prices + estimated distance/time

2. RIDE REQUEST
   Rider → POST /ride/api/rides/request  (picks vehicle type + offers bid)
   ride-service:
     ├─ Creates ride (status: SEARCHING)
     ├─ BullMQ: schedules 2-minute expiration job
     ├─ gRPC → location-service: GetNearbyDrivers (finds real drivers in Redis)
     └─ RabbitMQ publish: ride.requested
           ├─ notification-service: logs "Looking for drivers" notification
           └─ location-service: logs nearby drivers found

3. DRIVER SEES THE RIDE
   Driver is connected to notification-service socket
   Driver joins: join_driver_pool { vehicleType: "MINI" }
   ← Receives new ride request via RabbitMQ → notification-service → Socket.IO

4A. DRIVER ACCEPTS RIDER BID (direct accept)
    Driver → PATCH /ride/api/rides/:id/accept
    ride-service:
      ├─ Atomic DB update (only 1 driver can win — race-condition safe)
      ├─ BullMQ: cancels expiration job
      └─ RabbitMQ publish: ride.accepted
            └─ notification-service: logs "Driver is on the way" notification

4B. DRIVER COUNTER-OFFERS
    Driver → POST /ride/api/rides/:id/counter { counterFare: 230 }
    ride-service:
      ├─ Creates Bid in DB (status: PENDING)
      └─ RabbitMQ publish: ride.counter_bid → notification-service → rider

    Rider → PATCH /ride/api/rides/:id/counter/:bidId/accept
    ride-service:
      ├─ Prisma $transaction: accepts target bid, rejects all others (atomic)
      ├─ BullMQ: cancels expiration job
      └─ RabbitMQ publish: ride.accepted

5. LIVE GPS TRACKING
   Driver connects to location-service socket (JWT required)
   Driver emits: update_location { lat, lng, rideId }
   ← location-service: saves to Redis, broadcasts driver_location_updated to ride room
   Rider is in ride_<rideId> room and receives live coordinates

6. TRIP PROGRESSION (Driver actions)
   ARRIVED     → PATCH /api/rides/:id/status { status: "ARRIVED" }
   IN_PROGRESS → PATCH /api/rides/:id/status { status: "IN_PROGRESS", otp: "4829" }
                 (OTP must match the 4-digit code issued at ride creation)
   COMPLETED   → PATCH /api/rides/:id/status { status: "COMPLETED" }

   Each status emits: RabbitMQ publish: ride.<status>

7. RIDE COMPLETION
   ride-service → RabbitMQ publish: ride.completed
   notification-service:
     ├─ Logs "Ride Completed" notification to DB
     └─ Sends Gmail email receipt to rider
   location-service:
     └─ Socket.IO emit ride_ended → ride_<rideId> room
        → all sockets leave the room (tracking ends)

8. EXPIRATION (if no driver accepts)
   [2 minutes pass]
   BullMQ worker:
     ├─ DB: marks ride as EXPIRED
     └─ RabbitMQ publish: ride.expired { rideId, riderId, vehicleType }
           └─ notification-service:
                 ├─ Socket emit ride:expired → user:<riderId> (rider told it timed out)
                 └─ Socket emit ride:removed → drivers:<vehicleType> (drivers clean up UI)
```

---

## Running the Project

### Prerequisites
- Docker Desktop
- Docker Compose v2+

### Start everything

```bash
# From the /Uber directory
docker compose up --build
```

### Individual service development (without Docker)

```bash
# From inside any service directory
npm install
npm run dev
```

### Useful Docker commands

```bash
docker compose logs -f notification-service   # Tail notification service logs
docker compose logs -f ride-service           # Tail ride service logs
docker compose restart gateway               # Restart gateway after config change
docker compose down -v                       # Stop and remove volumes
```

---

## Environment Variables

Each service has its own `.env` file. Key variables:

### All services

| Variable        | Description                        |
|-----------------|------------------------------------|
| `PORT`          | HTTP server port                   |
| `JWT_SECRET`    | JWT signing secret (shared key)    |
| `RABBITMQ_URL`  | `amqp://rabbitmq:5672`             |
| `REDIS_URI`     | `redis://redis:6379`               |

### Ride Service (extra)

| Variable                    | Description                          |
|-----------------------------|--------------------------------------|
| `DATABASE_URL`              | PostgreSQL connection string         |
| `REDIS_HOST` / `REDIS_PORT` | For BullMQ queue connection          |
| `LOCATION_SERVICE_GRPC_URL` | `location-service:50051`             |

### Notification Service (extra)

| Variable      | Description                             |
|---------------|-----------------------------------------|
| `DATABASE_URL`| PostgreSQL connection string            |
| `EMAIL_USER`  | Gmail address for sending receipts      |
| `EMAIL_PASS`  | Gmail App Password (not regular pass)   |

### Location Service (extra)

| Variable        | Description                        |
|-----------------|------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string       |
| `GRPC_PORT`     | gRPC server port (default: 50051)  |
