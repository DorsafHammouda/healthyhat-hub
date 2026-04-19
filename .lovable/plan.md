
Switch the camera fetch in `src/routes/shopping-trip.tsx` from POST to GET on the same ngrok endpoint, keeping the bypass header.

### Change
In `fetchCameraFrame()`:
- `method: "POST"` → `method: "GET"`
- Keep URL `https://unripe-footing-situation.ngrok-free.dev/trigger-capture`
- Keep `mode: "cors"` and `"ngrok-skip-browser-warning": "true"`
- Keep JSON parse expecting `{ image: "<base64>" }`
- Keep hidden-image flow (base64 forwarded to `vision-chat`, never rendered)

No other files change.
