# Pending Tasks – Bug Fixes, Code Quality & Performance Optimizations

## 🔴 Critical Backend Bugs

| # | File/Service | Issue | Impact |
|---|--------------|-------|--------|
| 1 | `auth-service/jwt.utils.js` | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` read from env without fallback. If missing, `jwt.verify/sign` throws or produces insecure tokens. | Auth failures, possible token leakage |
| 2 | `location-service/middlewares/auth.middleware.js` | Hardcoded fallback `'your_jwt_secret_key'` if env missing. | Weak secret any attacker can guess |
| 3 | `ride-service/ride.service.js:94-96` | gRPC driver-search errors caught and only logged; `nearbyDrivers` stays `[]`. Callers have no indication of failure. | Silent dispatch failure, drivers not shown |
| 4 | `ride-service/ride.service.js:122-158` | `acceptRiderBid` uses `updateMany` then fetches updated ride – window for race condition between fetch and prior update. | Possible double‑accept or stale data |
| 5 | `notification-service/notification.service.js:149` | `sendEmailReceipt` called without `try/catch`; email failure crashes the handler and may leave ride in inconsistent state. | Missing receipts, unhandled errors |
| 6 | `auth-service/routes/auth.routes.js:12` | `/refresh` route has **no** `authenticate` middleware, but refresh logic validates token inside service. Inconsistent protection. | Potential unauthorized token refresh |
| 7 | `location-service/services/location.service.js:14` | Sets `driver:active:{id}` TTL 300s (5 min) but never cleans up if driver goes offline unexpectedly; accumulates stale keys. | Redis memory leak over time |
| 8 | `notification-service/notification.service.js:63-64` | `handleRideExpired` emits to `drivers:${vehicleType.toUpperCase()}` but location service stores driver rooms with lowercase `vehicleType`. | Driver room mismatch – expired events not received |

## 🟡 Backend Code Quality Issues

| # | File/Service | Issue |
|---|--------------|-------|
| 9 | `auth-service/app.js:9` | CORS `origin` hardcoded to `http://localhost:3000` – not environment‑configurable for production. |
| 10 | `ride-service/ride.service.js:52` | Duplicate distance/duration calculation inline instead of reusing `estimateRideFare`; maintenance burden. |
| 11 | Multiple services | `dotenv.config()` called without error handling; missing env vars cause runtime crashes (no default guards). |
| 12 | Various services | `res.status(500).json({ message: 'Internal server error' })` leaks no detail – helpful for production but hinders debugging during dev. |
| 13 | `notification-service/socket.js` (not fully read) | Verify socket.io error handling and reconnection policies are consistent across services. |
| 14 | `gateway/src/index.js` (not fully read) | No rate limiting or request-size limits; vulnerable to abuse. |

## 🟢 Frontend Bugs & Code Quality

| # | File/Component | Issue |
|---|----------------|-------|
| 15 | `useAuthStore.ts:103-108` | `refreshToken` may set `token` & `isAuthenticated` even when `accessToken` is undefined, leaving auth state inconsistent. |
| 16 | `useAuthStore.ts:76-78` | `fetchMe` removes cookie if `token === 'undefined'` string – does **not** handle `null` or empty string; may incorrectly clear valid token. |
| 17 | `useRideStore.ts:209` | `distanceKm = Number((data.distanceKm || 0).toFixed(1))` – `toFixed` returns string, then coerced; if `data.distanceKm` is `undefined`, results in `0` without warning. |
| 18 | `useRideStore.ts:214-218` | Backend estimates assumed shape `{BIKE: number, MINI: number, COMFORT: number}`; if shape differs, `backendEstimates` stays `{}` and `baseCalculatedFare` becomes `0`. |
| 19 | `useRideStore.ts:249` | After `requestRide`, `estimate` is cleared (`set({ currentRide: ride, estimate: null })`). UI may lose fare preview causing re‑render flicker. |
| 20 | `useDriverSockets.ts:34` | `clearTimer` callback has empty dependency array `[]` but uses `timerRef.current`; stale closure may clear wrong interval. |
| 21 | `useDriverSockets.ts:46-55` | `setInterval` created without clearing on component unmount **unless** effect cleanup runs; potential memory leak if socket disconnects abnormally. |
| 22 | `useRiderSockets.ts:31-38` | `handleCounterBid` recreates dependency closure each render; though useEffect deps keep it stable, any render without `currentRideId` change keeps old listener. |
| 23 | `useRiderSockets.ts:62-66` | `handleRideExpired` clears `counterBids` and sets `currentRide: null` via store – may cause unrelated components to re‑render unnecessarily. |
| 24 | Throughout frontend | Many components likely re‑render on any store state change; missing `React.memo` or `useMemo` on expensive computations (driver list, map markers). |
| 25 | `components/` (various) | No `PropTypes` or TypeScript prop validation in many presentational components – runtime errors possible. |

