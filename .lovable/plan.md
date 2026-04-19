

## Goal
Two additions to `src/routes/shopping-trip.tsx`, keeping all existing logic (camera, vision-chat, bubbles, errors) untouched:

1. **TTS** — AI replies are spoken aloud automatically.
2. **STT** — User can dictate their question into the input field via a mic button (instead of typing). Typed input still works.

## Approach
Single provider: ElevenLabs.
- **TTS**: new edge function `elevenlabs-tts` streams MP3 → client autoplays.
- **STT**: new edge function `elevenlabs-scribe-token` mints a short-lived token → client uses `@elevenlabs/react`'s `useScribe` (VAD) → committed transcript fills the existing `<Input>`.

Requires `ELEVENLABS_API_KEY` secret (will request after approval).

## Changes

### 1. `supabase/functions/elevenlabs-tts/index.ts` (new)
POST `{ text }` → ElevenLabs `text-to-speech/EXAVITQu4vr4xnSDxMaL/stream?output_format=mp3_44100_128`, model `eleven_turbo_v2_5`. Returns `audio/mpeg` stream with CORS.

### 2. `supabase/functions/elevenlabs-scribe-token/index.ts` (new)
POST → ElevenLabs `single-use-token/realtime_scribe` → returns `{ token }`. CORS enabled.

### 3. `supabase/config.toml`
Register both functions with `verify_jwt = false`.

### 4. `src/routes/shopping-trip.tsx`
- Add `@elevenlabs/react` dep.
- **Mic button** inside the input row (left of send): tap to start dictation, tap again to stop. Live partial transcript shown as the input's value; committed transcript stays in the input so user can edit before pressing send. Mic icon pulses red while listening.
- **Speaker toggle** in the header (next to camera icon): mute/unmute TTS, persisted in `localStorage`.
- After each successful AI reply (and if not muted): invoke `elevenlabs-tts` → play returned blob via `new Audio()`. Track current audio in a ref so a new reply stops the previous one.

### 5. Secret needed
`ELEVENLABS_API_KEY` — requested via add_secret after approval.

## What stays identical
Camera fetch, ngrok URL, `vision-chat` invoke, bubble UI, typed input, send button, all error handling, auth gate.

