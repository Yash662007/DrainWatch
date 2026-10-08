# DRAINWATCH AI — Antigravity Agent Build Brief (Optimized Master Prompt)

> **How to use:** Give the agent the Global Contract once, then execute GOAL 1 → GOAL 10 sequentially.
> Do not let the agent start a goal until the previous goal's "Done when" checklist passes.
> The agent must run the app after every goal, check the browser console, and fix errors before continuing.

---

## THE PRODUCT

**DrainWatch AI** — an AI-powered drain monitoring & civic-response platform for Indian cities.
Operational loop: **Detect → Report → AI Assess → Prioritize → Assign → Resolve → Verify → Reward.**

It must look like a **real deployable municipal product**, not a template, admin panel, or CRUD demo.
Four roles with distinct UIs (mock role-switcher is fine):

| Role | Core abilities |
|---|---|
| Citizen | View nearby drains, report issues (photo + location), track status, earn Civic Credits, badges, leaderboard |
| Field Worker | View assigned tasks, navigate, start inspection, before/after photos, submit for AI verification (mobile-first) |
| Municipal Officer | Monitor drains/reports, review AI assessments, assign work orders, SLA tracking, analytics |
| Administrator | Full visibility: wards, users, performance, configuration |

---

## TECH STACK (COMPULSORY)

**HTML5 + CSS3 + vanilla JavaScript (ES modules). No frameworks. No build step required.**

| Need | Use |
|---|---|
| Styling | **Tailwind CSS** (Play CDN) + a hand-built claymorphism utility layer in CSS |
| Map | **Leaflet.js + OpenStreetMap** tiles (no API key). Keep the map adapter swappable for Mapbox GL later |
| Charts | **Chart.js** (CDN) |
| Icons | **Lucide** (CDN UMD) or inline SVG. No emojis in UI chrome |
| Fonts | Inter or Manrope (Google Fonts) |
| State | Tiny pub/sub store in vanilla JS (`js/store.js`) + `localStorage` persistence |
| Data layer | Typed mock datasets in `js/data/*.js`, consumed ONLY through an async API layer `js/api/*.js` (Promises + simulated latency) so it can later swap to `fetch()` REST calls without touching components |
| Routing | Hash router (`#/dashboard`, `#/map`, ...) in `js/router.js` — refresh-safe deep links |
| Forms | Hand-rolled validators in `js/validation/schemas.js` (Zod-style rules, inline errors, never rely on browser defaults only) |
| Animation | CSS transitions + Web Animations API, all gated behind `prefers-reduced-motion` |
| Background | `assets/backgrounds/` — muted aerial street-drain/monsoon image (WebP ≤ 300KB) with a clearly marked CSS-gradient fallback until the image is added |

**File structure:**

```
/index.html
/css/tokens.css  clay.css  base.css
/js/router.js  store.js  main.js
/js/api/        js/data/        js/validation/
/js/ui/         (clay components, skeletons, toast, sheets, modals)
/js/pages/      (dashboard.js, map.js, report.js, inspections.js, work-orders.js, field.js, rewards.js, leaderboard.js, analytics.js, notifications.js, profile.js, settings.js)
/assets/backgrounds/  assets/icons/
```

Serve with any static server (`python3 -m http.server` / `npx serve`).

---

## GLOBAL CONTRACT (applies to every goal)

### Design language — restrained claymorphism
Soft elevated matte surfaces, subtle inset + soft outer shadows, rounded corners (consistent radius scale), gentle depth, clean typography, controlled spacing. Professional + civic + environmental. NOT toy-like, NOT neon/glassmorphism/SaaS-template. Centralize surfaces as reusable classes: `.clay-card .clay-btn .clay-input .clay-badge .clay-panel .clay-modal .clay-sheet` — never invent per-component shadows.

### Design tokens (semantic, in `css/tokens.css`)
`--bg --surface --surface-elevated --text-primary --text-secondary --border` + `success / warning / danger / info`.
**Severity scale:** Healthy=green, Warning=yellow, High Risk=orange, Critical=red. **Never color alone** — always dot + icon + text label (e.g. "● Critical").

### Layering
Background image → subtle desaturating overlay → content surface → clay components. Background must never overpower content.

