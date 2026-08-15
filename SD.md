# Making the Backend Faster and Reducing Latency

This is a real-time ride-hailing system, so optimize the ride request, driver matching, bid acceptance, socket delivery, and location update paths first. Do not begin with random caching: measure each path, set a latency target, and change one bottleneck at a time.

## 1. Set targets and measure a baseline

Track p50, p95, and p99—not averages—for each service and dependency. Useful first targets:

| User path | Suggested p95 target | Measure |
|---|---:|---|
| Login/profile | under 300 ms | gateway + auth + DB |
| Fare estimate | under 400 ms | ride service |
| Create ride/request nearby drivers | under 800 ms | ride + gRPC + Redis + AMQP publish |
| Driver GPS update acknowledgement | under 150 ms | location Socket.IO + Redis |
| Ride event to connected client | under 500 ms | RabbitMQ to notification Socket.IO |
| Database query | under 100 ms | PostgreSQL query time |

Add structured JSON logs with `requestId`, `rideId`, `userId` (when safe), service name, route, status, duration, and error code. Propagate `traceparent`/correlation IDs through gateway, RabbitMQ message headers, gRPC metadata, BullMQ jobs, and Socket.IO event payloads. OpenTelemetry traces will show whether a slow request is gateway, Prisma/PostgreSQL, Redis, gRPC, RabbitMQ, or application code.

## 2. Highest-impact changes, in priority order

### A. Put services and data close together

- Run gateway, services, PostgreSQL, Redis, and RabbitMQ in one cloud region and private network. Cross-region calls are expensive latency on every ride request.
- Keep the public edge close to users, but keep the ride-matching dependency chain in one availability region.
- Reuse connections: one long-lived Prisma pool per process, one Redis client plus a dedicated BullMQ connection where required, one RabbitMQ connection with a small channel pool, and one reused gRPC client/channel. Never create these clients per request.
- Set connection, request, and gRPC deadlines. Fail fast with a controlled error instead of holding Node event-loop capacity indefinitely.

### B. Keep hot location work in Redis

- Continue using Redis `GEOADD`/`GEOSEARCH` for driver locations. Do not write each GPS point to PostgreSQL or MongoDB.
- Send GPS updates at the specified two-second cadence; coalesce faster GPS updates client-side and use Socket.IO volatile emissions where losing an old position is acceptable.
- Store only active drivers in the geo index and keep active-state keys with TTL. Remove drivers on offline, completed, cancelled, and disconnect paths.
- Limit nearby-driver result size, use the smallest viable radius, and select only the fields required to notify candidates.
- Do not cache a driver’s location in a separate application cache—the Redis geo index is the source for this real-time state.

### C. Make the ride request path short

The synchronous path should be:

```text
Gateway -> ride-service -> one DB transaction -> gRPC nearby lookup -> RabbitMQ publish -> response
```

- Return after the required ride record, nearby-driver result, and durable event publication are complete. Email, notification history, analytics, cleanup, and slow integrations belong in asynchronous consumers.
- Enforce a short deadline on `GetNearbyDrivers`, retry only safe transient failures with bounded exponential backoff, and add a circuit breaker. A slow location service must not exhaust ride-service workers.
- Keep a stable gRPC channel and use protobuf fields that are actually needed. Avoid REST between services; the existing gRPC/RabbitMQ boundaries are appropriate.
- Use idempotency keys for ride creation and bid acceptance. This lets clients retry after a mobile timeout without creating duplicate rides.

### D. Make database queries cheap and correct

- Enable slow-query logging and inspect `EXPLAIN (ANALYZE, BUFFERS)` before adding indexes.
- Add/verify indexes based on actual query shapes, typically `Ride(riderId, createdAt DESC)`, `Ride(driverId, createdAt DESC)`, `Ride(status, createdAt)`, and `Bid(rideId, status)`. Validate exact Prisma models and queries before creating any index.
- Use cursor pagination for ride and notification history; never fetch unbounded histories.
- Select required columns only; avoid wide Prisma `include` trees in hot endpoints.
- Keep Prisma transactions short. Do the atomic winner update for bids/status inside `$transaction`, but do not send RabbitMQ messages, email, or make gRPC calls while holding the database transaction open.
- Use a transactional outbox: write the domain change and an outbox record in one transaction; a worker publishes it to RabbitMQ and marks it delivered. This avoids the failure gap between committing the ride and publishing an event.

### E. Scale Socket.IO correctly

