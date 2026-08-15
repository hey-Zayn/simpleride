# Mobility UI Redesign Plan

## Objective

Create a polished, mobile-first driver experience that feels like a native ride-hailing app: map-led, calm under time pressure, accessible, fast on weak networks, and precise about ride-state actions. Redesign the root route (`/`) as a purposeful entry experience rather than a loading redirect.

## Current assessment

### Driver page

- The page already connects GPS, dispatch sockets, location broadcasting, map rendering, accepting/countering bids, cancellation, and ride-status updates.
- It currently places lifecycle orchestration, API calls, temporary local state, and all view layers in `app/driver/page.tsx`. This makes the real-time screen harder to test and evolve.
- `isOnline` is currently forced to true (`user?.driverStatus === 'ONLINE' || true`), so the UI cannot accurately represent offline, connecting, online, or busy availability.
- The UI supports `ACCEPTED → ARRIVED → OTP → IN_PROGRESS → COMPLETED`, but status updates accept an arbitrary string rather than being constrained by a client-side state transition model.
- Existing driver components use raw controls and arbitrary colours/large shadows in places. They need to be rebuilt with the installed Shadcn primitives and the project token system. `Design.md` is not currently present, so design tokens must be agreed or added before implementation rather than inventing unapproved colours.

### Root route (`/`)

- It is currently a full-screen loading indicator that redirects all unauthenticated users to `/rider`.
- It does not establish product value, enable role-aware entry, or provide a clear recovery experience for auth/session loading failures.

## UX principles

- **Map first, action second:** keep navigation visible; present time-sensitive trip controls as a bottom sheet on mobile.
- **One primary decision:** every ride state has a single clear primary CTA; destructive actions remain secondary and require confirmation.
- **Status never relies on colour alone:** pair colour, icon, copy, and an accessible live-region announcement.
- **Stable real-time layout:** use tabular numerals for fare, time, distance, and countdowns; reserve space while GPS or socket state changes.
- **Native-mobile ergonomics:** 44px minimum interactive targets, safe-area spacing, thumb-reachable primary actions, and sheet-based details.
- **Shadcn-native primitives:** use Button, Sheet, Dialog/AlertDialog, InputOTP, Avatar, Badge, Switch, Skeleton, Tooltip, and DropdownMenu rather than raw interactive elements.

## Phase 0 — Product and technical alignment

**Outcome:** a reviewed implementation contract before changing UI.

1. Confirm the backend’s canonical initial state (`SEARCHING` versus the currently exposed `REQUESTED`) and normalise it in shared frontend ride types.
2. Define a typed driver ride state machine and valid transitions; keep server validation authoritative.
3. Confirm the dispatch payload, status-update response, counter-bid response, OTP error shape, and socket event schemas; model each with TypeScript and Zod.
4. Add or locate the approved `Design.md` token source. Establish semantic tokens for canvas, surface, text, brand/action, and each lifecycle status, including card/overlay shadows.
5. Record success/error, offline, expired-request, and reconnection behaviours with Product and backend owners.

**Exit criteria:** approved state/event contract, token source, and 3–5 bullet architecture plan attached to the implementation change.

## Phase 1 — Lifecycle and state architecture

**Outcome:** the interface can show only legal actions and recover correctly from real-time updates.

| Driver-facing state | Allowed primary action | Required handling |
| --- | --- | --- |
| Offline | Go online | Do not connect/emit dispatch or location updates until availability succeeds. |
| Connecting / GPS unavailable | Retry / review permissions | Preserve current view; show non-blocking connection state. |
| Online, no trip | Wait for offers | Show availability control, earnings snapshot, and map location. |
| Incoming offer (`SEARCHING`) | Accept or counter | Countdown, bid range validation, decline/expiry, and one pending action lock. |
| Accepted | Navigate to pickup / Mark arrived | Pickup route, rider contact shortcuts, safety/cancel secondary action. |
| Arrived | Verify 4-digit OTP | Use `InputOTP`; do not expose Start Trip until a valid OTP has been submitted and server-confirmed. |
| In progress | Complete trip | Destination route, live fare/status, emergency/support entry point. |
| Completed / cancelled / expired | Return to online idle | Clear active trip only after confirmed server/socket state; show a compact outcome receipt. |

Implementation work:

1. Extract strict domain types from `page.tsx` into `src/types/ride.ts`; remove `any` and stringly typed status mutations.
2. Build a `getNextDriverAction(status)` transition guard and use it for CTA rendering and API intent validation.
3. Move ride commands and response/error mapping into a dedicated driver-trip hook or Zustand slice; retain a single source of truth for the active trip.
4. Validate API/socket payloads with Zod before state updates, and reconcile optimistic UI with authoritative events.
5. Keep GPS/socket subscriptions singleton-safe with complete cleanup; expose explicit connection state to the view.

**Exit criteria:** illegal actions cannot be rendered or submitted; OTP gate is enforced; reconnect and terminal-state recovery are specified and tested.

## Phase 2 — Driver information architecture and component redesign

**Outcome:** modular, reusable, map-overlay components that support every state.

Proposed component boundaries:

