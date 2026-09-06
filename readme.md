# 🚗 Simple Ride — Enterprise-Grade Microservices Mobility Platform

[![Platform](https://img.shields.io/badge/Platform-Simple%20Ride-blue.svg)](https://github.com)
[![Architecture](https://img.shields.io/badge/Architecture-Microservices%20%2B%20Event--Driven-purple.svg)](https://github.com)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019%20%7C%20TailwindCSS%20v4-black.svg)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20gRPC-green.svg)](https://nodejs.org)
[![Event Bus](https://img.shields.io/badge/Broker-RabbitMQ%20(AMQP)-orange.svg)](https://www.rabbitmq.com/)
[![In-Memory](https://img.shields.io/badge/Cache%20%26%20Geo-Redis%20GEO%20%2B%20BullMQ-red.svg)](https://redis.io/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-blue.svg)](https://www.prisma.io/)

**Simple Ride** is a production-grade, distributed, event-driven ride-hailing platform inspired by modern mobility systems like Uber and InDrive. Engineered with a decoupled microservices architecture, Simple Ride combines real-time geospatial driver dispatching, dynamic price bidding, high-throughput gRPC inter-service communication, asynchronous message choreography via RabbitMQ, and an interactive Next.js 16 / React 19 web application.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Core Platform Capabilities](#-core-platform-capabilities)
3. [Microservices Breakdown](#-microservices-breakdown)
4. [End-to-End Ride Lifecycle](#-end-to-end-ride-lifecycle)
5. [Frontend Architecture & Technology Stack](#-frontend-architecture--technology-stack)
6. [API Specification & Endpoints](#-api-specification--endpoints)
7. [WebSocket Event Contracts](#-websocket-event-contracts)
8. [Port Reference & Network Topology](#-port-reference--network-topology)
9. [Getting Started & Local Development](#-getting-started--local-development)
10. [Environment Variables Matrix](#-environment-variables-matrix)
11. [Production Deployment & Infrastructure](#-production-deployment--infrastructure)

---

## 🏗️ Architectural Overview

Simple Ride operates on a **microservices topology** where each discrete domain service is completely decoupled, owns its persistence layer, and communicates via optimal protocols:

- **Edge Proxy (Nginx)**: Port `80` (public `8000`), handles SSL termination, reverse proxy routing, and transparent WebSocket connection upgrades (`Upgrade`, `Connection`).
- **Stateless API Gateway**: Express-based reverse proxy at port `5000` handling unified request routing, rate limiting, and client WebSocket aggregation.
- **Synchronous Internal RPC (gRPC)**: Sub-5ms typed binary communication between `ride-service` and `location-service` using Protocol Buffers.
- **Asynchronous Event Choreography (RabbitMQ)**: A durable topic exchange (`ride_events`) broadcasting domain events (`ride.requested`, `ride.accepted`, `ride.arrived`, `ride.in_progress`, `ride.completed`, `ride.cancelled`, `ride.expired`).
- **Geospatial Proximity & Fast Caching (Redis)**: Sub-millisecond driver spatial indexing via `GEOADD` and `GEOSEARCH`, driver availability TTL presence keys, BullMQ job queues, and horizontal Socket.IO Redis adapter fan-out.
- **Relational Persistence**: PostgreSQL with Prisma ORM across `auth-service`, `ride-service`, and `notification-service`.

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  Simple Ride Platform                  │
                                  │                                                        │
   Browser / Mobile Client        │   ┌────────────────────────────────────────────────┐   │
   (Rider & Driver Next.js UI)    │   │               Nginx Edge Proxy                 │   │
              │                   │   │         (Port 8000 -> Internal 80)             │   │
              │                   │   └───────────────────────┬────────────────────────┘   │
              │ HTTP / WS         │                           │                            │
              ▼                   │                           ▼                            │
   ┌──────────────────────┐       │   ┌────────────────────────────────────────────────┐   │
   │ Next.js 16 Web Client│───────┼──►│               API Gateway (:5000)              │   │
   │ (React 19, Zustand)  │       │   │           (HTTP & WebSocket Edge Proxy)        │   │
   └──────────────────────┘       │   └──────┬────────────┬────────────┬───────────┬───┘   │
                                  │          │            │            │           │       │
                                  │   /auth  │  /location │   /notif   │   /ride   │       │
                                  │          ▼            ▼            ▼           ▼       │
                                  │      ┌───────┐    ┌───────┐    ┌───────┐   ┌───────┐   │
                                  │      │ Auth  │    │Location│   │Notif  │   │ Ride  │   │
                                  │      │Service│    │Service│    │Service│   │Service│   │
                                  │      │(:4001)│    │(:4002)│    │(:4003)│   │(:4004)│   │
                                  │      └───┬───┘    └───┬───┘    └───┬───┘   └───┬───┘   │
                                  │          │            │            │           │       │
                                  │          │            ▲            │           │       │
                                  │          │            └───── gRPC ─┴───────────┤       │
                                  │          │              (Port 50051)           │       │
                                  │          │                                     │       │
                                  │          │     RabbitMQ Topic Exchange         │       │
                                  │          │    ('ride_events' / 'ride.*')       │       │
                                  │          │         ┌───────────────────┐       │       │
                                  │          │         │ ride.requested    │◄──────┤       │
                                  │          │         │ ride.accepted     │◄──────┤       │
                                  │          │         │ ride.arrived      │◄──────┤       │
                                  │          │         │ ride.in_progress  │◄──────┤       │
                                  │          │         │ ride.completed    │◄──────┤       │
                                  │          │         │ ride.expired      │◄──────┤       │
                                  │          │         └─┬───────────────┬─┘       │       │
                                  │          │           │               │         │       │
                                  │          │           ▼               ▼         │       │
                                  │          │       Location       Notification   │       │
                                  │          │       Consumer         Consumer     │       │
                                  │          │                                     │       │
                                  │          ▼                                     ▼       │
                                  │    ┌───────────┐                         ┌───────────┐ │
                                  │    │PostgreSQL │                         │   Redis   │ │
                                  │    │  (Prisma) │                         │(Geo+Queue)│ │
                                  │    └───────────┘                         └───────────┘ │
                                  └────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Platform Capabilities

- **Dynamic Real-Time Bidding (InDrive-style)**:
  Riders specify custom bids within an algorithmic bounding box (-5% to +15% of calculated fare). Drivers can accept the rider's offer immediately or submit a counter-bid. Counter-bids are evaluated atomically with database row locks (`Prisma $transaction`), ensuring that accepting one bid automatically marks competing bids as rejected.
- **Sub-Millisecond Driver Spatial Indexing**:
  Driver GPS telemetry is indexed in Redis via `GEOADD drivers:locations`. Nearby driver discovery runs in $O(\log(N) + M)$ time using `GEOSEARCH ... BYRADIUS` within a specified search radius (default 5 km).
- **High-Performance gRPC Synchronous Dispatch**:
  When a ride is requested, `ride-service` queries `location-service` directly over gRPC (`GetNearbyDrivers`), bypassing HTTP serialization bottlenecks.
- **Two-Minute Automatic Expiration via BullMQ**:
  If no driver accepts or counters within 120 seconds, a delayed job scheduled in Redis via BullMQ fires, transitioning the ride to `EXPIRED` and notifying the driver pool and rider.
- **Cryptographic 4-Digit OTP Verification**:
  To protect against fraudulent pickups, a 4-digit numeric OTP generated at ride creation must be confirmed by the driver before transitioning the ride to `IN_PROGRESS`.
- **Transactional Notifications & Email Receipts**:
  All ride state mutations emit domain events consumed by `notification-service`. Upon trip completion (`ride.completed`), an HTML ride summary receipt is generated and emailed to the rider via Nodemailer and Gmail SMTP.
- **Dual WebSocket Topologies**:
  Decoupled WebSocket channels for user notifications (`/socket.io`) and high-frequency GPS tracking (`/location/socket.io` or port `3002`) with Redis Socket.IO adapter support.

---

## 🧩 Microservices Breakdown

### 1. API Gateway (`backend/gateway`)
- **Internal Port**: `5000` | **Public Entry**: via Nginx on `8000`
- **Stack**: Express 5, `express-http-proxy`, `cors`, `dotenv`
- **Key Responsibilities**:
  - Serves as the single client entry point for REST endpoints.
  - Proxies HTTP requests to internal microservices with path rewrites.
  - Proxies WebSocket upgrades to `notification-service` and `location-service`.
  - Enforces CORS policies for the Next.js frontend (`http://localhost:3000`).
  - Liveness and readiness health monitoring (`GET /health`).

### 2. Auth Service (`backend/services/auth-service`)
- **Internal Port**: `4001` | **Host Port**: `3001`
- **Stack**: Express, Prisma ORM, PostgreSQL, JSON Web Tokens (JWT), Bcrypt, Zod
- **Key Responsibilities**:
  - User registration and authentication for `RIDER` and `DRIVER` roles.
  - Dual-token issuance: Access Tokens (1-day expiry) and Refresh Tokens (7-day expiry).
  - Driver status management (`ONLINE` vs. `OFFLINE`).
  - Rate limiting (100 req/min per IP) and strict input validation via Zod schemas.

### 3. Location Service (`backend/services/location-service`)
- **Internal Ports**: `4002` (HTTP / WebSocket) | `50051` (gRPC)
- **Stack**: Express, Socket.IO, `@grpc/grpc-js`, Redis (`ioredis`), RabbitMQ (`amqplib`)
- **Key Responsibilities**:
  - Driver coordinate ingest and indexing using Redis `GEOADD` on key `drivers:locations`.
  - Implements the `LocationService.GetNearbyDrivers` gRPC RPC defined in `proto/location.proto`.
  - Hosts the real-time location Socket.IO server (`ride_<rideId>` rooms).
  - Consumes `ride.completed` and `ride.cancelled` RabbitMQ events to tear down active tracking rooms.

### 4. Notification Service (`backend/services/notification-service`)
- **Internal Port**: `4003` | **Host Port**: `3003`
- **Stack**: Express, Socket.IO, RabbitMQ, PostgreSQL (Prisma), Nodemailer
- **Key Responsibilities**:
  - Consumes all `ride.#` events from the RabbitMQ `ride_events` topic exchange.
  - Dispatches targeted Socket.IO events to individual user rooms (`user:<userId>`) and driver pool rooms (`drivers:<vehicleType>`).
  - Stores persistent notification records in PostgreSQL.
  - Sends transactional HTML ride receipts via Gmail SMTP on `ride.completed`.

### 5. Ride Service (`backend/services/ride-service`)
- **Internal Port**: `4004` | **Host Port**: `3004`
- **Stack**: Express, Prisma ORM, PostgreSQL, BullMQ, Redis, RabbitMQ, gRPC Client
- **Key Responsibilities**:
  - Distance, duration, and fare estimation for `BIKE`, `MINI`, and `COMFORT`.
  - Ride creation with rider bid validation (-5% to +15% of calculated fare).
  - Driver acceptance and counter-bidding engine with race-condition prevention.
  - OTP verification before trip progression to `IN_PROGRESS`.
  - State machine management: `SEARCHING` → `ACCEPTED` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`.
  - Publishes persistent events to RabbitMQ with broker confirmation channels.

---

## 🔄 End-to-End Ride Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Rider as Rider (App)
    participant Gateway as API Gateway
    participant RideSvc as Ride Service
    participant LocSvc as Location Service
    participant Rabbit as RabbitMQ (ride_events)
    participant NotifSvc as Notification Service
    actor Driver as Driver (App)

    Rider->>Gateway: POST /ride/api/rides/estimate
    Gateway->>RideSvc: Calculate Fares (BIKE, MINI, COMFORT)
    RideSvc-->>Rider: Distance, Duration, Price Estimates

    Rider->>Gateway: POST /ride/api/rides/request (Vehicle, Offer Bid)
    Gateway->>RideSvc: Create Ride (Status: SEARCHING)
    RideSvc->>LocSvc: gRPC GetNearbyDrivers(lat, lng, radius)
    LocSvc-->>RideSvc: List of Nearby Active Drivers
    RideSvc->>Rabbit: Publish "ride.requested"
    RideSvc->>RideSvc: Schedule BullMQ Expiration (120s)
    Rabbit->>NotifSvc: Consume "ride.requested"
    NotifSvc->>Driver: Socket emit "new_ride_request" to vehicle pool

    alt Option A: Driver Accepts Directly
        Driver->>Gateway: PATCH /ride/api/rides/:id/accept
        Gateway->>RideSvc: Atomic DB update (Driver assigned, Status: ACCEPTED)
        RideSvc->>RideSvc: Cancel BullMQ Expiration Job
        RideSvc->>Rabbit: Publish "ride.accepted"
        Rabbit->>NotifSvc: Consume "ride.accepted"
        NotifSvc->>Rider: Socket emit "ride_accepted" (Driver Details)
    else Option B: Driver Counter-Bids
        Driver->>Gateway: POST /ride/api/rides/:id/counter { counterFare }
        Gateway->>RideSvc: Create Bid (Status: PENDING)
        RideSvc->>Rabbit: Publish "ride.counter_bid"
        Rabbit->>NotifSvc: Consume "ride.counter_bid"
        NotifSvc->>Rider: Socket emit "counter_bid_received"
        Rider->>Gateway: PATCH /ride/api/rides/:id/counter/:bidId/accept
        Gateway->>RideSvc: Prisma $transaction (Accept Bid, Reject Others)
        RideSvc->>Rabbit: Publish "ride.accepted"
    end

    Note over Rider,Driver: Live Tracking & Navigation
    Driver->>LocSvc: Socket emit "update_location" { lat, lng, rideId }
    LocSvc->>Rider: Socket emit "driver_location_updated"

    Driver->>Gateway: PATCH /ride/api/rides/:id/status { status: "ARRIVED" }
    RideSvc->>Rabbit: Publish "ride.arrived"

    Driver->>Gateway: PATCH /ride/api/rides/:id/status { status: "IN_PROGRESS", otp: "1234" }
    RideSvc->>RideSvc: Validate 4-digit OTP
    RideSvc->>Rabbit: Publish "ride.in_progress"

    Driver->>Gateway: PATCH /ride/api/rides/:id/status { status: "COMPLETED" }
    RideSvc->>Rabbit: Publish "ride.completed"
    Rabbit->>NotifSvc: Consume "ride.completed"
    NotifSvc->>Rider: Send Email Receipt (Nodemailer SMTP)
    Rabbit->>LocSvc: Consume "ride.completed" -> Close ride room
```

---

## 💻 Frontend Architecture & Technology Stack

The Simple Ride web client (`frontend/`) is an ultra-responsive, mobile-first single-page application built with **Next.js 16 (App Router)** and **React 19**. It is architected for low-latency live map rendering, high-frequency GPS telemetry, instant bidirectional socket updates, and native-feeling mobile ergonomics.

```
frontend/src/
├── app/
│   ├── (auth)/                # Authentication routes (login, register)
│   ├── rider/                 # Rider workspace: interactive map, booking, bidding, live trip
│   ├── driver/                # Driver cockpit: availability bar, radar, counter-bids, navigation
│   ├── layout.tsx             # Root layout with providers (SocketProvider, Theme, Sonner)
│   └── page.tsx               # Root route with role-aware session redirection
├── components/
│   ├── auth/                  # Login and registration form cards
│   ├── driver/                # Driver-specific UI (ActiveTripSheet, DriverAvailabilityBar,
│   │                          #   DriverDashboard, DriverHeader, RideOfferSheet, RideRequestToast)
│   ├── rider/                 # Rider-specific UI (ActiveRideCard, BookingPanel, BottomNav,
│   │                          #   CounterBidDrawer, DriverOfferToast, FareEstimateCard, LocationPicker,
│   │                          #   MapView, MatchedDriverStep, RideSelector, SearchingDriverStep)
│   ├── map/                   # Map canvas and coordinate rendering (RideMap, Leaflet components)
│   ├── skeletons/             # Loading skeletons for smooth layout transitions
│   └── ui/                    # 30+ reusable Shadcn/Radix primitives (Button, Sheet, Dialog, InputOTP)
├── hooks/                     # Custom React hooks for GPS, sockets, and viewport handling
├── lib/                       # Utilities (Axios client, geocoding, fare math, driver simulation)
├── providers/                 # React Context providers (SocketProvider)
├── store/                     # Zustand state stores (Auth, Rider Ride, Driver Trip)
└── types/                     # Shared TypeScript domain interfaces and Zod schemas
```

---

### 1. Core Framework & Client Architecture
- **Next.js 16 (App Router) & React 19**: Leverages modern React Server Components (RSC) where applicable, while isolating client interactive dashboards (`"use client"`) for map manipulation, WebSockets, Web Audio, and browser Geolocation APIs.
- **TypeScript 5**: Complete end-to-end type safety across domain models, API responses, and WebSocket payloads.
- **Role-Aware Root Routing & Middleware**: The application middleware (`middleware.ts`) inspects authentication cookies (`token`, `user`), automatically routing riders to `/rider` and drivers to `/driver`, while redirecting unauthenticated visitors to `/login`.

---

### 2. State Management & Data Layer
- **Zustand 5 (Lightweight Reactive Stores)**:
  - `useAuthStore.ts`: Manages user identity, JWT tokens (synced to browser cookies via `js-cookie`), role (`RIDER` vs. `DRIVER`), and driver online/offline availability state.
  - `useRideStore.ts`: Drives the rider ride state machine (`IDLE` → `ESTIMATING` → `SEARCHING` → `ACCEPTED` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED`). Holds pickup/dropoff coordinates, fare estimates across vehicle tiers (`BIKE`, `MINI`, `COMFORT`), custom offered bids, counter-bid drawers, active driver telemetry, and OTP display.
  - `useDriverTripStore.ts`: Powers the driver cockpit state, incoming ride offer queue, counter-bid slider values, pickup/dropoff routing details, passenger metadata, and OTP verification submissions.
- **TanStack React Query v5**: Manages asynchronous server state, automated cache invalidation, and optimistic mutations for ride lifecycle transitions.
- **Axios HTTP Client with Interceptors (`lib/axios.ts`)**: Automatically injects JWT Bearer tokens from cookie storage into all outgoing requests. Features a response interceptor that catches `401 Unauthorized` errors and automatically triggers silent token refresh via `/auth/api/auth/refresh`.

---

### 3. Real-Time WebSockets & Custom Hooks
- **Global Context (`SocketProvider.tsx`)**: Wraps the layout tree, establishing and managing the lifecycle of persistent Socket.IO connections.
- **Custom Domain Hooks**:
  - `useRiderSockets.ts`: Connects to API Gateway `/socket.io`, subscribes to the user's private notification channel (`user:<userId>`), and processes live events (`ride_accepted`, `counter_bid_received`, `counter_bid_accepted`, `ride:expired`, `ride:cancelled`).
  - `useDriverSockets.ts`: Connects to Notification Socket, automatically joins the driver pool room (`drivers:<vehicleType>`) upon going online, and consumes `new_ride_request` and `ride:removed` events.
  - `useRiderGpsTracker.ts`: Connects directly to the Location Socket (`/location/socket.io`), joins `ride_<rideId>`, and captures high-frequency `driver_location_updated` events to smoothly animate the driver vehicle marker on the rider map.
  - `useDriverLocation.ts` & `useDriverLocationBroadcaster.ts`: Hooks into the browser's `navigator.geolocation.watchPosition` API, smoothing coordinates and streaming real-time driver coordinates over WebSockets to Location Service.
  - `use-mobile.ts`: Responsive viewport detection hook tailoring UI components between mobile drawer sheets and desktop cards.

---

### 4. Interactive Mapping & Geospatial Services
- **Leaflet & React-Leaflet (`leaflet` v1.9 + `react-leaflet` v5)**:
  - Lightweight, GPU-accelerated client map rendering without external API key dependencies.
  - Custom SVG markers for rider pickup pins, dropoff destinations, and animated vehicle icons.
  - Dynamic polyline route rendering connecting origin to destination.
  - Automatic bounds recalculation (`map.fitBounds`) adapting viewport smoothly when ride stages change.
- **Mapbox GL & MapLibre GL Integration (`mapbox-gl`, `maplibre-gl`, `react-map-gl`)**: Pre-configured vector tile rendering support for high-resolution dark-mode map tiles and traffic layers.
- **Geocoding Utilities (`lib/geocoding.ts`)**: Reverse geocoding module translating GPS coordinates into formatted, readable street addresses.
- **Driver Route Simulation (`lib/driverSimulation.ts`)**: Client-side interpolation engine capable of simulating realistic driver turn-by-turn movement toward pickup and dropoff points for development, testing, and demos.

---

### 5. UI Design System & Component Primitives
- **Tailwind CSS v4**: Utilizes the modern CSS-first theme architecture with custom tokens for surfaces, borders, dynamic states, and glassmorphic blurs (`backdrop-blur-md`).
- **Shadcn UI & Radix UI Primitives**: Fully accessible, unstyled UI primitives under `components/ui/`:
  - `Button`, `Badge`, `Card`, `Avatar`, `Separator`, `Skeleton`
  - `Dialog` & `AlertDialog` for confirmation flows
  - `Sheet` & `Drawer` powered by **Vaul** (`vaul`) for native iOS/Android style bottom sheets
  - `Switch` (`@radix-ui/react-switch`) for driver online/offline availability toggles
  - `DropdownMenu` and `Tooltip`
- **Base UI (`@base-ui/react`)**: Next-generation accessible headless primitives.
- **Input OTP (`input-otp`)**: Accessible 4-digit code entry component for driver verification of rider OTP before trip commencement.
- **Sonner (`sonner`)**: High-performance toast notification system delivering real-time bid alerts, connection state changes, and error messages.
- **Lucide React (`lucide-react`)**: Clean, consistent icon set for vehicle classes, GPS signals, star ratings, and action controls.

---

### 6. Dynamic Animations & Audio Feedback
- **Framer Motion (`framer-motion` v13)**:
  - Spring-physics transitions on bottom sheets and modal overlays.
  - Pulsing radar wave animation during driver search (`SearchingDriverStep.tsx`).
  - Interactive counter-bid slider with real-time numeric value feedback.
  - Ride status badge transitions and micro-interactions.
- **Howler.js Audio Cues (`howler` v2.2)**:
  - Audio alert engine playing low-latency sounds for key dispatch moments:
    - **Ride Request Ping**: Alerts drivers immediately when a new trip offer appears in the pool.
    - **Counter-Bid Alert**: Notifies riders when a driver submits a negotiated price.
    - **Trip Milestone Chime**: Plays upon driver arrival and trip completion.

---

### 7. Form Management & Validation
- **React Hook Form (`react-hook-form` v7)**: High-performance form state management with minimal re-renders.
- **Zod (`zod` v4)**: Strict schema validation across registration, login, and fare bid submission forms (`@hookform/resolvers/zod`).
- **Mobile-First Ergonomics**: Designed to meet mobile app guidelines with 44px minimum touch targets, thumb-reachable action buttons, safe-area padding for mobile notches, and tabular numerals (`font-mono` / tabular numbers) preventing jitter during fare recalculations and countdowns.

---

## 📡 API Specification & Endpoints

All requests pass through the **API Gateway** (`http://localhost:5000` or `http://localhost:8000` via Nginx).

### 🔐 1. Auth Service — Prefix `/auth`

| Method | Endpoint | Auth | Description | Payload / Query |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register new user or driver | `{ name, email, password, role }` |
| `POST` | `/api/auth/login` | No | Authenticate user & get JWT tokens | `{ email, password }` |
| `POST` | `/api/auth/refresh` | No | Refresh expired access token | `{ refreshToken }` |
| `GET` | `/api/auth/profile` | Yes | Get authenticated user profile | Header: `Authorization: Bearer <token>` |
| `PATCH` | `/api/auth/driver-status` | Yes | Toggle driver ONLINE / OFFLINE | `{ status: "ONLINE" \| "OFFLINE" }` |
| `POST` | `/api/auth/logout` | Yes | Clear tokens and invalidate session | — |

---

### 📍 2. Location Service — Prefix `/location`

| Method | Endpoint | Auth | Description | Payload / Query |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/location/update` | Yes | Upsert driver GPS coordinates in Redis | `{ lat: number, lng: number }` |
| `POST` | `/api/location/offline` | Yes | Evict driver from Redis geo-index | — |
| `GET` | `/api/location/nearby` | Yes | Query nearby drivers via REST | `?lat=31.52&lng=74.35&radius=5` |

---

### 🚗 3. Ride Service — Prefix `/ride`

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/rides/estimate` | Yes | Calculate fare for BIKE, MINI, COMFORT | `{ pickup: { lat, lng }, dropoff: { lat, lng } }` |
| `POST` | `/api/rides/request` | Yes | Create ride request with rider bid | `{ pickupLat, pickupLng, dropoffLat, dropoffLng, pickupAddress, dropoffAddress, vehicleType, offeredFare }` |
| `GET` | `/api/rides/history/me` | Yes | Fetch current user's ride history | — |
| `GET` | `/api/rides/:id` | Yes | Fetch details of a specific ride | — |
| `PATCH` | `/api/rides/:id/accept` | Yes | Driver accepts rider's offered fare | — |
| `POST` | `/api/rides/:id/counter` | Yes | Driver submits a counter-fare bid | `{ counterFare: number }` |
| `PATCH` | `/api/rides/:id/counter/:bidId/accept` | Yes | Rider accepts driver's counter offer | — |
| `PATCH` | `/api/rides/:id/status` | Yes | Update trip status (ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED) | `{ status: string, otp?: string }` |

---

### 🔔 4. Notification Service — Prefix `/notification`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/notifications/user/:userId` | No | Fetch persistent notification history for a user |

---

## ⚡ WebSocket Event Contracts

Simple Ride exposes two specialized WebSocket gateways:

### 1. Notification Socket (`ws://localhost:5000` via Gateway)
- **Auth**: Connection initialized; client immediately registers interest via `join`.

| Event (Client Emit) | Payload | Purpose |
| :--- | :--- | :--- |
| `join` | `{ userId }` | Subscribes to private channel `user:<userId>` |
| `join_driver_pool` | `{ vehicleType }` | Subscribes driver to pool `drivers:<vehicleType>` (`BIKE`, `MINI`, `COMFORT`) |

| Event (Server Push) | Payload | Description |
| :--- | :--- | :--- |
| `new_ride_request` | Ride object with coordinates & bid | Dispatched to matching driver pool |
| `ride_accepted` | `{ rideId, driver, fare }` | Informs rider that driver accepted |
| `counter_bid_received`| `{ bidId, rideId, counterFare }` | Informs rider of driver counter-bid |
| `counter_bid_accepted`| `{ rideId, finalFare }` | Informs driver counter-bid was accepted |
| `ride:expired` | `{ rideId, message }` | Sent to rider when 120s timer elapses |
| `ride:removed` | `{ rideId, reason }` | Informs driver pool to evict expired ride card |

### 2. Location Socket (`ws://localhost:3002` or `/location/socket.io`)
- **Auth**: Requires JWT in `auth.token` or `Authorization` header.

| Event (Client Emit) | Payload | Purpose |
| :--- | :--- | :--- |
| `join_ride_room` | `{ rideId }` | Rider or driver joins `ride_<rideId>` room |
| `update_location` | `{ lat, lng, rideId? }` | Driver streams GPS; updates Redis and broadcasts |

| Event (Server Push) | Payload | Description |
| :--- | :--- | :--- |
| `room_joined` | `{ success: true, room }` | Confirmation of ride room connection |
| `driver_location_updated` | `{ driverId, lat, lng, timestamp }` | High-frequency GPS telemetry sent to rider |
| `ride_ended` | `{ rideId, status, message }` | Teardown signal closing tracking room |

---

## 🔌 Port Reference & Network Topology

| Service / Container | Internal Port | Docker Host Port | Protocol | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| **nginx** | `80` | `8000` | HTTP / WS | Public Edge Reverse Proxy |
| **frontend** | `3000` | `3000` | HTTP | Next.js 16 Web Dashboard |
| **gateway** | `5000` | `5000` | HTTP / WS | API Gateway & WebSocket Proxy |
| **auth-service** | `4001` | `3001` | HTTP | Authentication & JWT Service |
| **location-service** | `4002` | `3002` | HTTP / WS | Real-Time Location & Socket.IO |
| **location-service** | `50051` | `50051` | gRPC | High-Performance Proximity RPC |
| **notification-service** | `4003` | `3003` | HTTP / WS | Event Notifications & Email |
| **ride-service** | `4004` | `3004` | HTTP | Ride Bidding & Lifecycle Engine |
| **rabbitmq** | `5672` | `5672` | AMQP | Inter-Service Topic Exchange |
| **rabbitmq-ui** | `15672` | `15672` | HTTP | RabbitMQ Management Dashboard |
| **redis** | `6379` | `6379` | Redis TCP | Geospatial Indexing & BullMQ |

---

## 🚀 Getting Started & Local Development

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose v2+
- [Node.js](https://nodejs.org/) v20+ & `npm`

### 1. Clone & Bootstrap via Docker Compose
To build and launch all containers (microservices, databases, brokers, proxies):

```bash
# 1. Clone the repository
git clone <repo-url>
cd Uber

# 2. Launch the entire platform
docker compose up --build
```

Access the application:
- **Frontend App**: `http://localhost:3000`
- **Public API Gateway (via Nginx)**: `http://localhost:8000`
- **Direct API Gateway**: `http://localhost:5000`
- **RabbitMQ Management Dashboard**: `http://localhost:15672` (guest / guest)

### 2. Standalone Service Development
To develop or debug an individual microservice locally:

```bash
# Example: Running Ride Service standalone
cd backend/services/ride-service
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend Local Development
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables Matrix

Create a `.env` file in each respective directory based on these configurations:

### Global / Common (`backend/*/.env`)
```env
PORT=400X
JWT_SECRET=your_super_secret_jwt_key
RABBITMQ_URL=amqp://rabbitmq:5672
REDIS_URI=redis://redis:6379
```

### Ride Service (`backend/services/ride-service/.env`)
```env
PORT=4004
DATABASE_URL="postgresql://postgres:password@localhost:5432/simple_ride_db"
REDIS_HOST=localhost
REDIS_PORT=6379
LOCATION_SERVICE_GRPC_URL=localhost:50051
```

### Notification Service (`backend/services/notification-service/.env`)
```env
PORT=4003
DATABASE_URL="postgresql://postgres:password@localhost:5432/simple_ride_db"
EMAIL_USER=notifications@simpleride.com
EMAIL_PASS=your_gmail_app_password
```

### Location Service (`backend/services/location-service/.env`)
```env
PORT=4002
GRPC_PORT=50051
REDIS_URI=redis://localhost:6379
```

---

## ☁️ Production Deployment & Infrastructure

Simple Ride is engineered for containerized cloud deployment on AWS EC2 or GCP Compute Engine:

- **Production Docker Compose**: Run `docker compose -f docker-compose.prod.yml up -d` for optimized multi-container builds with memory constraints and restart policies.
- **CI/CD Pipeline**: GitHub Actions workflows in `.github/workflows/` automate linting, Docker image compilation, pushing to Docker Hub or Amazon ECR, and automated SSH zero-downtime rolling deploys to EC2 hosts.
- **Database Scaling**: Ready for connection pooling with AWS RDS PostgreSQL or Supabase/Neon, paired with AWS ElastiCache for multi-AZ Redis high availability.

---

<p align="center">
  <b>Simple Ride</b> — Engineered with precision for real-time, high-concurrency mobility.
</p>
