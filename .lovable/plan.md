

## Goal
Convert the shopping-trip chat from typed input to a hands-free voice call: press mic → speak → AI sees the camera frame + hears your question → AI replies with voice. All existing logic (camera fetch, `vision-chat` edge function, pending-bubble UX, offline/warming handling) stays identical.

## Approach
Use **ElevenLabs** end-to-end (already documented in context, single provider, lowest moving parts):
- **STT**: ElevenLabs realtime Scribe (`@elevenlabs/react` `useScribe` hook) — mic → text.
- **TTS**: ElevenLabs streaming TTS via a new edge function — AI reply text → MP3 → autoplay.
- **Vision**: unchanged. We feed the transcribed text + camera base64 into the existing `vision-chat` function.

Requires `ELEVENLABS_API_KEY` secret (will request via add_secret after approval).

## UX changes (`src/routes/shopping-trip.tsx`)
Replace the bottom input + send button with a single large round **mic button**:

- Idle: green mic, label "Tap to speak"
- Listening (red, pulsing): live partial transcript shown above the button as a faint chip
- Tap again → stops listening, commits transcript, runs the existing send pipeline (camera fetch → vision-chat → reply)
- While AI thinks: button shows spinner, label "Thinking…"
- While AI speaks: button shows speaker icon, label "Tap to interrupt" (tapping stops audio + re-arms mic)

Chat transcript bubbles remain (so the user can scroll back), but the keyboard input is gone.

## Files

1. **`supabase/functions/elevenlabs-tts/index.ts`** (new)
   - Accepts `{ text, voiceId? }`, calls ElevenLabs `text-to-speech/{voiceId}/stream?output_format=mp3_44100_128` with `eleven_turbo_v2_5`.
   - Returns raw `audio/mpeg` stream. CORS enabled. Default voice: Sarah (`EXAVITQu4vr4xnSDxMaL`).
   - Registered in `supabase/config.toml` with `verify_jwt = false` (TTS doesn't need user identity).

2. **`supabase/functions/elevenlabs-scribe-token/index.ts`** (new)
   - POSTs to `https://api.elevenlabs.io/v1/single-use-token/realtime_scribe` with `xi-api-key`.
   - Returns `{ token }`. CORS enabled, `verify_jwt = false`.

3. **`src/routes/shopping-trip.tsx`** (modified)
   - Add `@elevenlabs/react` dep.
   - Replace input form with `<MicButton />` inline component using `useScribe` (VAD commit strategy).
   - On committed transcript → run existing `send()` logic (unchanged camera + vision-chat flow).
   - On AI reply → `fetch('/functions/v1/elevenlabs-tts', { body: { text: reply } })` → `Blob` → `new Audio(url).play()`.
   - Track playback in a ref so user can interrupt by tapping the button (stops audio, restarts mic).
   - Keep the existing `cameraOffline` banner, warming toast, error toasts, and message bubble rendering.

4. **`package.json`** — add `@elevenlabs/react`.

## What stays identical
- `fetchCameraFrame()` and the ngrok URL.
- `supabase.functions.invoke("vision-chat", { body: { text, image } })` call shape.
- Pending-bubble + "📸 Scanning items..." behavior.
- 503 warming toast, offline bubble, 429/402 toasts.
- Auth gating (`useAuth` redirect to `/auth`).

## Secret needed
`ELEVENLABS_API_KEY` — I'll request it with `add_secret` once you approve. Get it from elevenlabs.io → Profile → API Keys.

