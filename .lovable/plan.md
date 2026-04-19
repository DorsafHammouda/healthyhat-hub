
## Headspace-style redesign for HealthyHat

Goal: warm, playful, wellness-app feel using pastel greens + warm oranges/cream, rounded shapes, illustrative cards, friendly typography (Nunito), and a bottom nav.

### 1. Design tokens (`src/styles.css`)
- Load **Nunito** via Google Fonts `@import` and set as default `font-family` (fallback to Quicksand stack).
- Refresh palette to pastel/wholesome:
  - `--background`: warm cream `oklch(0.985 0.025 95)`
  - `--primary`: pastel sage green `oklch(0.78 0.12 145)` (soft, not vibrant)
  - `--secondary`: mint cream `oklch(0.93 0.06 150)`
  - `--accent`: warm peachy orange `oklch(0.85 0.10 60)`
  - `--earth`: deeper warm orange `oklch(0.74 0.14 55)`
  - `--cream`: `oklch(0.96 0.05 85)`
  - `--foreground`: soft deep green-charcoal
- Bump `--radius` to `1.75rem` so all rounded-* utilities feel pillow-y.
- Add a couple of utility-friendly soft shadow variables for blob cards.

### 2. Illustrative SVG components (`src/components/illustrations/`)
Tiny inline flat-vector SVGs (no new deps, all hand-drawn organic shapes):
- `BasketCharacter.tsx` – smiling shopping basket with veggies poking out (Shopping Trip)
- `RecipeBookCharacter.tsx` – open book with a carrot bookmark and little face (Grocery List)
- `ChefCharacter.tsx` – round chef-hat character with a big smile (AI Chat)
- `MapPinCharacter.tsx` – cute pin character with leaves (Stores)
- `LeafBlob.tsx` – decorative organic blob shape used as card background

Each ~40 lines, uses palette tokens via `currentColor` / inline fills tied to CSS vars.

### 3. Bottom navigation (`src/components/BottomNav.tsx` — new)
- Fixed bottom bar, max-w-md centered, tall pill with very high radius and soft shadow.
- 4 thick-stroke Lucide icons: `Home`, `ShoppingBasket`, `MessageCircleHeart`, `MapPin` (stroke-width 2.25).
- Active tab: filled pastel-green pill background behind icon + tiny label; inactive: muted.
- Uses `useLocation` from `@tanstack/react-router` to highlight the active route.

### 4. `MobileShell` update
- Add `bottomNav?: boolean` prop (default true). Renders `<BottomNav />` and adds `pb-28` to main so content clears the bar.
- Header: softer, no border, larger rounded back button as a circular pastel chip.
- Hide header on routes that pass `title={undefined}` (dashboard).

### 5. Dashboard overhaul (`src/routes/index.tsx`)
- Soft cream background with a faint blob illustration top-right.
- Greeting block: "Hello, {name} 🌿" in big rounded Nunito, friendly subline.
- Replace the 2×2 icon grid with **illustrative cards**:
  - Card 1 (full-width hero): Shopping Trip — pastel green background, big `BasketCharacter` on the right, title + subline on the left, pill CTA "Let's go".
  - Cards 2–4 (stacked or 2-col): pill-shaped rounded-[2rem] cards with character illustration on left, text on right, distinct background tint per card (mint, peach, cream).
- Sign-out moved to a small circular chip in the top-right corner.
- Render `<BottomNav />` via shell wrapper (dashboard uses a slim variant of MobileShell with `back={false}` and no title).

### 6. Auth screen polish (`src/routes/auth.tsx`)
- Same pastel gradient (mint → cream), big rounded logo chip with leaf illustration, friendlier copy ("Welcome to your food buddy 🌱"), pill inputs (`rounded-2xl h-12`), pill primary button.

### 7. Other route polish (light touch — keep functionality identical)
- `chat.tsx`: bubbles more pillow-shaped (`rounded-3xl`), assistant bubble in mint, user in pastel green, empty-state shows `ChefCharacter` illustration. Input bar pill-shaped with peach send button.
- `grocery-list.tsx`: list items as soft pill cards (`rounded-3xl`, alternating cream/mint background tint), add-input pill, empty state uses `RecipeBookCharacter`.
- `stores.tsx` & `shopping-trip.tsx`: rounded-[2rem] map frame, friendlier copy, illustration on placeholder.

### 8. Files touched / created
**Created:**
- `src/components/BottomNav.tsx`
- `src/components/illustrations/BasketCharacter.tsx`
- `src/components/illustrations/RecipeBookCharacter.tsx`
- `src/components/illustrations/ChefCharacter.tsx`
- `src/components/illustrations/MapPinCharacter.tsx`
- `src/components/illustrations/LeafBlob.tsx`

**Edited:**
- `src/styles.css` (tokens + Nunito font)
- `src/components/MobileShell.tsx` (bottom nav + softer header)
- `src/routes/index.tsx` (illustrative dashboard)
- `src/routes/auth.tsx` (pastel polish)
- `src/routes/chat.tsx` (bubble + empty-state restyle)
- `src/routes/grocery-list.tsx` (pill cards)
- `src/routes/stores.tsx` (rounded frame)
- `src/routes/shopping-trip.tsx` (illustration)

No new dependencies. All illustrations are inline SVG so the bundle stays light and SSR-safe.
