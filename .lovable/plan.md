
Concise plan covering all four asks. The route button is already same-tab via `window.location.href`, but the URL format can be improved to a more universal Google Maps walking-directions URL as requested. The notification dot needs a tiny new piece of state (a "last seen count" in localStorage) since we don't currently track it.

### 1. Reset Trip button + AI clear (`src/routes/grocery-list.tsx`)
- Add a small "Reset trip" pill button in the header area of the Grocery List view (top-right of the cost summary card).
- On click: confirm via `window.confirm`, then in parallel:
  - `supabase.from("grocery_lists").delete().eq("user_id", user.id)`
  - `supabase.from("chat_messages").delete().eq("user_id", user.id)`
- Locally clear `items` state and toast "Clean slate! 🌱". Realtime listener already handles wiping from other tabs.
- Sprout's "clean slate greeting" happens naturally because the chat page loads zero messages and shows the existing empty state ("Tell me a meal you'd love to make…"). No extra change needed in `chat.tsx`.

### 2. Route button URL fix (`src/lib/mockStoreData.ts` + `src/routes/grocery-list.tsx`)
- Update `directionsUrl(...)` to return the universal walking URL:
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}+near+${lat},${lng}&travelmode=walking`
  (uses store name + coords as the destination text and adds `travelmode=walking`).
- In `openRoute`, switch from `window.location.href = ...` to `window.location.assign(...)` (semantically identical, matches the user's spec).

### 3. Red notification dot on Dashboard "Grocery List" card (`src/routes/index.tsx`)
- Add lightweight "unseen items" detection:
  - Dashboard `useEffect` (after auth): query `supabase.from("grocery_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id)` to get current count.
  - Read `localStorage.getItem("hh:lastSeenGroceryCount")` (default 0). If `currentCount > lastSeen`, show a red dot.
  - Subscribe to realtime INSERT events on `grocery_lists` filtered by user_id; bump current count and re-evaluate so the dot appears live when Sprout adds items while the dashboard is open.
- Render a small absolute-positioned red dot (`h-3 w-3 rounded-full bg-destructive ring-2 ring-background`) on the top-right of the Grocery List card.
- Dismissal: in `src/routes/grocery-list.tsx`, on mount once items load, write `localStorage.setItem("hh:lastSeenGroceryCount", String(items.length))`. Also re-write whenever items length changes while the page is open, so the dot stays cleared.

### 4. AI performance boost (`supabase/functions/chat/index.ts`)
- **Streaming-first**: Restructure to always stream. Make the first call with `stream: true` AND `tools` enabled. Parse the SSE stream from the gateway, accumulating any `tool_calls` deltas while forwarding text deltas straight to the client. If tool calls were emitted, execute them, then make a second streamed call and forward that stream too. (Gemini supports streamed tool-call arguments.) This removes the current "wait for full first response before streaming" bottleneck.
- **Last 5 messages only**: `const trimmed = messages.slice(-5);` before building `convo`. System prompt always stays.
- **Concise persona**: Append to `SYSTEM_PROMPT`: "Be concise but wholesome — 1–3 short sentences max. Prioritise calling `add_grocery_items` over chit-chat. No long explanations or filler."

### Files touched
- `src/routes/grocery-list.tsx` — Reset button, dismissal write, `assign()` swap
- `src/routes/index.tsx` — notification dot + count query + realtime sub
- `src/lib/mockStoreData.ts` — `directionsUrl` rewrite
- `supabase/functions/chat/index.ts` — streaming-first refactor, 5-msg window, prompt tweak

No DB schema changes, no new dependencies.
