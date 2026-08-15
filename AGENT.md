# AGENT.md – OpenCode System Context & Monorepo Guidelines

You are an expert Principal Full-Stack & Systems Engineer collaborating on an inDriver-style real-time microservices ride-hailing platform (**"RideFlow / Dispatch"**).

---

## 🚀 Quick Commands

- **Generate Prisma Client:** `npx prisma generate --schema=./database/prisma/schema.prisma`
- **Run Local Stack (Docker):** `docker compose up --build`
- **Run Gateway:** `cd backend/gateway && npm run dev`
- **Run Auth Service:** `cd backend/services/auth-service && npm run dev`
- **Run Location Service:** `cd backend/services/location-service && npm run dev`
- **Run Notification Service:** `cd backend/services/notification-service && npm run dev`
- **Run Ride Service:** `cd backend/services/ride-service && npm run dev`
- **Run Frontend:** `cd frontend && npm run dev`

---

## ⚙️ Core Architecture & Microservices Blueprint

1. **Stateless API Gateway (`:5000` / Nginx `:8000`):** Routes HTTP traffic (`/auth`, `/location`, `/notification`, `/ride`) to backend microservices. Handles WebSocket proxies (`/socket.io`). No direct database access in Gateway.
2. **Binary IPC & High-Performance Sync:** Inter-service calls between Ride Service and Location Service MUST use gRPC (`:50051`) with Protobuf definitions for driver discovery.
3. **Async Event Exchange:** Service communication relies on RabbitMQ (`amqp://rabbitmq:5672`) topic exchange (`ride_events`) consuming/publishing `ride.#` events.
4. **Real-Time WebSockets:** Dual Socket.IO setup:
   - `notificationSocket`: Connects through Gateway (`:8000`/`/socket.io`) for ride status and notifications.
   - `locationSocket`: Connects directly to Location Service (`:3002`) with JWT auth for real-time driver GPS tracking.
5. **Geospatial & Queues:**
   - Driver location coordinates are stored in Redis (`GEOADD`/`GEOSEARCH` on `drivers:locations`). Do NOT persist continuous streaming updates into PostgreSQL.
   - Ride bid expiration timeouts (2 minutes) run asynchronously via **BullMQ** + Redis.

---

## 🏛️ Specialized Agent Roles (`.opencode/agent/`)

When executing domain-specific tasks, adapt the persona and strict guardrails defined in `.opencode/agent/`:

- **Tech Lead:** `.opencode/agent/tech-lead.md`
- **Product Manager:** `.opencode/agent/product-manager.md`
- **Backend Engineer:** `.opencode/agent/backend-engineer.md`
- **Senior Frontend:** `.opencode/agent/senior-frontend.md`
- **Design Engineer:** `.opencode/agent/design-engineer.md`
- **Security Auditor:** `.opencode/agent/security-auditor.md`

---

## 🌐 Port & Infrastructure Reference Table

| Service                  | Internal Port | Host Port    | Protocol / Technology                    |
| :----------------------- | :------------ | :----------- | :--------------------------------------- |
| **Nginx (Public Entry)** | 80            | 8000         | Reverse Proxy (HTTP + WS Upgrade)        |
| **Gateway**              | 5000          | 5000         | Express HTTP + WS Proxy                  |
| **Auth Service**         | 4001          | 3001         | Express, JWT, Prisma, PostgreSQL/MongoDB |
| **Location Service**     | 4002 / 50051  | 3002 / 50051 | Express, Socket.IO, gRPC, Redis Geo      |
| **Notification Service** | 4003          | 3003         | Express, Socket.IO, RabbitMQ, Nodemailer |
| **Ride Service**         | 4004          | 3004         | Express, BullMQ, gRPC Client, Prisma     |
| **RabbitMQ**             | 5672          | 5672 / 15672 | AMQP / Management UI                     |
| **Redis**                | 6379          | 6379         | Geo Index & BullMQ Job Queues            |

---

## 🛠️ Codebase & Language Guidelines

- **Frontend Stack:** Next.js 16, React 19, TypeScript strict typing. **NEVER use `any`**.
- **Backend Stack:** Node.js (ES Modules), Express.js. Use **JavaScript (JS)**.
- **Database:** Prisma ORM with PostgreSQL. Use `prisma.$transaction` for race-condition-sensitive logic (e.g., driver counter-bid acceptances).
- **Validation:** Validate all incoming HTTP payloads across all services using **Zod** schemas.

---

## 🎨 Mandatory Frontend & Industrial Design System (Non-Negotiable)

Refer to **`Design.md`** before building or editing any UI components in `frontend/src/components/`.

### 1. Palette & Design Tokens

- Primary Accent (In Transit / Active CTA): `--brand-primary` (`#F47920` or `#F7B558` amber)
- Success / Delivered: `--status-completed` (`#1F9D55` or `#A5D48C` sage green)
- Page Surface: `--surface` (`#FCFFFF` or `#F2F2F2` light neutral canvas)
- Primary Text / Dark Fill: `--ink` (`#141414` or `#363236`)
- Tint Rule: Status badges and fills MUST use low-opacity backgrounds (~15–20%) paired with full-saturation text/dots.

### 2. Apple, Linear & "Dispatch" Aesthetic (Design-Engineering Standard)

> **Mandated by:** Lead UI/UX Engineer, Design System Architect, Senior Frontend Specialist  
> **Target:** Industrial-grade, high-density, real-time logistics interface. Strictly **NO generic "vibe code," basic AI-generated templates, or standard Bootstrap/SaaS layouts.**

