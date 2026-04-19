import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MobileShell } from "@/components/MobileShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ChefCharacter } from "@/components/illustrations/ChefCharacter";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "HealthyHat AI — Food chatbot" },
      { name: "description", content: "Ask the HealthyHat AI about ingredients, recipes, and healthy eating." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_messages")
      .select("role,content")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data.filter((m) => m.role !== "system") as Msg[]);
      });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming || !user || !session) return;
    if (sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);

    supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: text }).then(() => {});

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (resp.status === 429) {
        toast.error("Too many requests. Please slow down a moment.");
        setMessages((p) => p.slice(0, -1));
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        setMessages((p) => p.slice(0, -1));
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      let done = false;

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { done = true; break; }
          try {
            const j = JSON.parse(payload);
            const c = j.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantText } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (assistantText) {
        await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: assistantText });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Chat failed");
    } finally {
      setStreaming(false);
      sendingRef.current = false;
    }
  };

  return (
    <MobileShell title="HealthyHat AI">
      <div ref={scrollRef} className="h-[calc(100vh-220px)] overflow-y-auto pb-2">
        {messages.length === 0 && (
          <div className="mt-8 flex flex-col items-center text-center">
            <ChefCharacter className="h-32 w-32" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Hi, I'm Sprout 🌱 Tell me a meal you'd love to make and I'll build your grocery list.
            </p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-3xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-lg bg-primary text-primary-foreground"
                    : "rounded-bl-lg bg-[oklch(0.93_0.06_150)] text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none break-words [&>*]:my-1">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
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
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try: I want to make lasagna…"
          className="h-12 rounded-full border-border bg-card px-5 shadow-sm"
          disabled={streaming}
        />
        <Button
          type="submit"
          disabled={streaming || !input.trim()}
          className="h-12 w-12 rounded-full bg-[oklch(0.74_0.14_55)] p-0 text-[oklch(0.99_0.01_95)] shadow-md hover:bg-[oklch(0.7_0.14_55)]"
        >
          <Send className="h-5 w-5" strokeWidth={2.25} />
        </Button>
      </form>
    </MobileShell>
  );
}
