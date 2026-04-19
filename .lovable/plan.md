

## Goal
Replace ElevenLabs with browser-native APIs (no API keys, no quota issues, no edge functions needed).

## Approach
- **TTS**: Web Speech API `speechSynthesis` (built into all modern browsers, free, instant).
- **STT**: Web Speech API `SpeechRecognition` / `webkitSpeechRecognition` (built into Chrome, Edge, Safari — works on mobile too).

Both run entirely client-side. No edge functions, no API keys, no network round-trips.

## Changes

### 1. `src/routes/shopping-trip.tsx` (modified)
- Remove `@elevenlabs/react` `useScribe` usage and all `supabase.functions.invoke("elevenlabs-tts" / "elevenlabs-scribe-token")` calls.
- Remove `audioRef` blob playback.
- **TTS**: new `speak(text)` helper using `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`. Cancel previous utterance before speaking new one. Skip if `muted`.
- **STT**: new `useSpeechRecognition()` inline logic using `window.SpeechRecognition || window.webkitSpeechRecognition`. Continuous + interim results. On result → update `input` state. On end → just stop listening (user still presses send).
- Keep mic button, speaker toggle, input, send button, all bubble UI, camera logic, error handling — all unchanged.
- Show toast if browser doesn't support SpeechRecognition (e.g. Firefox).

### 2. Cleanup (optional, safe to leave)
- `supabase/functions/elevenlabs-tts/` and `supabase/functions/elevenlabs-scribe-token/` — leave as-is (unused, harmless). Remove their entries from `supabase/config.toml`.
- `package.json` — remove `@elevenlabs/react` dependency.

## What stays identical
Camera fetch, ngrok URL, `vision-chat` invoke, bubble UI, typed input, send button, mic button placement, speaker toggle, all error handling, auth gate, localStorage mute pref.

## Notes
- Web Speech API STT requires HTTPS (preview/published URLs are HTTPS, so fine).
- Voice selection: use the browser's default voice. Optionally pick first English voice for consistency.
- No secret needed.

