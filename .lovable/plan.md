
Two small, focused changes:

1. **System prompt** — add omit-spices rule to `SYSTEM_PROMPT` in `supabase/functions/chat/index.ts`. Insert a line: "Always OMIT common spices, salt, pepper, dried herbs, and basic seasonings — assume the user has a full spice cabinet. Only include fresh ingredients, proteins, dairy, produce, and pantry staples (oils, vinegars, pasta, rice, canned goods, broths)." Keep everything else intact.

2. **Route button** — in `src/routes/grocery-list.tsx`, replace `window.open(directionsUrl(...), "_blank")` with `window.location.href = directionsUrl(...)`. Same-tab navigation. When the user taps the browser back button, the app reloads at `/grocery-list`, persistent auth restores the session, and the existing realtime subscription + initial Supabase fetch repopulates the list exactly as it was — no extra work needed since that flow already exists in the page's `useEffect`.

I considered the iframe modal alternative but Google Maps blocks embedding via `X-Frame-Options: SAMEORIGIN`, so iframes won't render directions. Same-tab redirect is the reliable choice.

### Files touched
- `supabase/functions/chat/index.ts` — one prompt edit
- `src/routes/grocery-list.tsx` — one line change in `openRoute`

No schema changes, no new dependencies.