- `DriverMapCanvas`: dynamically loaded map, route geometry, driver marker, inert loading/error fallback.
- `DriverAvailabilityBar`: online/offline control, GPS/socket health, compact earnings/shift information.
- `RideOfferSheet`: an attention-aware mobile bottom sheet for rider, route, fare, countdown, accept/decline/counter actions.
- `CounterBidSheet`: controlled fare input with Product-approved range, validation feedback, and pending submission state.
- `ActiveTripSheet`: state-specific trip summary with pickup/drop-off details, rider profile/contact controls, and the one primary action.
- `TripProgress`: accessible visual progression from accepted through completion; status copy must be derived from the typed lifecycle model.
- `OtpVerificationSheet`: Shadcn `InputOTP`, paste support, retries, server error message, and disabled/working states.
- `DriverSafetyActions`: low-emphasis support/contact actions plus an `AlertDialog` for cancellation.
- `DriverHeader`: compact desktop-only utility area; on mobile, retain only essential notification/profile entry points.
- `DriverEmptyState`, `DriverOfflineState`, `DriverConnectionNotice`, and `TripCompletionReceipt`: explicit loading, empty, error, offline, and terminal states.

## Phase 3 — Visual system and responsive behaviour

**Outcome:** a professional mobile app feeling across small and large screens.

### Mobile: 320–767px (primary)

- Full-bleed map with a compact, safe-area-aware availability pill at the top.
- Ride offers and active trips open as an anchored bottom sheet with a rounded, drag-handle affordance; details scroll inside the sheet, never the map page.
- Keep the primary CTA fixed at the bottom of the sheet. Put secondary actions in a Sheet/DropdownMenu to prevent accidental taps.
- Use 16px body text for inputs, 44px targets, readable contrast, and `env(safe-area-inset-bottom)` spacing.
- Preserve visible map context above the sheet; expand to a near-full sheet only for OTP and complex counter offers.

### Tablet and desktop: 768px+

- Retain map-first composition with a max-width floating side/bottom panel rather than a stretched full-width command bar.
- Add a restrained desktop utility header, keyboard focus order, tooltips for icon-only controls, and responsive panel widths.
- Do not fork separate business logic by breakpoint; the same typed components should switch presentation only.

### Visual direction

- Warm, high-contrast, operational interface: restrained neutral canvas, brand action colour only for primary actions, and low-opacity semantic status tints.
- Display face for headline/status and tabular numerical styling for fares, ETA, distance, rating, and countdown.
- Soft layered elevation via approved `--shadow-card` and `--shadow-overlay`; no generic heavy Tailwind shadows.
- Use deliberate, reduced-motion-safe transitions for sheet changes, offer arrival, and progress updates. Respect `prefers-reduced-motion`.

## Phase 4 — Root route (`/`) redesign

**Outcome:** a useful, role-aware entry point with no blank redirect screen.

1. Replace the anonymous redirect loader with a responsive mobility landing/entry screen: product promise, rider and driver paths, and lightweight trust/safety cues.
2. Preserve authenticated routing: signed-in drivers go to `/driver`; signed-in riders go to `/rider`; route only after the auth store resolves.
3. For signed-out users, provide clear `Continue as rider`, `Drive with us`, `Sign in`, and `Create account` actions using existing auth routes.
4. Make the mobile version feel app-native: concise hero, role-selection cards/sheets, no excessive marketing content, and safe-area-aware fixed primary action.
5. Add loading, offline, and failed-auth-resolution fallbacks rather than indefinitely showing a spinner.

## Phase 5 — Quality, accessibility, and performance verification

**Outcome:** a dependable interface ready for integration testing.

1. Add component tests for each lifecycle state, transition guard, OTP submission, counter-bid validation, expired offer, and terminal reset.
2. Add responsive visual checks for 320px, 375px, 430px, 768px, and desktop widths.
3. Verify keyboard navigation, focus management when Sheets/Dialogs open, screen-reader status announcements, contrast, and touch targets.
4. Test map and socket performance under high-frequency location updates; batch marker changes via `requestAnimationFrame` or map-native transforms.
5. Run TypeScript, ESLint, production build, and a manual mobile browser pass; no new implicit types, raw unvalidated socket payloads, or effect cleanup gaps.

## Delivery sequence

1. Phase 0 and Phase 1: approve lifecycle contract and establish typed state boundaries.
2. Phase 2 and Phase 3: build the mobile-first driver shell and state-specific Shadcn components.
3. Phase 4: implement the role-aware root route using the same visual system.
4. Phase 5: validate real-time behaviour, accessibility, responsiveness, and production quality.

## Definition of done

- Driver workflow accurately represents `SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`, with `CANCELLED` and `EXPIRED` exits and server-confirmed OTP before trip start.
- Every lifecycle state has an intentional mobile UI, loading/disabled/error state, and a single unambiguous primary action.
- Components use Shadcn primitives, approved design tokens, strict TypeScript, Zod-validated external data, and cleaned-up real-time effects.
- `/` is a fast, role-aware entry screen for signed-out users and an unobtrusive authenticated redirect for returning users.
- Lint, type checking/build, lifecycle tests, and responsive/accessibility checks pass.
