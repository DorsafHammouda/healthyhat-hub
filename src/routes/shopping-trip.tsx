import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useRef, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Mic, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useScribe, CommitStrategy } from "@elevenlabs/react";

export const Route = createFileRoute("/shopping-trip")({
  head: () => ({
    meta: [
      { title: "Shopping Assistant — HealthyHat" },
      {
        name: "description",
        content: "Point your camera at items and ask the HealthyHat assistant about them.",
      },
    ],
  }),
  component: ShoppingTrip,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

const CAMERA_URL = "https://unripe-footing-situation.ngrok-free.dev/latest.jpg";
const TTS_MUTED_KEY = "healthyhat:tts-muted";

type CameraResult = { image: string } | { error: "warming" } | { error: "offline" };

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

async function fetchCameraFrame(): Promise<CameraResult> {
  try {
    const resp = await fetch(CAMERA_URL, {
      method: "GET",
      mode: "cors",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (resp.status === 503) {
      return { error: "warming" };
    }
    if (!resp.ok) {
      console.error(`Fetch failed to ngrok: HTTP ${resp.status} ${resp.statusText}`);
      return { error: "offline" };
    }
    const blob = await resp.blob();
    const image = await blobToBase64(blob);
    if (image) return { image };
    return { error: "offline" };
  } catch (err: any) {
    console.error(`Fetch failed to ngrok: ${err?.name ?? "Error"} - ${err?.message ?? err}`);
    return { error: "offline" };
  }
}

function ShoppingTrip() {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraOffline, setCameraOffline] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputBeforeDictationRef = useRef("");

  // Load mute pref
  useEffect(() => {
    try {
      setMuted(localStorage.getItem(TTS_MUTED_KEY) === "1");
    } catch {}
  }, []);

  const toggleMuted = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(TTS_MUTED_KEY, next ? "1" : "0");
      } catch {}
      if (next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return next;
    });
  };

  // STT: ElevenLabs Scribe
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data: any) => {
      const partial = data?.text ?? "";
      const base = inputBeforeDictationRef.current;
      setInput(base ? `${base} ${partial}`.trim() : partial);
    },
    onCommittedTranscript: (data: any) => {
      const committed = data?.text ?? "";
      if (!committed) return;
      const base = inputBeforeDictationRef.current;
      const next = base ? `${base} ${committed}`.trim() : committed;
      inputBeforeDictationRef.current = next;
      setInput(next);
    },
  });

  const startListening = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error || !data?.token) {
        toast.error("Couldn't start mic. Try again.");
        return;
      }
      inputBeforeDictationRef.current = input;
      await scribe.connect({
        token: data.token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
      setListening(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Mic failed");
    }
  };

  const stopListening = async () => {
    try {
      await scribe.disconnect();
    } catch {}
    setListening(false);
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else startListening();
  };

  // Auto-cleanup mic on unmount
  useEffect(() => {
    return () => {
      try {
        scribe.disconnect();
      } catch {}
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const playReply = async (text: string) => {
    if (muted || !text) return;
    try {
      // Stop previous
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
        body: { text },
      });
      if (error) {
        console.error("TTS invoke error", error);
        return;
      }
      // If server returned JSON fallback (quota/auth issue), data is a Blob of type application/json
      if (data instanceof Blob && data.type.includes("json")) {
        const txt = await data.text();
        console.warn("TTS unavailable:", txt);
        toast("Voice unavailable (ElevenLabs quota/auth issue)");
        return;
      }
      const blob =
        data instanceof Blob
          ? data
          : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play().catch((e) => console.error("Audio play failed", e));
    } catch (e) {
      console.error("playReply failed", e);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || !session) return;
    if (sendingRef.current) return;
    sendingRef.current = true;

    // Stop dictation if active
    if (listening) {
      try {
        await scribe.disconnect();
      } catch {}
      setListening(false);
    }

    setInput("");
    inputBeforeDictationRef.current = "";
    setBusy(true);
    setMessages((p) => [
      ...p,
      { role: "user", content: text },
      { role: "assistant", content: "📸 Scanning items...", pending: true },
    ]);

    try {
      const result = await fetchCameraFrame();

      if ("error" in result && result.error === "warming") {
        toast("Camera warming up, please try again in a second.");
        setMessages((p) => p.filter((m) => !m.pending));
        return;
      }

      const image = "image" in result ? result.image : null;
      setCameraOffline(!image);

      if (!image) {
        setMessages((p) => {
          const next = [...p];
          const idx = next.findIndex((m) => m.pending);
          if (idx !== -1)
            next[idx] = {
              role: "assistant",
              content: "⚠️ Camera offline (Check ngrok tunnel)",
              pending: true,
            };
          return next;
        });
      }

      const promptText = image ? text : `[no camera frame available] ${text}`;

      const { data, error } = await supabase.functions.invoke("vision-chat", {
        body: { text: promptText, image },
      });

      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error("Too many requests. Slow down a moment.");
        else if (status === 402)
          toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        else toast.error(error.message ?? "Assistant failed");
        setMessages((p) => p.filter((m) => !m.pending));
        return;
      }

      const reply = (data as any)?.reply ?? "I couldn't generate a response.";
      setMessages((p) => {
        const next = [...p];
        const idx = next.findIndex((m) => m.pending);
        if (idx !== -1) next[idx] = { role: "assistant", content: reply };
        return next;
      });

      // Speak the reply
      playReply(reply);
    } catch (err: any) {
      toast.error(err?.message ?? "Assistant failed");
      setMessages((p) => p.filter((m) => !m.pending));
    } finally {
      setBusy(false);
      sendingRef.current = false;
    }
  };

  return (
    <MobileShell
      title="Shopping Assistant"
      right={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMuted}
            aria-label={muted ? "Unmute voice" : "Mute voice"}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-sm transition active:scale-95"
          >
            {muted ? (
              <VolumeX className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={2.25} />
            )}
          </button>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[oklch(0.93_0.06_150)] text-[oklch(0.4_0.13_145)]">
            <Camera className="h-5 w-5" strokeWidth={2.25} />
          </span>
        </div>
      }
    >
      {cameraOffline && (
        <div className="mb-3 rounded-2xl bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground">
          📷 Camera offline — answering from text only
        </div>
      )}

      <div ref={scrollRef} className="h-[calc(100vh-260px)] overflow-y-auto pb-2">
        {messages.length === 0 && (
          <div className="mt-10 flex flex-col items-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-[oklch(0.93_0.06_150)]">
              <Camera className="h-10 w-10 text-[oklch(0.4_0.13_145)]" strokeWidth={2.25} />
            </div>
            <h2 className="mt-5 text-xl font-extrabold">Ready to scan 🛒</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Ask about an item you see. I'll peek through the camera and tell you about its price,
              nutrition, or how to use it.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-3xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-lg bg-[oklch(0.74_0.14_55)] text-[oklch(0.99_0.01_95)]"
                    : "rounded-bl-lg bg-[oklch(0.96_0.03_85)] text-foreground"
                } ${m.pending ? "animate-pulse" : ""}`}
              >
                {m.role === "assistant" && !m.pending ? (
                  <div className="prose prose-sm max-w-none break-words [&>*]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap break-words">{m.content}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={send}
        className="fixed inset-x-0 bottom-24 z-10 mx-auto flex w-full max-w-md gap-2 px-4"
      >
        <Button
          type="button"
          onClick={toggleMic}
          aria-label={listening ? "Stop dictation" : "Start dictation"}
          className={`h-12 w-12 shrink-0 rounded-full p-0 shadow-md ${
            listening
              ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <Mic className="h-5 w-5" strokeWidth={2.25} />
        </Button>
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            inputBeforeDictationRef.current = e.target.value;
          }}
          placeholder={listening ? "Listening…" : "Ask about an item you see…"}
          className="h-12 rounded-full border-border bg-card px-5 shadow-sm"
          disabled={busy}
        />
        <Button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-12 w-12 shrink-0 rounded-full bg-[oklch(0.74_0.14_55)] p-0 text-[oklch(0.99_0.01_95)] shadow-md hover:bg-[oklch(0.7_0.14_55)]"
        >
          <Send className="h-5 w-5" strokeWidth={2.25} />
        </Button>
      </form>
    </MobileShell>
  );
}
