# Design.md — RideFlow Frontend Design System

> Reference for `opencode` when generating/refactoring components. This is the single source of truth for visual and interaction patterns. Read before creating or editing anything in `src/components/`.

**Update log:** v2 folds in a fresh teardown of a third reference (a fleet-dispatch map dashboard — floating shipment card, stat-tile grid, status performance bar, live map markers). New patterns are marked **[NEW]**. One open item is flagged below: the *exact* accent hex from that reference doesn't match the token currently documented in §1.1 — see the callout.

---

## 0. Source Analysis (why these rules exist)

Analyzed three reference products (a fleet/logistics dashboard "Dispatch," a delivery tracker "FastTrack," and a second dispatch-style map dashboard). All are map-centric, real-time, status-driven apps — same category as this ride-hailing platform. Patterns extracted:

| Pattern seen | Where | Applied here as |
| --- | --- | --- |
| Floating card docked over a full-bleed map, not a separate page | Dispatch entity card, FastTrack tracking panel | `MapView` + floating `BookingPanel` / `ActiveRideCard` |
| Bottom horizontal stat strip (Battery, Cargo, Active shipments…) with small sparkline/arc indicators | Dispatch dashboard footer | `DriverDashboard` stats bar |
| Segmented horizontal bar showing status distribution (Loading/In Transit/Unloading/Delivered, each its own color + %) | Dispatch "Status Performance Overview" | `RideStatusDistribution` (admin/driver analytics only) |
| Vertical timeline with filled/outline dots, bold step title + gray meta line | FastTrack "Pick up / In sorting centre / Delivered" | `TrackingTimeline` for ride lifecycle |
| Single accent color used only for the active/in-progress state; everything else neutral gray/white (light) or neutral gray/black (dark) | Both — orange in FastTrack, dark badge in Dispatch | Accent used **only** for "in progress" / primary CTA, never decoratively |
| Person row: avatar + name + role label + 2 icon-only quick actions (message, call) | FastTrack "Richie Jimenez · Courier" | `DriverContactRow` / `RiderContactRow` |
| Tab bar as plain text links, no pill background, active tab just bolder/colored | Both top navs | `TopNav` |
| Card corners: consistently soft, small radius — never fully round, never sharp | All cards in both refs | Confirms existing `rounded-sm`/`rounded-md` rule |
| Minimal shadow — cards separate via a hairline border or very soft elevation, not drop shadows | Both | Prefer `border` over `shadow-lg` |
| Status conveyed by color + label together, never color alone | Dispatch "In Transit" badge, FastTrack "In progress" pill | Every status badge = dot/icon + text |
| **[NEW]** Circular progress ring (% complete) floating half-outside its parent card's top-right edge | Map-dashboard shipment popover, 69% route-progress ring | `ProgressRing` — used for fare-collection %, route-completion %, driver battery/EV range |
| **[NEW]** Stat tile anchor pattern: small gray label → large bold dark number → optional arc/sparkline underneath, identical anchor points across every tile in the grid | Map-dashboard bottom stat grid (Battery, Cargo Load, Active shipments, Delivered today) | `StatTile` — reused for `DriverDashboard` earnings/trips/online-time/acceptance-rate |
| **[NEW]** Arc/gauge mini-chart inside a stat tile, fill color matches the metric's semantic meaning (e.g. amber for a "still filling" metric, green for a "target met" metric) | Battery %, Cargo Load % tiles | `ArcGauge` |
| **[NEW]** Undecorated sparkline (no axis, no gridlines, just a smooth trend path) for a single trailing metric | "Delivered today" trend line | `Sparkline` — driver earnings trend, acceptance-rate trend |
| **[NEW]** Map marker hierarchy: dormant markers are small, dark, monochrome; the one active/selected marker is larger, colored, and ringed with a dashed accent-color outline | Map-dashboard hub pins vs. selected truck marker | `MapView` marker states — dormant driver pins vs. the rider's matched driver marker |
| **[NEW]** Basemap is deliberately desaturated/muted (grays pulled down, water and greenery low-saturation) so the route line and floating cards are the only saturated things on screen | Map-dashboard basemap treatment | `MapView` base style — keep Leaflet/Mapbox tile style muted; never use a vivid default basemap |
| **[NEW]** Status pill = tint background (accent at ~15–20% opacity) + full-saturation text/dot, and that exact tint-then-full-saturation pairing repeats across every colored element (badge, gauge fill, chart segment) | Map-dashboard "In Transit" pill, chart legend dots | Formalizes the tint rule already implied in §1.1 — now applies to `ArcGauge` and `RideStatusDistribution` fills too, not just `StatusBadge` |

