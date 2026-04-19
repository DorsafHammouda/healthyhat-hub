
Two parts: (1) ditch Google Maps for an in-app mock directions overlay, (2) add a Store Manager portal with a Slate/Blue theme, mock analytics, and role switching.

## 1. In-app Mock Directions (fix Route button)

**Why Google Maps fails:** Even with the universal URL, mobile webviews/preview iframes intermittently block the redirect or sandbox prevents external navigation. Reliable fix: skip the external dependency entirely.

**Solution:** Replace `window.location.assign(...)` with a wholesome in-app `<DirectionsModal>` (Dialog) that shows mock turn-by-turn walking directions to the store.

- New component: `src/components/DirectionsModal.tsx` — uses existing `dialog.tsx`, rounded green styling matching the app.
- Generates deterministic mock steps based on store name + distance: e.g. "Head north on Main St (200m) → Turn right onto Oak Ave (350m) → Arrive at Whole Foods 🌿". Includes total distance, estimated walk time (12 min/km), and a little MapPin illustration.
- In `src/routes/grocery-list.tsx`: remove `directionsUrl` redirect; add `routeTarget` state; `openRoute` opens modal instead.
- Keep `directionsUrl` export to avoid breaking imports, mark it unused.

## 2. Store Manager Portal

### Theme
Slate/Business-Blue palette, applied via a wrapper class `.manager-theme` defined in `src/styles.css` (CSS variables override on that scope only — keeps customer side untouched).
- Background: `oklch(0.22 0.03 250)` (deep slate)
- Card surface: `oklch(0.28 0.04 250)` 
- Primary accent: `oklch(0.62 0.16 240)` (business blue)
- Text: light slate

### Routes (no auth gate — demo mode, accessible by toggle)
- `src/routes/manager.tsx` — Manager Dashboard (default redirects to first store)
- `src/routes/manager.$storeName.tsx` — per-store dashboard

### Entry points
- **Welcome/auth screen** (`src/routes/auth.tsx`): add small "Store Manager Portal →" link button below the main signup/login form, styled in slate.
- **Customer dashboard** (`src/routes/index.tsx`): add discreet "Manager view" pill in header for demos.
- **Manager dashboard**: prominent "← Back to Customer View" button in top-left header.

### Dashboard UI (`manager.$storeName.tsx`)
Header: "Store Insights: {StoreName} — Daily Overview" + store selector dropdown (uses `MOCK_STORES`).

Grid layout (2-col on desktop, stacked on mobile 390px):

1. **Pie chart "Shopping Intent vs. Reality"** — Recharts (already installed via `chart.tsx`). Mock: 68% Found, 22% Not Found, 10% Pending.
2. **Bar graph "Top 'Not Found' Items"** — Recharts horizontal bar. Mock top 5: Organic Milk, Avocados, Oat Milk, Sourdough, Free-range Eggs.
3. **Retention stat card** — Big number "72%" + subtitle "of users who couldn't find an item returned within 48 hours". Trend arrow ↑ 4% vs. last week.
4. **Aisle Heatmap** — Simple 4×3 CSS grid of aisle cells colored by intensity (oklch lightness scale on slate-blue), with labels (Produce, Dairy, Bakery, etc.).
5. **Recent Shopping Trips table** — Scrollable, uses `table.tsx`. Columns: Time | Items | Success Rate. Anonymized as "User #102", deterministic mock generated from store name.

All data lives in a new `src/lib/mockManagerData.ts` — deterministic per store name (hash-seeded) so each store shows different but stable numbers.

### Files touched
- `src/components/DirectionsModal.tsx` — new
- `src/routes/grocery-list.tsx` — swap route action to open modal
- `src/routes/manager.tsx` — new (redirects to first store)
- `src/routes/manager.$storeName.tsx` — new (dashboard)
- `src/lib/mockManagerData.ts` — new (deterministic mock analytics)
- `src/styles.css` — add `.manager-theme` scoped CSS variables
- `src/routes/auth.tsx` — add "Store Manager Portal" link
- `src/routes/index.tsx` — add discreet "Manager view" pill

No new dependencies (Recharts is already in via the shadcn `chart.tsx`). No DB changes.