- Use the Socket.IO Redis adapter for notification and location services when replicas exceed one. In-memory rooms split clients across pods and cause missing events.
- Route Socket.IO through one HTTPS/WSS gateway domain. Preserve WebSocket upgrade headers, use long idle timeouts, and prefer `transports: ['websocket']` to avoid long-polling stickiness problems.
- Track connected sockets, event-loop delay, broadcast latency, reconnects, and per-room fanout. Scale location and notification services from active sockets plus CPU/memory, not CPU alone.
- Broadcast to precise rider/driver/ride rooms. Never broadcast GPS or bid events to every connected client.
- On reconnect, re-authenticate and rejoin authoritative rooms; client memory cannot be trusted as the source of current ride state.

### F. Protect RabbitMQ and BullMQ

- Use durable exchanges/queues/messages for ride lifecycle events, publisher confirms, consumer acknowledgements only after successful handling, a dead-letter queue, and bounded retry queues.
- Set consumer `prefetch` to a measured value so one slow consumer does not receive an unbounded number of messages.
- Make consumers idempotent using event IDs or a processed-event table/Redis key. At-least-once delivery means duplicate events are normal.
- Run BullMQ expiration workers separately from ride HTTP pods. Alert on queue depth, oldest-job age, failures, and retries.
- Give delayed job IDs deterministic names such as `ride-expiry:<rideId>` so retries or duplicate requests do not schedule multiple expiry jobs.

## 3. Node.js and Express improvements

- Use Node 20+ production images, `NODE_ENV=production`, and `npm ci --omit=dev` for runtime images.
- Avoid synchronous filesystem, crypto, compression, or CPU-heavy loops on request/socket handlers. Move nonessential CPU work to workers.
- Set body-size limits and validate requests early with Zod/Joi before database work.
- Add rate limits at gateway/auth endpoints and per-user limits for expensive ride creation/location updates. Protect dependencies before autoscaling.
- Use `helmet`, compression only for suitable REST responses, and cache-control for static/rarely changing responses. Do not compress small Socket.IO GPS messages.
- Gracefully handle `SIGTERM`: stop accepting requests, mark readiness false, drain HTTP/WebSocket connections, finish/return queue work safely, then close Prisma/RabbitMQ/Redis/gRPC clients.

## 4. Frontend changes that reduce perceived and real latency

- Dynamically import Leaflet/Mapbox with `ssr: false`; keep map libraries out of login and history bundles.
- Update a live map marker through a ref/imperative map API or a throttled store—not React state for the entire map tree on every GPS event.
- Use React Query for HTTP server data and Zustand only for ephemeral UI/socket state. Cache profile/history with correct invalidation; do not duplicate live server state.
- Debounce fare estimation inputs, cancel stale HTTP requests, and prefetch likely next data only after the main interaction is responsive.
- Use `next/image`, route-level code splitting, skeletons that prevent layout shift, and a CDN for static Next.js assets.
- Show optimistic, clearly labelled progress for safe actions, but do not show a ride as accepted until the server’s atomic transition/event confirms it.

## 5. Scaling and reliability safeguards

- Set CPU/memory requests and limits from observed usage. Autoscale gateway/auth/ride on CPU plus request rate; location/notification on active connections plus CPU; workers on queue lag.
- Use at least two replicas for stateless APIs and spread them across zones. Use disruption budgets and graceful rolling deploys so active trips survive deployments.
- Cap API replicas and database pool sizes together. More pods can make latency worse by exhausting PostgreSQL connections.
- Add timeouts, bounded retries, circuit breakers, bulkheads, and backpressure around RabbitMQ, Redis, gRPC, SMTP, and map/distance APIs.
- Load test realistic journeys: many drivers sending two-second GPS updates, riders requesting rides, concurrent bid accepts, reconnect storms, and broker/Redis/db impairment. Verify both p95 latency and correctness—only one driver may win a ride.

## 6. 30-day improvement sequence

1. **Week 1 — observe:** Add health checks, metrics, tracing/correlation IDs, dashboards, alerts, slow-query logs, and a baseline load test.
2. **Week 2 — hot path:** Reuse clients, add timeouts/deadlines, optimize verified DB indexes and query shapes, tune Redis GEO search, and separate the BullMQ worker.
3. **Week 3 — real time:** Add Socket.IO Redis adapter, precise rooms, reconnection logic, WebSocket-only transport, queue durability/idempotency, and failure tests.
4. **Week 4 — harden:** Implement outbox processing, autoscaling/resource limits, canary/rolling deployment, capacity tests, backup/restore tests, and an SLO/error-budget review.

## Do not do these

- Do not replace Redis GEO with PostgreSQL writes for every GPS update.
- Do not add direct REST calls between backend services.
- Do not make RabbitMQ consumers non-idempotent or acknowledge before their DB update succeeds.
- Do not scale Socket.IO replicas without a shared Redis adapter.
- Do not cache mutable ride status blindly; invalidate/version it after every lifecycle event.
- Do not add database indexes without examining actual query plans and write overhead.