---

## ⚠️ Palette verification callout

The newly-analyzed reference's actual swatch (sampled directly from its color chip) is:

```
#F7B558  — amber/orange primary
#A5D48C  — sage green secondary
#363236  — ink / primary text
#FFFFFF  — pure white
```

This is close to, but **not identical to**, what's currently locked in as `--brand-primary` (`#F47920`) and `--surface-alt` (`#D5D8C5`) in §1.1 below. Both palettes land in the same "warm orange + sage neutral" family, so the *system* (one accent color, used sparingly, tint-and-tone status colors) transfers cleanly — but the literal hex values differ enough (`#F47920` is more saturated/red-leaning than `#F7B558`; `#D5D8C5` is more olive than `#A5D48C`) that they shouldn't be treated as the same token without a decision.

**Action needed before implementation:** confirm which hex set is canonical. Until then, §1.1 keeps the previously-locked `#F47920` / `#D5D8C5` tokens as source of truth (they were an explicit "palette update" decision), and this callout documents the discrepancy rather than silently overwriting it.

---

## 1. Design Tokens

### 1.1 Color — roles, not just swatches (updated palette)

**Palette update:** the brand palette is now the 4-color set below (orange primary + sage/near-white/light-gray neutrals), replacing the earlier lime-based set. Same discipline as before — each color has one job. *(See callout above — a second, closely-related reference palette exists and needs reconciling.)*

```
--brand-primary:      #F47920   /* primary CTA fill, active/selected states, IN_PROGRESS status — sparingly */
--brand-primary-hover:#F47920 @ 88% brightness  /* darken in code (e.g. Tailwind's brightness-90 or a computed shade) — no separate hex was given for this state */
--brand-tint:         #F47920 @ 10–12% opacity  /* subtle highlight background (selected row, chip) — tint, not a flat swatch */
--surface-alt:        #D5D8C5   /* secondary surface / muted tinted background — sage, low-saturation, pairs with orange without competing */
--surface:             #FCFFFF  /* card/page background, light mode — near-white, not pure #FFF */
--border-muted:        #DEDFDE  /* hairline borders, dividers, disabled states */
--ink:                 #141414  /* primary text, dark-mode surface base — retained from the original set; a dark neutral is required for text/dark-mode and wasn't part of the 4 supplied swatches */
```

**Why `--surface` isn't pure white:** `#FCFFFF` reads as white but keeps a touch of warmth so it doesn't clash against `#F47920` the way true `#FFFFFF` can (stark white next to a saturated orange tends to make the orange look harsher than intended).

**Do** use `--surface-alt` (`#D5D8C5`) for secondary panels, empty states, and map overlay backgrounds where you want separation from `--surface` without reaching for a border or shadow.
**Don't** use `--surface-alt` and `--brand-tint` in the same card — pick one "this is highlighted" signal, not two.

**[NEW]** The tint rule now formally extends to every colored fill, not just backgrounds: any time a status/semantic color appears as a *fill* (gauge arc, chart segment, badge background), use it at low opacity as the fill and reserve full saturation for the accompanying dot, icon, or text. This was confirmed independently across two separate reference dashboards, so treat it as a hard rule rather than a stylistic option.

Extend with **semantic** status colors (not in the original 8 — required because ride status must never rely on the brand accent alone, or every status looks "important"):

