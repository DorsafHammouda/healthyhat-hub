

## Diagnosis

**Issue 1 — AI not responding:** Gemini's tool-call streaming via the Lovable AI Gateway is unreliable for this model. When the model decides to call `add_grocery_items`, the SSE stream often emits ONLY tool-call deltas with **zero text content** in the first pass. The current code then makes a second pass (`streamPass(false, ...)`) without tools to get the assistant's text — but there's a strong chance Gemini returns tool_calls again or returns nothing visible because the conversation now has a tool result and the model thinks it's already done. Net effect: the user sees no text, just silence.

Also: rapid double-sends (the session replay shows two messages fired ~0ms apart) hit the in-flight `streaming` guard inconsistently when typed quickly, leading to overlapping requests.

**Issue 2 — Double grocery items:** Two compounding causes:
1. **No deduplication on insert.** `executeTool` blindly inserts every item the model returns. If the user sends "pizza" twice (or the model is called twice), every ingredient is inserted twice.
2. **Retry/double-fire from the client.** When the first stream stalls without text, the user re-sends — but the first edge-function invocation already executed the tool and inserted items. The second invocation inserts them all over again. There's also no unique constraint on `(user_id, item_name)` in `grocery_lists`.

## Plan

### 1. Fix AI silence after tool call (`supabase/functions/chat/index.ts`)
- After tool execution, **force a text response** in the second pass by appending a tiny system nudge to `convo` before `streamPass(false, ...)`: `{ role: "system", content: "Now write your short, warm reply to the user about the ingredient list you just added. Mention 1–2 healthy swaps. Do not call any more tools." }`.
- If the second pass *still* returns no text (defensive fallback), synthesize a wholesome line on the server: `"Ooh! I've put together a wholesome ingredient list for you. 🌱"` and stream it as a single SSE chunk so the user always sees Sprout reply.
- Switch model from `google/gemini-2.5-flash` to `google/gemini-2.5-flash` is fine but add `tool_choice: "auto"` explicitly and `parallel_tool_calls: false` to prevent the model emitting two simultaneous identical tool calls (a known cause of duplicate inserts).

### 2. Deduplicate grocery inserts (`supabase/functions/chat/index.ts` — `executeTool`)
Before inserting, fetch the user's existing pending items and filter out any case-insensitive name match. Also dedupe within the incoming batch itself:
```ts
const incomingUnique = Array.from(new Map(items.map(i => [i.item_name.trim().toLowerCase(), i.item_name.trim()])).values());
const { data: existing } = await supabase.from("grocery_lists").select("item_name").eq("user_id", userId);
const existingSet = new Set((existing ?? []).map(r => r.item_name.toLowerCase()));
const toInsert = incomingUnique.filter(n => !existingSet.has(n.toLowerCase()));
```
Only insert `toInsert`. Return `{ ok: true, added, skipped_duplicates }` so the model knows.

### 3. Prevent client double-send (`src/routes/chat.tsx`)
The `streaming` flag exists but React state updates are async — two fast keystroke-Enter submissions can both pass the guard. Add a `sendingRef = useRef(false)` synchronous lock checked/set at the very top of `send()`, cleared in `finally`. This guarantees only one in-flight request even on rapid double-tap.

### 4. Database-level safety net (migration)
Add a partial unique index on `grocery_lists` so duplicates are physically impossible even if logic above slips:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS grocery_lists_user_item_unique
  ON public.grocery_lists (user_id, lower(item_name));
```
Switch the insert to `.upsert(rows, { onConflict: "user_id,item_name", ignoreDuplicates: true })` — but since the index uses `lower(item_name)`, we'll keep the explicit dedup in code and let the index act as a safety net (insert errors on conflict are caught and logged, not surfaced).

### Files touched
- `supabase/functions/chat/index.ts` — tool-call recovery, forced text reply, deduplication, `parallel_tool_calls: false`
- `src/routes/chat.tsx` — `sendingRef` synchronous lock
- New migration — partial unique index on `grocery_lists(user_id, lower(item_name))`

No new dependencies. No schema column changes — just an index.

