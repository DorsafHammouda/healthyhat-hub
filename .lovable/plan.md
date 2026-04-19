
# HealthyHat — Mobile Web App

A fresh, vibrant green food-themed mobile app with four core features. Mobile-first responsive layout that looks great on phones.

## Design system
- **Colors**: Garden Green `#4CAF50` (primary), Crisp White, soft earth tones (warm beige, light cream, soft brown accents) — applied via `styles.css` design tokens (oklch).
- **Typography**: Modern friendly sans-serif (Inter / system stack), generous sizing.
- **Shapes**: Rounded 2xl corners, soft shadows, plenty of whitespace — no clutter.
- **Icons**: Lucide (`ShoppingBasket`, `BookOpen`, `ChefHat`, `MapPin`).

## Auth (Lovable Cloud)
- Email + password sign-up / sign-in screen.
- Auto-redirect to dashboard when logged in; protected routes otherwise.
- Sign-out button in the dashboard header.
- A `profiles` table (id, display_name) auto-created on signup via trigger.

## Routes
- `/auth` — Sign in / sign up
- `/` — Dashboard with 4 cards + greeting
- `/shopping-trip` — Placeholder "Coming soon: camera & AI recognition" screen
- `/grocery-list` — Add ingredients + checklist
- `/chat` — HealthyHat AI chatbot
- `/stores` — Leaflet map with user location + nearby store pins

Each route has its own SEO metadata (title, description, og tags).

## Dashboard
- Friendly greeting ("Hello 👋") + leafy header.
- 2×2 grid of large rounded cards on mobile, each with:
  1. 🧺 **Start Shopping Trip** — primary green card
  2. 📖 **Create Grocery List**
  3. 👨‍🍳 **HealthyHat AI Chatbot**
  4. 📍 **Nearby Stores**
- Bottom-safe spacing, subtle food illustrations/emoji accents.

## Grocery List (`/grocery-list`)
- Single text input + "Add" button.
- Items render as a checklist (tap to check off, swipe/× to delete).
- Saved per-user in a Cloud `grocery_items` table (RLS: user can only see their own).
- Persists across sessions and devices.

## AI Chatbot (`/chat`)
- Full chat UI: message bubbles (user right / AI left), input with send button, auto-scroll, loading indicator.
- Markdown rendering for AI replies.
- Streaming responses via a server function calling Lovable AI Gateway (`google/gemini-3-flash-preview`).
- System prompt: nutrition / healthy-eating expert focused on food, ingredients, recipes.
- Conversation history saved per-user in `chat_messages` table so it persists.
- Handles 429/402 errors with friendly toasts.

## Nearby Stores (`/stores`)
- Leaflet + OpenStreetMap (free, no key) via `react-leaflet`.
- Requests browser geolocation; centers on user with a "You" marker.
- 3–4 mock store pins generated as small offsets from the user's location, each with a popup (name, type, distance).
- Graceful fallback to a default city center if geolocation is denied.

## Shopping Trip (`/shopping-trip`)
- Friendly placeholder screen with camera icon, "Coming soon — point your camera to scan foods with AI" copy, and a Back button.

## Data model (Lovable Cloud)
- `profiles` (id → auth.users, display_name)
- `grocery_items` (id, user_id, name, checked, created_at) — RLS: user owns
- `chat_messages` (id, user_id, role, content, created_at) — RLS: user owns

## Mobile responsiveness
- Designed mobile-first (390px viewport target), works up through tablet/desktop with a max-width centered container.
- Sticky bottom-friendly tap targets, large touch areas on cards and buttons.