```
--status-searching:  #8A8A8A  /* neutral gray, pulsing */
--status-accepted:   #2F6FED  /* blue — driver assigned, distinct from "active" */
--status-arrived:    #B8860B  /* amber-ish, low saturation */
--status-in-progress:#F47920  /* brand primary — this IS the "active" moment */
--status-completed:  #1F9D55  /* green */
--status-cancelled:  #E3413F  /* red */
--status-expired:    #8A8A8A  /* same as searching, muted */
```

**[NEW] Cross-reference confirmation:** the map-dashboard reference's own status system (Loading = coral/red, In Transit = amber, Unloading = muted blue, Delivered = sage green) maps almost 1:1 onto this table's shape — a "waiting/early" hue, an "active" hue tied to the brand accent, an "intermediate" blue, and a "done" green. That's independent validation this four-stage status taxonomy is the right generalized model for any real-time logistics-style status flow, ride-hailing included.

**Rules**

- Do use `--brand-primary` sparingly — the single most important action per screen (Request Ride, Accept Bid, Confirm). Never as a background fill for large areas.
- Don't use brand-primary for a "success"/"completed" state — that's `--status-completed`. Confusing "active" with "done" reads as a bug.
- Do use `--ink` (#141414) as the dark-mode surface base, not pure black — matches the FastTrack reference (near-black, not #000).
- Don't mix rounded and sharp corners in the same view (existing rule, kept).
- Maintain 4.5:1 contrast for body text, 3:1 for large text/icons (WCAG AA — tightened from the existing 4:1 blanket rule since large text has a lower legal bar and enforcing 4:1 everywhere over-constrains icon-only buttons).
- **[NEW]** Do reuse the exact same status-color vocabulary across every representation of that status — badge, chart segment, gauge fill, map marker, timeline dot. Don't invent a chart-specific or marker-specific color; if a status needs a new color, add it once to the semantic table in this section, not locally in a component.

### 1.2 Radius

```
--radius-sm: 6px   /* buttons, inputs, chips, badges */
--radius-md: 10px  /* cards, panels, modals */
--radius-full: 999px /* avatars only */
```

No `--radius-lg`/`xl` — the references never go past a small/medium radius, even on large cards. Avatars are the only fully-round element. **[NEW]** Status pills/badges are also fully round (`--radius-full`) in both dispatch-style references, alongside avatars — add pills as a second explicit use case for `--radius-full`.

### 1.3 Typography

- **Display face**: your configured `font-display` — headings, fares, ETA numbers, driver name. Use with restraint: H1/H2 and hero numbers only (e.g. the "58%" battery or fare amount), not body copy.
- **Body face**: system/Inter-equivalent — everything else (addresses, list items, form labels).
- **Numeric/data face**: tabular-nums for fares, ETAs, distances so digits don't jitter on live updates — this app updates fare/ETA in real time via sockets, so layout stability matters more than in a static dashboard.
- **[NEW] Numbers-as-hero rule:** in every stat tile across both dispatch references, the numeral is always the single highest-contrast, largest element in the card — label and any mini-chart are visually subordinate. Apply this explicitly to `StatTile`: value text is always `--ink` at full weight/size; label is always `text-xs`/`text-sm` muted gray, never competing in size or color with the value.

Scale (rem, 16px base):

```
text-xs   0.75   — meta, timestamps, "Standard" delivery-type tags
text-sm   0.875  — body default, list rows
text-base 1      — form inputs
text-lg   1.125  — card titles ("AB-S1A22546")
text-2xl  1.5     — section headers
text-4xl  2.25   — hero numbers (fare, ETA, battery %) — display face
```

### 1.4 Spacing & elevation

- Base unit 4px. Card padding: 16px mobile / 20px desktop. Never less than 12px inside a tappable card (touch target discipline).
- Elevation: prefer `border border-[--border-muted]` over shadow. Reserve `shadow-sm` for floating overlays on the map only (the booking panel, the "Next" stop card) — those need to visually separate from a busy map, everything else on a flat surface doesn't.
- **[NEW]** Two shadow intensities, not one: the map-dashboard reference uses a lighter `shadow-sm`-equivalent for permanent dashboard tiles (`StatTile`) and a visibly heavier, more diffused shadow for temporary map overlays (`BookingPanel`, popovers). Codify as `--shadow-card` (soft, ~6% opacity black, small blur) for tiles/cards and `--shadow-overlay` (softer edge but larger blur/spread, ~10% opacity) for anything floating directly over the map. This gives overlays a clearer "temporary, on top of everything" read versus permanent dashboard chrome.
- Dark mode elevation: since there's no shadow contrast on near-black, separate cards with a 1px lighter border (`rgba(255,255,255,0.08)`) instead — matches FastTrack's dark cards.

### 1.5 Motion — minimal, on purpose

Per the brief: minimal animation, and per the frontend-design guidance, extra motion reads as AI-generated. Rules:

- Duration: 150ms for hover/press, 200ms for panel open/close. Nothing longer except the live map marker (see below).
- Easing: `ease-out` for entrances, `ease-in` for exits. No spring/bounce — neither reference uses bounce.
- Only **three** things are allowed continuous/looping animation:
  1. The driver's live location marker on the map (smooth `transform` interpolation between socket updates, not a snap).
  2. A pulsing dot on `SEARCHING` status (communicates "still working," not decoration).
  3. Skeleton loaders (shimmer, 1.2s loop).
- Everything else is a one-shot transition: panel slide-up on mobile, fade+scale on modal, cross-fade on tab switch. No page-load choreography, no scroll-triggered reveals — this is a utility app, not a marketing site.
- Respect `prefers-reduced-motion`: disable marker interpolation and pulsing, snap instead.

---

## 2. Layout Patterns

### 2.1 Rider — Home / Booking (mirrors Dispatch's map+floating-card layout)

```
┌─────────────────────────────────────────┐
│  [Full-bleed MapView]                    │
│                                           │
│     ┌─────────────────────┐              │
│     │ Floating card:       │  ← shadow-sm, rounded-md, max-w-sm
│     │ pickup/dropoff input │     docked top-left/top-center
│     └─────────────────────┘              │
│                                           │
│                                           │
│  ┌───────────────────────────────────┐   │
│  │ BookingPanel (bottom sheet)        │  ← rounded-md top corners only,
│  │  vehicle selector · fare · CTA     │     slides up, mobile = full width
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

Desktop ≥1024px: `BookingPanel` becomes a fixed left/right sidebar next to the map instead of a bottom sheet — same component, different container, no rebuild.

### 2.2 Active Ride (rider or driver) — `ActiveRideCard`

Directly modeled on the FastTrack tracking panel:

- Header row: route as `Pickup → Dropoff`, status pill top-right (color per §1.1).
- **[NEW]** `ProgressRing` badge overlapping the card's top-right corner (half in/half out of the card edge) showing overall trip-completion % — directly modeled on the map-dashboard's 69% route-progress ring. Gives an at-a-glance completion signal without opening the tab row.
- Tab row inside the card: `Tracking / Load info / Docs`-equivalent → `Tracking / Fare / Driver` for this app.
- `TrackingTimeline` (see §3.3) for status history.
- `DriverContactRow` at the bottom: avatar, name, role, message + call icon buttons — icon-only, `rounded-sm`, 40×40 min tap target.

### 2.3 Driver Dashboard — bottom stats bar (mirrors Dispatch)

For the driver's earnings/shift view: a bottom row of compact stat cards (Today's earnings, Trips completed, Online time, Acceptance rate), each with a small trend arc or sparkline — no full chart libraries for these, keep them cheap (inline SVG, not a charting lib) since they render on every dashboard load. **[NEW]** Follow the confirmed stat-tile anchor pattern exactly: label (muted, small) on top, hero number (large, `--ink`, bold) center, `ArcGauge` or `Sparkline` beneath — same anchor points on every tile regardless of metric, so the grid reads as one system rather than four ad hoc widgets.

### 2.4 Status distribution (admin/analytics only, not rider/driver)

The Dispatch "Loading 12% / In Transit 57% / Unloading 21% / Delivered 10%" segmented bar pattern → reuse for an admin ops view of live ride statuses across the fleet. Not shown to riders or individual drivers — it's a fleet-level pattern, don't force it into a personal dashboard where it has no meaning. **[NEW]** Segment fill colors must be pulled directly from the semantic status table in §1.1 (tint for the bar segment fill isn't needed here since the bar itself is the full-saturation indicator — this is the one place full saturation is used as a fill rather than a tint, since there's no separate text/dot to carry it).

### 2.5 **[NEW]** Map marker states

Formalizes a pattern seen clearly in the new reference and worth codifying since `MapView` didn't previously have explicit marker-state rules:

- **Dormant marker** (other nearby drivers, saved places): small filled circle, `--ink` background, white icon, no shadow, no ring — deliberately low visual weight so the map isn't noisy.
- **Active/matched marker** (the rider's assigned driver once matched): larger circle, white background, `--brand-primary` icon, with a dashed `--brand-primary` ring around it. This is the only marker allowed a ring or a scale increase — it should always be unambiguous which pin is "yours."
- Route line between driver and pickup/dropoff: solid `--brand-primary` stroke, laid over the muted basemap described in §0.

---

## 3. Component Patterns → shadcn mapping

| Component | Built from shadcn primitive | Notes |
| --- | --- | --- |
| `StatusBadge` | `Badge` | Variant per status color in §1.1; always icon/dot + text, never color-only |
| `RideCard` | `Card` | Route, fare, status, ETA. Used in history list and driver's incoming-request toast |
| `TrackingTimeline` | custom (no shadcn primitive) | Vertical list, filled dot = past/current step, outline dot = future step, connecting line uses `--border-muted`, current step's dot uses the step's status color |
| `DriverContactRow` / `RiderContactRow` | `Avatar` + `Button` (icon, ghost variant) | Message + call as icon-only ghost buttons, `rounded-sm` |
| `BookingPanel` | `Sheet` (mobile) / plain flex container (desktop) | Same internal content, different chrome per breakpoint |
| `VehicleSelector` | `RadioGroup` styled as cards | Selected card gets `--brand-tint` background + `--brand-primary` border, not a checkmark icon alone — color + border + icon together |
| `BidCard` / `CounterOfferCard` | `Card` + `Button` | Two actions max (Accept / Counter), primary action uses `--brand-primary`, secondary is outline |
| `MapView` overlay cards | `Card` with `shadow-overlay` | Exception to the no-shadow rule, since they float over a busy map — use the heavier of the two shadow tokens from §1.4 |
| **[NEW]** `ProgressRing` | custom SVG (no shadcn primitive) | Thin stroke, rounded line-caps, single accent color per status, % centered in bold `--ink` text; anchored half-outside its parent card's corner, not fully inline |
| **[NEW]** `ArcGauge` | custom SVG (no shadcn primitive) | Quarter/half-arc, fill color = tint of the metric's semantic color, used inside `StatTile` only |
| **[NEW]** `Sparkline` | custom inline SVG (no charting lib) | No axis/gridlines, single smooth path, trend direction only — not for precise value reading |
| **[NEW]** `StatTile` | `Card` (no header/footer slots used) | Label → hero number → optional `ArcGauge`/`Sparkline`, fixed anchor positions across every instance in a grid |
| Skeletons (`MapViewSkeleton`, `FareSectionSkeleton`) | `Skeleton` | Shimmer only, 1.2s loop, respects reduced-motion |
| `Toast` (ride request, counter-offer received) | `Sonner`/`Toast` | Auto-dismiss 6s except incoming ride request (driver), which persists until action taken — a missed toast here is a missed fare |

---

## 4. Ride Status → Visual Mapping

Single table so every component reads status the same way — this is the most important consistency rule in the whole doc, since status appears in 7+ different components (badge, timeline, map marker, toast, history row, dashboard, and now `ProgressRing`/`ArcGauge`/`RideStatusDistribution`).

| Status | Color token | Icon | Motion |
| --- | --- | --- | --- |
| SEARCHING | `--status-searching` | pulsing dot | looping pulse |
| ACCEPTED | `--status-accepted` | check-circle | none |
| ARRIVED | `--status-arrived` | map-pin | none |
| IN_PROGRESS | `--status-in-progress` (brand primary) | navigation arrow | marker interpolation only |
| COMPLETED | `--status-completed` | check | none |
| CANCELLED | `--status-cancelled` | x-circle | none |
| EXPIRED | `--status-expired` | clock | none |

---

## 5. Responsive Rules

- Breakpoints follow Tailwind defaults; the map/panel split happens at `lg` (1024px) per §2.1.
- Booking/active-ride panels: `Sheet` from bottom on mobile, fixed sidebar on desktop — same data, same component tree, container swap only (don't fork the component).
- Touch targets ≥ 40px on any screen where the user might be walking/in-motion (this is a mobile-first, often-outdoors app) — larger than the usual 32px minimum.
- Map controls (zoom, recenter) always bottom-right, thumb-reachable zone on mobile.

---

## 6. Performance & Build Rules (Next.js specifics)

Given the stack (Next.js 16, React 19, Socket.IO, Leaflet/Mapbox):

- `MapView` and any Leaflet/Mapbox component: `next/dynamic` with `ssr: false` — these libraries touch `window` and will break SSR otherwise.
- Socket-driven components (`useDriverLocation`, `useRiderSockets`) update at high frequency — throttle re-renders (e.g. update marker position via ref/imperative Leaflet API, not React state, to avoid re-rendering the whole map tree per GPS tick).
- Use `next/image` for all avatars/vehicle icons; no unoptimized `<img>`.
- Route-level code splitting: rider flow and driver flow are separate bundles — a rider never needs the driver dashboard's chart code and vice versa.
- Zustand for ephemeral UI/socket state, react-query for anything that hits the gateway over HTTP (ride history, profile) — don't duplicate server state into Zustand.
- Skeleton components must match the exact layout of their real counterpart (same height/columns) to avoid layout shift when data arrives.
- **[NEW]** `ProgressRing`, `ArcGauge`, and `Sparkline` are all hand-rolled inline SVG, not a charting library — confirmed twice now across references that these dashboard-style micro-visualizations should stay dependency-free since they render on every dashboard/card load and don't need interactivity, tooltips, or axes.

---

## 7. Do's and Don'ts (extends existing list)

- Do use the primary color sparingly, only for the most important action _(existing)_
- Don't mix rounded and sharp corners in the same view _(existing)_
- Do maintain accessible contrast for all text _(existing, refined in §1.1)_
- Do pair every status color with an icon or label — never color alone
- Don't use drop shadows on flat/list surfaces — reserve shadow for cards floating over the map, using the two-tier `--shadow-card` / `--shadow-overlay` split from §1.4
- Don't animate anything beyond hover/press/panel-transition except the three explicitly allowed continuous animations in §1.5
- Don't fork mobile/desktop components — swap the container (`Sheet` vs sidebar), keep the internals shared
- Do keep dashboard stat visuals (arcs/sparklines) as inline SVG, not a full charting library, since they render on every load
- Don't show the fleet-level status-distribution bar (§2.4) inside personal rider/driver views — it's an ops-level pattern only
- **[NEW]** Do keep the map basemap desaturated/muted — never let the default Leaflet/Mapbox tile style ship as-is; the whole "floating card over a map" effect depends on the map being visually quiet
- **[NEW]** Do give exactly one marker on the map a ring/scale-up treatment at a time (the rider's matched driver, or the driver's next pickup) — multiple "highlighted" markers defeats the hierarchy
- **[NEW]** Don't let a `StatTile`'s label or icon compete in size/weight with its hero number — the number is always the single loudest element in the tile
- **[NEW]** Resolve the palette discrepancy flagged above before shipping new components against either `#F47920`/`#D5D8C5` or `#F7B558`/`#A5D48C` — pick one canonical set and update this file, don't let both circulate