
## Plan

### 1. Auth persistence
The Supabase client (`src/integrations/supabase/client.ts`) already sets `persistSession: true` and `autoRefreshToken: true` with `localStorage` storage — sessions already survive browser restarts. No code change needed; I'll verify this is working and the only sign-out path is the explicit Log Out button (it is, in `src/routes/index.tsx`).

No edit required for auth — I'll confirm this in the response.

### 2. Map updates (`src/components/StoresMap.tsx` + `src/routes/stores.tsx`)

**Person icon for user location**
- Replace the `CircleMarker` with a `Marker` using a custom `L.divIcon` containing a person SVG/emoji (👤) in a green circular badge.

**Real grocery stores via Overpass API (OpenStreetMap)**
- Drop the mock store list in `stores.tsx`.
- In `StoresMap.tsx`, query Overpass API on mount and on `moveend` for the current map bounds:
  ```
  [out:json][timeout:15];
  (
    node["shop"~"supermarket|convenience|greengrocer|grocery|health_food|farm"](south,west,north,east);
    way["shop"~"supermarket|convenience|greengrocer|grocery|health_food|farm"](south,west,north,east);
  );
  out center 60;
  ```
- Use `https://overpass-api.de/api/interpreter` (no key needed).
- Parse results → `{ id, name, type, lat, lng }`, dedupe by id, cap at ~60 pins.
- Use a `useMap()` helper child component to access the map instance and listen for `moveend` to refetch when the user pans/zooms.
- Show a small "Loading stores…" indicator overlaid while fetching; gracefully ignore errors.

**Distinct store marker**
- Keep a `divIcon` for stores but switch the emoji to a shopping basket 🧺 (already basket-shaped) on a white pin with green border — visually distinct from the user's green person badge.

### 3. Files touched
- `src/components/StoresMap.tsx` — new icons, Overpass fetch, bounds-driven refetch.
- `src/routes/stores.tsx` — remove mock `stores` array; pass only `pos` to map.

No new dependencies; uses existing `react-leaflet` + `leaflet` + `fetch`.