### Responsiveness — one codebase, intentionally different patterns, not shrunk desktop
- Mobile <640px · Tablet 640–1024px · Desktop 1024–1440px · Large >1440px. Test: 320 / 375 / 390 / 414 / 768 / 1024 / 1280 / 1440 / 1920px. Zero horizontal overflow, zero clipped buttons, zero text collisions.
- **Nav:** Desktop = persistent collapsible sidebar (logo, name, icons+labels, active/hover, badges, user section). Mobile = bottom nav (Home · Map · Report · Rewards · Profile), always visible while scrolling, safe-area insets respected. Secondary actions in drawers/bottom sheets on mobile.
- **Tables:** desktop tables must convert to cards on mobile — never horizontal-scroll a table.
- **Map:** desktop = map + right detail panel; mobile = full map + draggable bottom sheet. Never permanently cover half the phone screen.

### Feedback states — every page must have all four
Loading (skeletons matching real layout, no layout shift, reduced-motion aware), Empty (icon/illustration + friendly copy + action — e.g. "You're all clear. No reports yet."), Error (human message + Retry, never stack traces), Success (toast/confirmation).

### Accessibility
Semantic HTML, keyboard navigation, visible focus rings, ARIA labels, labelled form controls, ≥44px touch targets, contrast AA, reduced-motion support.

### One connected product (hard rule)
Shared typed mock objects + a single event log in the store. A citizen report must propagate: **Report → Dashboard → Map → Work Orders → Analytics → Rewards (credits/impact/leaderboard)**. Selecting a drain anywhere opens the same drain object everywhere. A resolution updates statuses, credits, and charts. No isolated mockup pages.

### Performance & quality bar
Lazy-load map and charts (dynamic `import()` / IntersectionObserver), debounced search, `loading="lazy"` + WebP images, no console errors, no dead nav, no lorem ipsum, no obviously fake UI. Copy should read like real municipal language.

---

## GOAL 1 — Foundation & Design System

**Build:** `index.html` shell; fonts; `tokens.css` (semantic + severity tokens, radius/spacing/shadow scales); `clay.css` (`.clay-card/.clay-btn/.clay-input/.clay-badge/.clay-panel/.clay-modal/.clay-sheet`, states: hover/active/focus/disabled); background layer with overlay + gradient fallback + `assets/backgrounds/README` explaining how to drop in the final WebP; typography scale (page/section/card title, body, caption, metadata).

**Done when:** A demo canvas renders every component + all four severity badges (dot+icon+label) at 320/768/1440px with consistent spacing/radius/shadows and clean console.

---

## GOAL 2 — Responsive App Shell, Router & Role Switcher

**Build:** Desktop collapsible sidebar + header (page title, search, notification bell, Civic Credits chip, avatar, Quick Report button); mobile bottom nav (Home/Map/Report/Rewards/Profile) with a prominent center Report action; hash router registering all 12 routes (`dashboard, map, report, inspections, work-orders, field, rewards, rewards/leaderboard, analytics, notifications, profile, settings`) with placeholder pages; role-switcher (Citizen/Field Worker/Municipal Officer/Admin) persisted to localStorage, controlling route visibility (e.g. field routes only for workers; admin-only data hidden from citizens).

**Done when:** All routes deep-link and survive refresh; shell is correct at every required breakpoint; no overflow; keyboard can traverse nav (focus rings visible); active states correct.

---

## GOAL 3 — State, Mock Data API & Feedback Layer

**Build:** `store.js` pub/sub + localStorage hydration; `js/data/` typed mock datasets (drains ~30 across 8 wards, reports, inspections, workOrders, users/teams, notifications, rewards ledger, analytics series, badges, leaderboard) with a single shared **event log**; `js/api/` async wrappers with simulated latency + failure injection switch for testing error states; skeleton library (`CardSkeleton, MetricSkeleton, TableSkeleton, MapSkeleton, ChartSkeleton, ListSkeleton, PageSkeleton`); toast system; EmptyState/ErrorState components; offline banner ("You're offline. Your report will be saved and submitted when you're back online.") driven by `online/offline` events; queued-submission stub.

**Done when:** Any API call shows skeleton → success / empty / retry-able error; reloading preserves credits/reports/role; offline toggle shows banner and queues a fake submission.

---

## GOAL 4 — Dashboard (`#/dashboard`)

**Build:** Metric cards (icon, number, label, trend, subtext): Total Drains, Healthy, Blocked, Critical, Active Work Orders, Avg Response Time. Critical Alerts section (drain ID, location, severity, detected time, risk, status + View/Assign actions). Live mini-map with severity markers. Recent Reports cards (thumbnail, type, location, severity, time, status, reporter type). Community Impact block (Reports Submitted / Verified / Resolved / Civic Credits Earned). All fed from the store.

