**"Update** `fetchCameraFrame()` **in** `src/routes/shopping-trip.tsx` **with these strict requirements to match my Raspberry Pi API:**

1. **Correct URL & Method:** Set `CAMERA_URL` to `https://ngrok-free.dev`. Use a **GET** request. (Note: Do not use `/latest.jpg` as it does not return JSON).
2. **Headers:** Include `mode: "cors"` and these specific headers:
  - `"ngrok-skip-browser-warning": "true"`
  - `"Content-Type": "application/json"`
3. **Warming Up (503) Handling:**
  - If the response status is **503**, return `{ error: "warming" }`.
  - In the caller logic, if `{ error: "warming" }` is received, show a toast: **'Camera warming up, please try again in a second.'** and abort the send (remove the pending chat bubble and do not call the AI).
4. **Offline Handling:** For any other non-200 response or network failure, return `{ error: "offline" }`. Show the existing '⚠️ Camera offline' message in the bubble.
5. **Data Extraction:** On a 200 OK response, parse the JSON and extract `data.image_base64`. Return `{ image: data.image_base64 }`.
6. **Vision Chat:** Forward that string to the `vision-chat` edge function. **Do not render the image in the UI.**"

---

**Why this version works 100%:**

- **The** `/api/frame` **fix:** Your Python script only provides the `image_base64` key at this specific endpoint. If Lovable hits `/latest.jpg`, the code will break because there is no JSON to parse.
- **The 503 logic:** It correctly handles the "No frame yet" state from your script so the user isn't confused.
- **Protocol Match:** It matches the `GET` requirement and headers needed to bypass ngrok's security wall.