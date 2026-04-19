

## Diagnosis

The Web Speech API `speechSynthesis.speak()` works on your dev machine but fails on other devices (especially iOS Safari, mobile Chrome, and some Android browsers) due to **browser autoplay/gesture policies**.

### Root cause

Currently in `shopping-trip.tsx`, `speak(reply)` is called **inside an async callback** after `await supabase.functions.invoke("vision-chat", ...)`. By the time the network request resolves (1–5 seconds later), the browser has **lost the user gesture context** from the original form submit. Mobile browsers (especially iOS Safari) then silently refuse to play the utterance.

Additional contributing factors:
1. **Voices load asynchronously** — `getVoices()` returns `[]` on first call in many browsers. We pick `undefined` as the voice and some mobile browsers refuse to speak with no voice set.
2. **iOS Safari quirk** — `speechSynthesis` must be "primed" with a synchronous `.speak()` call inside a user gesture at least once per page load before any later async speech works.
3. **No error/event logging** — we have no `onerror` / `onstart` handlers so failures are invisible.

## Fix

Apply the gesture-preserving pattern (matches the known-good Stack Overflow solution):

### 1. Prime speech synthesis on first user gesture
On the form submit (synchronous, inside the gesture), create an empty `SpeechSynthesisUtterance` and call `speak()` on it immediately. This unlocks the speech engine for the rest of the session on iOS/Safari.

### 2. Pre-create the utterance synchronously
Inside `send()` (before the `await`), create `const utter = new SpeechSynthesisUtterance("")`. After the AI reply arrives, just set `utter.text = reply` and call `speechSynthesis.speak(utter)`. The utterance retains gesture context.

### 3. Wait for voices to load
Add a `voiceschanged` listener / poll once on mount so `getVoices()` returns a real list. Cache the chosen English voice in a ref.

### 4. Add diagnostics
Wire `utter.onerror` and `utter.onstart` to `console.log` so we can see in the remote device's console exactly what's happening.

### 5. Handle the muted case correctly
Even when muted, still call `speak("")` synchronously to keep the engine primed (so unmuting later works). Or skip entirely — but document the tradeoff.

## Files changed

- `src/routes/shopping-trip.tsx` — refactor `speak()` + `send()` to preserve gesture context, preload voices, add error logging, prime on first interaction.

No new dependencies, no edge functions, no secrets.

## What stays identical

Camera fetch, vision-chat invoke, bubble UI, mic STT, mute toggle, localStorage pref, all error handling.

## Caveats

- **Firefox on Android**: no `speechSynthesis` voices ship by default — will remain silent. We'll show a one-time toast if `getVoices()` stays empty after 1s.
- **In-app browsers** (Instagram, Facebook, TikTok webviews): some block speech entirely. Not fixable from app code.