- **Card-First Layout:** UI is composed of distinct, layered cards with soft shadows and high corner radii (18–24px). Avoid flat, un-elevated backgrounds.
- **Typography & Spacing:** Use a **tight, high-information-density ratio**. Numbers (ETA, bids) must be bold and prominent, while supporting labels remain subtle (size 12–13px, gray tint).
- **Visual Hierarchy:** Use **color as the primary signal**. Backgrounds should be near-white or very light gray. Active states and data must pop with `--brand-primary` (amber) or status greens/reds.
- **Map UI Standard:** Interactive map elements (driver markers, active routes) must use solid, opaque, high-contrast colors. Map layers (roads, land) should be desaturated and darkened to serve as a neutral backdrop.
- **Elevation & Depth:** **NEVER flatten UI components.** All cards, modals, and floating elements must utilize `--shadow-card` (low-opacity, diffused shadow) to create clear visual separation from the background.

#### 2.1 Visual Hierarchy & Data Framing

- **Numerical Dominance:** Numbers are the structural anchor of the dashboard. Every metric card (`StatTile`) MUST prioritize a bold, high-contrast dark value (`--ink`, `font-display`, `text-2xl` to `text-4xl`) set in **`tabular-nums`** to eliminate layout jitter during live Socket updates. Labels MUST be subordinate mid-gray (`text-xs`/`text-sm`, `tracking-wider`, uppercase or sentence-case).
- **Desaturated Basemap Canvas:** The Leaflet/Mapbox canvas MUST be styled with a custom low-saturation, high-contrast gray/slate tone. Roads, greenery, and water are muted so saturated route lines (`--brand-primary`) and active driver pins stand out instantly as the highest visual priority on screen.
- **Map Marker Hierarchy:**
  - _Dormant/Idle Drivers:_ Small, monochrome dark circular badges.
  - _Active/Matched Driver:_ Enlarged, high-contrast white badge with a full-saturation icon, wrapped in a pulsing/dashed accent ring (`--brand-primary`).

#### 2.2 Token-Driven Color & Elevation Discipline

- **Dual-Intensity Tint Rule:** Status fills (gauge arcs, badge backgrounds, horizontal segment bars) MUST use low-opacity tints (~12–20% opacity of the status token). Full saturation is strictly reserved for the accompanying text, icon, and pulsing status dot. **Never use saturated flat fills for large surface areas.**
- **Layered Soft Elevation:** Do NOT use harsh dark borders or heavy generic Tailwind drop shadows (`shadow-lg`).
  - _Permanent Dashboard Cards:_ Soft hairline borders (`border border-[--border-muted]`) with minimal diffused depth (`--shadow-card`: `0 8px 24px rgba(0,0,0,0.06)`).
  - _Floating Map Overlays (Booking Panel / Active Trip Card):_ High-blur, low-spread elevation (`--shadow-overlay`: `0 12px 32px rgba(0,0,0,0.10)`) to visually decouple temporary floating panels from the active basemap.
- **Cohesive Soft Geometry:**
  - _Card Containers:_ Soft, substantial radii (`rounded-xl` to `rounded-2xl` / `16–20px`).
  - _Interactive Pills / Status Badges / Avatars:_ Fully rounded (`rounded-full`). Never mix sharp 0px corners with soft rounded cards in the same view.

#### 2.3 Structural Components & Micro-Interactions

- **Industrial Component Archetypes:**
  - **`StatTile`:** Label (gray) $\rightarrow$ Value (bold `--ink`) $\rightarrow$ Inline Context Visualizer (`ArcGauge` or single-path `Sparkline` with no axes or gridlines).
  - **`StatusPerformanceBar`:** Multi-segment horizontal bar displaying status breakdowns using exact tint-then-full-saturation color pairings.
  - **`TrackingTimeline`:** Vertical stepper using filled/outlined status dots, bold step titles, and subtle hairline connector lines.
- **State Completeness:** Every custom button, tile, and card MUST implement explicit `:hover`, `:active`, `:focus-visible` (custom ring), and `:disabled` states. Plain `div` onClick wrappers are strictly forbidden—use accessible primitives (Radix/Shadcn).
- **Micro-Animations & Feedback:**
  - Panel transitions MUST use clean, one-shot Framer Motion spring setups (`duration: 150-200ms`, `ease-out`).
  - **No unnecessary motion:** Continuous looping animations are restricted exclusively to:
    1. Smooth map marker spatial interpolation (`transform` transitions between live GPS socket packets).
    2. A subtle 1.5s pulsing dot on `SEARCHING` status badges.
    3. Low-contrast skeleton shimmer loaders (`animate-pulse`) for async state loading.

---

## 🚗 inDriver Core Bidding & Ride Lifecycle Rules

1. **Fare Bidding:** Riders issue a custom `offeredFare` within -5% to +15% of the calculated base fare. Drivers can accept directly or send a `counterFare`.
2. **Atomic Bidding Transactions:** Accepting a bid requires an atomic Prisma transaction (`Prisma.$transaction`) to guarantee only one driver wins the ride.
3. **Trip OTP Verification:** Transitioning status from `ARRIVED` to `IN_PROGRESS` strictly requires validating the 4-digit OTP issued during ride creation.
4. **Lifecycle Events:** Every status change MUST publish a corresponding event (`ride.requested`, `ride.accepted`, `ride.completed`) to RabbitMQ.

---

## 📋 Read These Documents Before Answering Complex Tasks

1. Frontend Design System: `Design.md`
2. Tech Stack: `.opencode/tech-stack.md`
3. System Architecture & Protocols: `.opencode/system-architecture.md`
