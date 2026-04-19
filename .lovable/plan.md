
The endpoint `https://ngrok-free.dev` is wrong (DNS-failing). User wants the real Pi tunnel `https://unripe-footing-situation.ngrok-free.dev/latest.jpg`. That endpoint returns a raw JPEG (not JSON), so we must read it as a Blob and base64-encode it client-side, then forward to `vision-chat` (which already wraps it as `data:image/jpeg;base64,...`).

### Changes (single file: `src/routes/shopping-trip.tsx`)

1. `CAMERA_URL` → `https://unripe-footing-situation.ngrok-free.dev/latest.jpg`
2. `fetchCameraFrame()`:
   - GET, `mode: "cors"`, headers `ngrok-skip-browser-warning: true` (drop `Content-Type` — it's a binary GET).
   - 503 → `{ error: "warming" }`.
   - Non-OK / network fail → `{ error: "offline" }`.
   - On 200: `await resp.blob()` → FileReader → strip `data:image/jpeg;base64,` prefix → return `{ image: <base64> }`.
3. Caller logic unchanged — still forwards base64 to `vision-chat`, never renders the image.

No edge function, deps, or DB changes.
