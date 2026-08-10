# 🔌 Socket.IO Documentation — Uber Clone Backend

> Complete reference for all WebSocket connections, events, rooms, ports, and Postman testing instructions.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Port Map](#port-map)
3. [Socket Server 1 — Notification Service](#socket-server-1--notification-service-port-4003)
4. [Socket Server 2 — Location Service](#socket-server-2--location-service-port-4002)
5. [Gateway WebSocket Proxy](#gateway-websocket-proxy-port-5000)
6. [Event Flow Diagrams](#event-flow-diagrams)
7. [Testing with Postman](#testing-with-postman)
8. [Bugs and Issues Found](#bugs-and-issues-found)

---

## Architecture Overview

This backend uses **two independent Socket.IO servers** — one in the `notification-service` and one in the `location-service`. The API Gateway proxies WebSocket upgrade requests but **only to the notification-service** (see Bugs section).

```
Client (Frontend)
    |
    v
 [Nginx :80]  ──────────────────────► [Gateway :5000]
                                           |
                         ┌─────────────────┼─────────────────┐
                         |                 |                  |
                    HTTP Proxy         HTTP Proxy         WS Proxy (upgrade)
                         |                 |                  |
                   [notification       [ride-service      [notification-service
                    -service :4003]      :4004]               :4003] ✅

[location-service :4002] ── Socket.IO Server #2 (Live GPS tracking)
    (NOT routed through gateway WebSocket proxy — direct connection only)
```

---

## Port Map

| Service              | Internal Port | Docker Host Port | Protocol       | Purpose                              |
|----------------------|---------------|------------------|----------------|--------------------------------------|
| **nginx**            | 80            | **8000**         | HTTP           | Public entry point                   |
| **gateway**          | 5000          | **5000**         | HTTP + WS      | API Gateway + WS Proxy               |
| **auth-service**     | 4001          | **3001**         | HTTP           | JWT Auth / Registration              |
| **location-service** | 4002          | **3002**         | HTTP + WS      | GPS Location + Socket.IO Server #2   |
| **location-service** | 50051         | **50051**        | gRPC           | Nearby driver lookup (internal only) |
| **notification-service** | 4003     | **3003**         | HTTP + WS      | Push Notifications + Socket.IO #1    |
| **ride-service**     | 4004          | **3004**         | HTTP           | Ride lifecycle management            |
| **RabbitMQ**         | 5672          | 5672             | AMQP           | Message broker                       |
| **RabbitMQ UI**      | 15672         | 15672            | HTTP           | Management dashboard                 |
| **Redis**            | 6379          | 6379             | Redis Protocol | Location geo-index + BullMQ          |
| **MongoDB**          | 27017         | 27017            | MongoDB        | Notifications + Auth persistence     |

---

## Socket Server 1 — Notification Service (Port 4003)

**File:** `backend/services/notification-service/src/socket.js`

**Connection URLs:**
```
ws://localhost:3003        (direct Docker host port)
ws://localhost:5000        (via Gateway WS proxy — recommended path)
```

> ⚠️ No JWT authentication required on this socket. Anyone can connect.

### Connection Setup (Client)

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
});
```

---

### 📤 Client → Server Events

#### `join`
Joins a private notification room for a specific user (rider or driver).
Must be called immediately after connection to receive targeted notifications.

```json
{
  "userId": "clx12abc456def789"
}
```

**Effect:** Socket joins room `user:<userId>`

---

#### `join_driver_pool`
Joins a vehicle-type-specific broadcast room so the driver receives new ride requests.

```json
{
  "vehicleType": "MINI"
}
```

**Accepted values for `vehicleType`:** `BIKE`, `MINI`, `COMFORT`

**Effect:** Socket joins room `drivers:<vehicleType>` (e.g., `drivers:MINI`)

---

### 📥 Server → Client Events

#### `ride:expired`
Emitted to the rider when their ride search times out (no driver accepted within 2 minutes).

**Target room:** `user:<riderId>`

```json
{
  "rideId": "clx12abc",
  "message": "Ride search timed out. No drivers accepted in time.",
  "status": "EXPIRED"
}
```

---

#### `ride:removed`
Emitted to a driver pool room to remove the expired ride card from their UI.

**Target room:** `drivers:<vehicleType>` or `drivers:ALL`

```json
{
  "rideId": "clx12abc",
  "reason": "EXPIRED"
}
```

---

### Notification Service Room Structure

```
notification-service rooms:
├── user:<userId>            ← Private room per rider/driver
│     Receives: ride:expired
└── drivers:<vehicleType>   ← Pool room (BIKE / MINI / COMFORT)
      Receives: ride:removed
```

---

## Socket Server 2 — Location Service (Port 4002)

**File:** `backend/services/location-service/src/services/socket.service.js`

**Connection URL:**
```
ws://localhost:3002    (direct Docker host port — required since gateway doesn't proxy here)
```

> 🔐 JWT authentication IS required. Connection will be rejected without a valid token.

### Connection Setup (Client)

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  transports: ['websocket'],
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE',
  },
});
```

The token is decoded and `socket.user` is set to `{ id, role, email }`.

---

### 📤 Client → Server Events

#### `join_ride_room`
Rider (or family member) joins a specific ride's tracking room.

```json
{
  "rideId": "clx12abc456def789"
}
```

**Effect:** Socket joins room `ride_<rideId>`

**Confirmation event back to caller:**
```json
// Event: "room_joined"
{
  "success": true,
  "room": "ride_clx12abc456def789"
}
```

---

#### `update_location`
Driver streams live GPS coordinates. Saves to Redis and broadcasts to the ride room.

```json
{
  "lat": 31.5204,
  "lng": 74.3587,
  "rideId": "clx12abc456def789"
}
```

- `lat` and `lng` are **required** — silently ignored if missing
- `rideId` is **optional** — only broadcast to riders if provided

**Effect:**
1. Saves location to Redis with 5-minute TTL (`driver:active:<driverId>`)
2. Broadcasts `driver_location_updated` to room `ride_<rideId>`

---

### 📥 Server → Client Events

#### `room_joined`
Confirmation sent after joining a ride room.

```json
{
  "success": true,
  "room": "ride_clx12abc456def789"
}
```

---

#### `driver_location_updated`
Live GPS coordinates broadcast to all clients in a ride room.

**Target room:** `ride_<rideId>`

```json
{
  "driverId": "clx_driver_id",
  "lat": 31.5204,
  "lng": 74.3587,
  "timestamp": "2026-08-10T03:00:00.000Z"
}
```

---

#### `ride_ended`
Broadcast when a ride is COMPLETED or CANCELLED. Ends live tracking.

**Source:** RabbitMQ `ride.completed` or `ride.cancelled` → location-service

**Target room:** `ride_<rideId>`

```json
{
  "rideId": "clx12abc",
  "status": "COMPLETED",
  "message": "Live tracking ended for this ride."
}
```

After emitting, server forces all sockets to leave the room.

---

### Location Service Room Structure

```
location-service rooms:
└── ride_<rideId>    ← Active trip tracking room
      Receives: driver_location_updated, ride_ended
      Members:  rider, family members (all must join_ride_room)
```

---

## Gateway WebSocket Proxy (Port 5000)

**File:** `backend/gateway/src/index.js`

```
| WebSocket Path      | Proxied To                    |
|---------------------|-------------------------------|
| /socket.io/*        | notification-service:4003 ✅  |
| /notification/*     | notification-service:4003 ✅  |
| anything else       | Connection destroyed ❌       |
```

The location-service WebSocket is NOT reachable through the gateway. Clients must connect directly to port `3002`.

---

## Event Flow Diagrams

### Flow 1: Ride Requested → Driver Notified

```
Rider (HTTP)
  |
  └─► POST /ride/api/rides/request  (via Gateway → ride-service:4004)
        |
        ├─► DB: Create Ride (status: SEARCHING)
        ├─► BullMQ: Schedule expiration job (delay: 2 min)
        ├─► gRPC: GetNearbyDrivers → location-service:50051
        └─► RabbitMQ publish: ride.requested
                |
                ├─► notification-service → logs notification to DB
                └─► location-service → finds nearby drivers from Redis
```

### Flow 2: Ride Expired (No Driver Accepted in 2 Minutes)

```
BullMQ Worker (ride-service) — fires after 2 minute delay
    |
    ├─► DB: Update ride status → EXPIRED
    └─► RabbitMQ publish: ride.expired
              |
              └─► notification-service → handleRideExpired:
                    ├─► Socket emit 'ride:expired'  → user:<riderId>
                    └─► Socket emit 'ride:removed'  → drivers:<vehicleType>
```

### Flow 3: Driver Accepts → Ride Accepted

```
Driver (HTTP)
  |
  └─► PATCH /ride/api/rides/:id/accept  (via Gateway → ride-service:4004)
        |
        ├─► DB: Atomic update (status: ACCEPTED)
        ├─► BullMQ: Cancel expiration job
        └─► RabbitMQ publish: ride.accepted
                |
                └─► notification-service → logs "Driver is on their way" to DB
```

### Flow 4: Live GPS Tracking During Trip

```
Driver App
  |
  ├─► Socket.IO connect → ws://localhost:3002  (JWT required)
  ├─► emit 'join_ride_room' { rideId }
  └─► emit 'update_location' { lat, lng, rideId }
                                    |
                                    └─► location-service:
                                          ├─► Redis GEOADD (saves driver location)
                                          └─► emit 'driver_location_updated' → ride_<rideId>
                                                                                    |
                                                                             Rider + Family
```

### Flow 5: Ride Completed → Email + End Tracking

```
Driver (HTTP)
  |
  └─► PATCH /ride/api/rides/:id/status  { status: "COMPLETED" }
        |
        └─► RabbitMQ publish: ride.completed
                |
                ├─► notification-service:
                │     ├─► logs notification to DB
                │     └─► sendEmailReceipt → Gmail SMTP receipt to rider
                |
                └─► location-service:
                      └─► emit 'ride_ended' → ride_<rideId>
                            └─► socketsLeave(): clears the tracking room
```

---

## Testing with Postman

> Postman supports Socket.IO natively under **New → Socket.IO**.

### Test Notification Service (No Auth)

1. Open Postman → **New** → **Socket.IO**
2. Set URL: `http://localhost:5000` or `http://localhost:3003`
3. Click **Connect**
4. Add event listeners: `ride:expired`, `ride:removed`

**Emit — Join as Rider:**
```json
Event: join
Body: { "userId": "YOUR_RIDER_USER_ID" }
```

**Emit — Join as Driver:**
```json
Event: join_driver_pool
Body: { "vehicleType": "MINI" }
```

---

### Test Location Service (JWT Required)

1. Open Postman → **New** → **Socket.IO**
2. Set URL: `http://localhost:3002`
3. Go to **Configuration** tab → Under **Auth**, add:

```json
{
  "token": "YOUR_JWT_TOKEN"
}
```

4. Click **Connect**
5. Add event listeners: `room_joined`, `driver_location_updated`, `ride_ended`

**Emit — Join Ride Tracking Room:**
```json
Event: join_ride_room
Body: { "rideId": "YOUR_RIDE_ID" }
```

**Emit — Send Driver Location:**
```json
Event: update_location
Body: {
  "lat": 31.5204,
  "lng": 74.3587,
  "rideId": "YOUR_RIDE_ID"
}
```

---

## Bugs and Issues Found

### 🔴 BUG 1: Dead Code — `ride.consumer.js` is Never Used

**File:** `backend/services/notification-service/src/events/ride.consumer.js`

This file exports `handleRideExpiredEvent` which is **never imported or called anywhere**. The actual handler is `handleRideExpired` in `notification.service.js`, which is wired correctly in `rabbitmq.js`.

**Fix:** Delete `ride.consumer.js`.

---

### 🔴 BUG 2: `vehicleType` Missing from `ride.expired` RabbitMQ Payload

**File:** `backend/services/ride-service/src/workers/bidding.worker.js`

```js
// vehicleType is NOT included in this payload!
await publishEvent('ride.expired', {
    rideId: expiredRide.id,
    riderId: expiredRide.riderId,
    status: 'EXPIRED',
});
```

In `handleRideExpired` in notification-service, when `vehicleType` is missing it falls back to room `drivers:ALL`. But **no driver ever joins `drivers:ALL`** — they only join `drivers:BIKE`, `drivers:MINI`, or `drivers:COMFORT`. So the `ride:removed` cleanup event **never reaches any driver** when a ride expires.

**Fix:** Add vehicleType to the event:

```js
await publishEvent('ride.expired', {
    rideId: expiredRide.id,
    riderId: expiredRide.riderId,
    vehicleType: expiredRide.vehicleType,   // ← ADD THIS
    status: 'EXPIRED',
});
```

---

### 🟡 BUG 3: Gateway Does NOT Proxy Location Service WebSocket

**File:** `backend/gateway/src/index.js`

The active `upgrade` handler only routes to `notification-service` and **destroys** all other WebSocket connections including those meant for `location-service`.

```js
} else {
    socket.destroy(); // ← location-service WS hits this and gets killed
}
```

**Fix:** Add a routing rule for location-service:

```js
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io') || req.url.startsWith('/notification')) {
    wsProxy.ws(req, socket, head, { target: 'http://notification-service:4003' }, handleErr);
  } else if (req.url.startsWith('/location')) {
    wsProxy.ws(req, socket, head, { target: 'http://location-service:4002' }, handleErr);
  } else {
    socket.destroy();
  }
});
```

---

### 🟡 BUG 4: Nginx Missing WebSocket Upgrade Headers

**File:** `nginx/nginx.conf`

Socket.IO connections through Nginx will silently fall back to HTTP long-polling without these headers. Add to the `location /` block:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
```

---

### 🟡 BUG 5: BullMQ Comment Mismatch (45s vs 2 minutes)

**File:** `backend/services/ride-service/src/config/bullmq.js`

The JSDoc comment says "45 seconds" but the actual delay is `120000ms = 2 minutes`. Update the comment:

```js
/**
 * Schedule a job to expire searching rides if no driver accepts within 2 minutes.
 */
```

---

### 🟡 BUG 6: gRPC Handler Returns Mock Data Instead of Real Redis Data

**File:** `backend/services/location-service/src/grpc/location.handler.js`

The `GetNearbyDrivers` gRPC handler returns hardcoded mock drivers (`driver_101`, `driver_102`) instead of querying Redis. The real `findNearbyDrivers()` function exists in `location.service.js` but is not wired to the gRPC handler.

**Fix:** Replace mock data with a real Redis lookup:

```js
import { findNearbyDrivers } from '../services/location.service.js';

export const getNearbyDrivers = async (call, callback) => {
    const { latitude, longitude, radius_km, vehicle_type } = call.request;
    const drivers = await findNearbyDrivers(latitude, longitude, radius_km);
    callback(null, { drivers });
};
```

---

## Summary Table

| Event                    | Direction       | Service      | Room / Target            | Triggered By                        |
|--------------------------|-----------------|--------------|--------------------------|-------------------------------------|
| `join`                   | Client → Server | notification | —                        | Client on connect                   |
| `join_driver_pool`       | Client → Server | notification | —                        | Driver on connect                   |
| `ride:expired`           | Server → Client | notification | `user:<riderId>`         | RabbitMQ `ride.expired`             |
| `ride:removed`           | Server → Client | notification | `drivers:<vehicleType>`  | RabbitMQ `ride.expired`             |
| `join_ride_room`         | Client → Server | location     | —                        | Rider/family on connect             |
| `update_location`        | Client → Server | location     | —                        | Driver every N seconds              |
| `room_joined`            | Server → Client | location     | Caller only              | After `join_ride_room`              |
| `driver_location_updated`| Server → Client | location     | `ride_<rideId>`          | Driver `update_location` emit       |
| `ride_ended`             | Server → Client | location     | `ride_<rideId>`          | RabbitMQ `ride.completed/cancelled` |