## 🚀 Performance Optimization Opportunities

| Area | Recommendation | Expected Benefit |
|------|----------------|-----------------|
| **Socket.IO configuration** | Set `transports: ['websocket']` only (disable polling) after initial handshake; reduce latency and bandwidth. | Faster reconnection, lower CPU |
| **Bid expiration timer** | Move countdown to backend (BullMQ job) instead of client `setInterval`; send remaining time via event. | Eliminates client‑side timer drift, reduces JS execution |
| **Location updates** | Throttle driver location `geoadd` to max 1 Hz (clients send too frequently). Add debounce on frontend `useDriverLocation`. | Less Redis write load, lower latency |
| **Reduce re‑renders** | Wrap driver list, nearby drivers, and map markers with `React.memo`; use `useMemo` for computed fare/distance. | Smoother UI, especially on low‑end devices |
| **Code‑splitting** | Ensure route‑level dynamic `import()` for driver/rider dashboards; verify `pages/(driver)/(rider)` split. | Faster initial load |
| **Axios interceptor** | Refresh token interceptor currently calls `axios.post` without using the created `api` instance (creates new instance). Refactor to use `api.post`. | Consistent token handling, less duplication |
| **Server‑components** | Move ride‑estimate data fetch to Next.js server components (`async` components) so sensitive calculations stay on server, reduce bundle size. | Smaller client JS, faster TTI |
| **Leaflet map optimization** | Use `markerCluster` for driver markers; debounce location updates to 2‑3 s. | Lower GPU/CPU usage, smoother scrolling |
| **Environment‑driven CORS** | Pull CORS origin from env; add production domains. | Proper cross‑origin handling in prod |
| **Health checks & observability** | Add structured logging (Winston/Bunyan) and request IDs; enable OpenTelemetry tracing across services. | Faster incident detection, easier debugging |

## ✅ Quick Wins (Low Effort, High Impact)

1. **Add fallback secrets** in `jwt.utils.js` and `location-service/middlewares/auth.middleware.js` and surface an error at startup if missing.
2. **Wrap `sendEmailReceipt`** in `try/catch` and log failures without throwing.
3. **Fix `useAuthStore.refreshToken`** to only update state when `accessToken` is truthy.
4. **Set `transports: ['websocket']`** in `sockets.ts` after confirming gateway supports it.
5. **Add `React.memo`** to the driver‑list component and any map‑marker render loop.
6. **Throttle driver location emits** to ≤1 Hz on the client side.
7. **Refactor axios interceptor** to reuse the `api` instance instead of creating a new one.

## 📋 Next Steps

1. **Prioritize bug fixes** (especially JWT secret handling and gRPC error silencing).
2. **Run type‑check/lint** (`npm run typecheck` / `npm run lint`) if available; fix any reported errors.
3. **Write unit tests** for critical flows: ride creation, bid acceptance, status transitions.
4. **Implement the performance optimizations** listed above, starting with socket transport and memoization.
5. **Create a CI/CD pipeline** that runs lint, type‑check, and test suite on every PR.

---
*Compiled from codebase inspection – Aug 2025.*