**Done when:** Numbers are internally consistent with mock data (e.g. healthy+blocked+critical ≤ total); clicking any entity navigates to its canonical detail; skeletons match final layout with zero shift; role differences visible (officer sees Assign, citizen doesn't).

---

## GOAL 5 — Live Map (`#/map`) & Drain Detail

**Build:** Leaflet map (dynamically imported) with severity markers for all drains + risk-zone circles; filters (severity, ward, drain type, status, risk, report age, assigned/unassigned); debounced search ("Search drain, ward or location"); desktop right panel / mobile bottom sheet with drain card: `DR-1048 · CRITICAL · Blockage 87% · Water Level HIGH · Flood Risk HIGH · Last inspection 2h ago · [View Details][Assign Team]` (Assign only for officer/admin). Drain detail view: ID, location, coordinates, severity metrics, assigned team, work order link, images, AI assessment, and the lifecycle timeline: **Reported → AI Assessed → Verified → Assigned → In Progress → Resolved → Resolution Verified** with current step highlighted.

**Done when:** Markers/filter/search all work; panel vs sheet behavior correct per breakpoint; empty filter result shows empty state; map failure shows retry-able error state; same drain data as dashboard.

---

## GOAL 6 — Citizen Report Flow (`#/report`) — must be sub-60-seconds on mobile

**Build:** Step wizard: **Issue → Location → Photo → Description (optional) → Review → Submit.** Issue types: Blocked Drain, Overflow, Garbage Accumulation, Plastic Waste, Sewage, Water Stagnation, Damaged Drain, Other. Location: "Use current location" (geolocation API → reverse-ward mock: "Ward 12 · Mumbai · [Confirm]"), pick on map, or search; permission-denied handled gracefully. Photo: camera capture on mobile (`capture` attr), file upload desktop, preview/remove/replace, accepted formats + size shown, error handling. Validation via schemas with inline errors. On submit, simulate the AI pipeline visibly: **AI Validation → Duplicate Detection → Severity Assessment → Verification**, then one of four outcomes: **Valid (+25 Civic Credits)** / Needs Review / Duplicate ("already reported nearby") / Invalid ("insufficient evidence", no reward). Success screen shows credits earned with count-up animation. Submitted report appears in Dashboard, Map, Work Orders, Analytics, Rewards.

**Done when:** Form works at 320px with ≥44px targets and 1-thumb flow; each outcome reachable; cross-page propagation verified; offline submission queues; skeleton/disabled states prevent double-submit.

---

## GOAL 7 — AI Inspection Simulator (`#/inspections`)

**Build:** Upload image → staged processing screen with live checklist animation: `✓ Detecting drain · ✓ Detecting blockage · ✓ Detecting debris · ○ Assessing water level · ○ Calculating risk` → result card: `Blockage 87% · Water Level HIGH · Debris DETECTED · Vegetation MODERATE · Risk Score 91/100 · CRITICAL` + confidence ("AI confidence: 91%") + **explainability panel** ("Why this result? • Heavy debris detected • Water level elevated • Opening partially obstructed • Similar issue reported twice recently") + recommendation ("Immediate cleaning recommended") + **Create Work Order** button that actually creates one in the store. AI error state: "AI analysis is temporarily unavailable — Try Again."

**Done when:** Processing animation is tasteful + reduced-motion-safe; results map to the store (chosen/generated image → deterministic mock analysis); created work order appears in `#/work-orders`.

---

## GOAL 8 — Work Orders (`#/work-orders`) & Field Worker Flow (`#/field`)

**Build:** Officer view: status-filterable list (desktop table / mobile cards) — ID, drain, location, severity chip, team, SLA, created, status; statuses: Reported / Verified / Assigned / In Progress / Resolved / Verification Pending / Closed. Detail: description, before image, AI assessment, assigned worker, visual progress timeline, live SLA countdown, after image, resolution notes, verification result; assign-team action → store update → notifications event. Field worker mobile experience: Assigned Tasks → Task Details → Navigate (deep link to maps) → Start Inspection → capture Before photo → Complete Work → After photo → **AI verification screen** (`✓ Drain identified · ✓ Debris reduction detected · ✓ Water flow improved · ○ Final verification`) → `RESOLUTION VERIFIED · Before 87% → After 12% · Improvement 75% · [Close Work Order]`. Large outdoor-friendly controls.

**Done when:** Status changes propagate (dashboard counts, map markers, SLA, notifications); table→card conversion clean; worker flow completable entirely on a 375px screen with no zooming; closing an order logs the event and updates drain health.

---

## GOAL 9 — Civic Credits, Rewards (`#/rewards`) & Leaderboard (`#/rewards/leaderboard`)

**Build:** Wallet header (credits, level, progress bar to next level, e.g. "220 credits to next level"), Impact Score card (separate: 92/100, verified %), transaction ledger, and badge grid (First Reporter, Local Watcher, Verified Eye, Community Helper, Monsoon Guardian, Civic Champion) with locked/unlocked/progress states. **Reward values in one configurable `js/data/reward-config.js`** — Verified report +25 · Photo evidence +10 · Accurate location +5 · Confirm valid issue +10 · Resolution feedback +15 · Cleanup participation +30 · Invalid report −20. Levels: 0–99 Citizen · 100–299 Community Helper · 300–599 Civic Contributor · 600–999 Community Guardian · 1000–1999 Civic Champion · 2000+ Waste Warrior. Leaderboard with Individual/Ward/Locality tabs (rank, avatar, name, credits, impact) prioritizing verified contribution, anti-spam note. Credit increments animate; badge unlocks celebrate (reduced-motion-safe).

**Done when:** Submitting a report in GOAL 6 visibly changes credits, level progress, leaderboard rank and badges; all values come from config, not hard-coded in components.

---

## GOAL 10 — Analytics, Notifications, Profile, Settings + Final QA

**Build:** `#/analytics` — lazy-loaded Chart.js: drain-health distribution, blockage trend, reports by ward, avg resolution time, SLA performance, recurrence hotspots, community activity; stacked vertically and readable on mobile; two **AI Insight cards** ("Ward 12 blockage reports +34% in 7 days" / "8 drains predicted critical within 24h"). `#/notifications` — drawer on desktop / page on mobile; categories (report update, work order, critical drain, credit earned, badge unlocked, AI alert), read/unread, timestamps, deep links. `#/profile` — avatar, role, credits, impact, level, badges, reports, resolutions, contribution history. `#/settings` — profile, notifications, location, appearance (light/dark if tokens support it), accessibility (reduced motion, text size), privacy, logout (mock).
Then the **QA sweep**: all 9 breakpoints × every route (no overflow/clipping/collisions), keyboard pass, ARIA labels, contrast, reduced motion, empty/error/loading on every page, zero console errors, performance pass (lazy map/charts, image sizes).

**Done when:** Every route at every breakpoint passes; the agent produces a walkthrough with screenshots + console-clean confirmation.

---

## DEFINITION OF DONE (final)

✔ Desktop + tablet + mobile all intentionally laid out · ✔ Consistent restrained claymorphism & tokens · ✔ Background image system replaceable · ✔ Skeletons/errors/empties/success everywhere · ✔ Dashboard, Map, Report, AI Inspection, Work Orders, Field Worker, Rewards, Leaderboard, Analytics, Notifications, Profile, Settings all functional on mock data · ✔ One connected store — actions propagate everywhere · ✔ Role-aware visibility · ✔ Configurable rewards · ✔ Accessible (keyboard, ARIA, contrast, 44px, reduced motion) · ✔ Lazy-loaded map & charts, optimized images · ✔ No console errors, no TypeError/stack traces shown to users, no lorem ipsum, no dead navigation, no horizontal overflow.

**Judge test:** open the app → a critical drain is obvious in 5 seconds → report an issue in under a minute from a phone → watch it appear on the map, get assigned, get resolved, and see your credits and leaderboard rank move.

---
---

# FOLLOW-UP BRIEF — Claymorphism UI Direction (send after the main brief)

> **Context for the agent:** Everything we build must look like **restrained, professional claymorphism** — soft, tactile, puffy matte surfaces that feel molded from clay, applied with civic-product discipline. This is the single most important visual trait of DrainWatch AI. If a screen doesn't feel clay-like, it's not done.

## 1. What "clay" means here

Claymorphism = **fluffy 3D softness**. Every raised surface gets three simultaneous treatments:

1. **Large soft outer drop shadow** — low opacity, big blur, light diffusion (the object floats above the background)
2. **Inner top/left highlight** — subtle light inset (`rgba(255,255,255,…)`) as if light hits the upper edge
3. **Inner bottom/right shade** — faint dark inset sealing the "puffy" volume

Plus: **generous border radius (16–28px)**, matte low-saturation fill, and a background slightly darker than the surfaces sitting on it (clay only reads when the surface is **lighter** than its backdrop).

## 2. Exact recipes (add to `css/tokens.css` — do not eyeball per component)

```css
:root {
  /* Radius scale — clay needs real roundness */
  --r-sm: 14px;  --r-md: 20px;  --r-lg: 28px;  --r-xl: 36px;

  /* Surfaces — always LIGHTER than --bg */
  --bg: #e8edf2;                  /* cool misty blue-grey */
  --surface: #f4f7fa;
  --surface-elevated: #ffffff;

  /* THE clay shadow stack — reuse everywhere */
  --clay-raised:
    inset 2px 2px 6px rgba(255, 255, 255, 0.75),
    inset -3px -3px 8px rgba(15, 23, 42, 0.06),
    12px 24px 48px rgba(15, 23, 42, 0.10);

  --clay-raised-hover:
    inset 2px 2px 6px rgba(255, 255, 255, 0.8),
    inset -3px -3px 8px rgba(15, 23, 42, 0.06),
    16px 32px 64px rgba(15, 23, 42, 0.14);

  /* Pressed / sunken — inputs, toggles-on, active chips */
  --clay-pressed:
    inset 4px 6px 12px rgba(15, 23, 42, 0.10),
    inset -2px -2px 6px rgba(255, 255, 255, 0.7);
}
```

**Rules:** shadows stay soft and diffuse (no hard edges, no 1px solid "card borders" as the primary separator — depth replaces borders); hover = slightly deeper shadow + 1–2px lift; active/pressed = swap to `--clay-pressed` (the button physically sinks); all transitions 150–250ms ease, reduced-motion safe.

## 3. Per-component clay treatment

| Component | Treatment |
|---|---|
| `.clay-card` | `--surface` fill, `--r-lg`, `--clay-raised`, generous padding (20–28px). No visible outline border |
| `.clay-btn` (primary) | Deep teal/green fill, `--r-md`, raised stack tuned with white inset for sheen; hover deepens; active swaps to pressed inset (satisfying "push") |
| `.clay-btn` (secondary/ghost) | Surface-colored clay pill, same raised stack |
| `.clay-input` | **Sunken**: `--clay-pressed` on a slightly recessed field, `--r-sm`; focus = soft colored outer glow ring, not a hard 1px border |
| `.clay-badge` / severity chip | Small clay lozenge (`--r-sm`), dot + icon + label; severity colors desaturated ~15% so they read matte, not neon |
| `.clay-panel` (map panel, sidebars, sheets) | `--surface-elevated`, `--r-xl` on the edge facing content, strongest shadow of any element (it floats highest) |
| `.clay-modal` / `.clay-sheet` | `--r-xl`, raised stack, backdrop = soft dark + slight desaturation (light blur only if cheap — no heavy glassmorphism) |
| Metric cards | Icon sits on its own **mini clay disc** (inset bottom shade) inside the card |
| Progress bars / toggles / sliders | Track = sunken (pressed shadow); thumb/fill = raised clay |
| Map markers | Clay-tinted severity circles with soft outer shadow + inner highlight, not flat pins |

## 4. Discipline — restrained, not toy-like

- **DO** keep saturation low and surfaces matte; civic/environmental palette (teal-green primary, earthy neutrals, severity accents)
- **DO** reserve the deepest shadows for the highest layer (modal > sheet/panel > card > button)
- **DO** keep one light source direction (top-left) across the entire app — inconsistent inset direction instantly breaks the illusion
- **DON'T** stack clay-on-clay more than 2 levels (card inside panel is fine; button inside card inside panel needs the button to be flatter or rely on color)
- **DON'T** use hard 1px borders, flat rectangles, sharp corners, neon gradients, or frosted-glass blur panels
- **DON'T** make text containers so puffy they look like balloons — headings and data stay clean; clay is the *chrome*, typography is the *content*
- Mobile: shadows may be ~30% lighter (perf + subtlety) but radius and matte feel stay identical

## 5. Done-when (clay QA — run at 375px and 1440px on every route)

- Every card/panel/button reads as soft raised clay: visible inner highlight top-left, diffuse drop shadow, big radius
- Inputs visibly **sink**; buttons visibly **lift** and physically **press** on click
- No hard-edged cards, no flat grey boxes, no default browser control styling anywhere
- Severity chips: matte dot + icon + text, consistent at every severity
- Light direction consistent app-wide; shadow depth hierarchy correct (modal floats above panel above card)
- Screens look like one molded material system — screenshot any page and it is unmistakably "clay", unmistakably DrainWatch
