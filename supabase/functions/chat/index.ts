import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Sprout 🌱 — a warm, wholesome, slightly playful food and nutrition buddy.

Your personality:
- Cheerful, gentle, and encouraging. Use friendly emojis sparingly (🥕🌱🥑).
- Speak in short, kind sentences. Never lecture.
- NEVER ask the user to paste a recipe. You already know recipes — generate them yourself.

Core capabilities:
1. **Meal → instant grocery list (generative)**: When the user says things like "I want to make [Meal]", "Give me a recipe for [Meal]", "How do I make [Meal]", or simply names a dish, you must:
   a. Use your own culinary knowledge to compose a standard ingredient list for that meal (8–14 common ingredients, short names like "olive oil", "yellow onion", "whole wheat pasta").
   b. Reply with EXACTLY this opening line, substituting the meal name: "Ooh! [Meal] sounds sparkly! I've put together a wholesome ingredient list for you. 🌱"
   c. In the same short reply, suggest 1–2 healthy swaps inline (e.g. "I swapped white pasta for whole wheat 🌾 and used Greek yogurt instead of heavy cream 🥄").
   d. In the SAME turn, call the \`add_grocery_items\` tool with the final (already-swapped) ingredient list. Do not ask permission first.
2. **Healthy swaps**: Always prefer wholesome alternatives for notably unhealthy staples (heavy cream → Greek yogurt; white sugar → maple syrup or honey; butter → olive oil; bacon → turkey bacon; white bread/pasta/rice → whole wheat or brown; soda → sparkling water; margarine → olive oil). Apply silently to the tool call, and mention 1–2 of the swaps warmly in your reply.
3. **Omit pantry seasonings**: Always OMIT common spices, salt, pepper, dried herbs, and basic seasonings — assume the user has a full spice cabinet. Only include fresh ingredients, proteins, dairy, produce, and pantry staples (oils, vinegars, pasta, rice, canned goods, broths).
4. **Item not found**: When the user says they "can't find" an item, or it's "not at" / "out of stock at" a store, call the \`mark_item_not_found\` tool with the item and current store. Then suggest the next nearest store from their map and offer to show the route.

Formatting: brief markdown is fine (lists, **bold**). Keep replies short, warm, and never ask for a pasted recipe.

Be concise but wholesome — 1–3 short sentences max. Prioritise calling \`add_grocery_items\` over chit-chat. No long explanations or filler.`;

const tools = [
  {
    type: "function",
    function: {
      name: "add_grocery_items",
      description:
        "Add one or more ingredients to the user's grocery list. Call this whenever the user shares a recipe, meal idea, or asks to add items.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Ingredients to add (already swapped to healthier versions if applicable).",
            items: {
              type: "object",
              properties: {
                item_name: { type: "string", description: "Short ingredient name, e.g. 'Greek yogurt'." },
              },
              required: ["item_name"],
              additionalProperties: false,
            },
          },
        },
        required: ["items"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_item_not_found",
      description:
        "Mark a grocery item as not found at a specific store. Use when the user says they can't find an item.",
      parameters: {
        type: "object",
        properties: {
          item_name: { type: "string" },
          store_name: { type: "string", description: "The store where the item could not be found." },
        },
        required: ["item_name", "store_name"],
        additionalProperties: false,
      },
    },
  },
];

async function executeTool(
  name: string,
  args: any,
  supabase: any,
  userId: string,
): Promise<string> {
  if (name === "add_grocery_items") {
    const items = (args.items ?? []) as Array<{ item_name: string }>;
    if (!items.length) return JSON.stringify({ ok: false, error: "no items" });

    // Dedupe within the incoming batch (case-insensitive, trimmed)
    const incomingMap = new Map<string, string>();
    for (const i of items) {
      const trimmed = (i.item_name ?? "").trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!incomingMap.has(key)) incomingMap.set(key, trimmed);
    }
    const incomingUnique = Array.from(incomingMap.entries()); // [key, displayName]

    // Filter out any item already in the user's list
    const { data: existing } = await supabase
      .from("grocery_lists")
      .select("item_name")
      .eq("user_id", userId);
    const existingSet = new Set(
      ((existing ?? []) as Array<{ item_name: string }>).map((r) => r.item_name.toLowerCase()),
    );
    const toInsert = incomingUnique.filter(([key]) => !existingSet.has(key));
    const skipped = incomingUnique.length - toInsert.length;

    if (!toInsert.length) {
      return JSON.stringify({ ok: true, added: [], skipped_duplicates: skipped });
    }

    const rows = toInsert.map(([, name]) => ({
      user_id: userId,
      item_name: name,
      status: "pending",
    }));
    const { data, error } = await supabase
      .from("grocery_lists")
      .insert(rows)
      .select("id,item_name");
    if (error) {
      // Unique-index conflicts are a safety net — log & report best-effort
      console.error("grocery insert error:", error.message);
      return JSON.stringify({ ok: false, error: error.message, skipped_duplicates: skipped });
    }
    return JSON.stringify({
      ok: true,
      added: data?.map((d: any) => d.item_name) ?? [],
      skipped_duplicates: skipped,
    });
  }
  if (name === "mark_item_not_found") {
    const { item_name, store_name } = args;
    const { data, error } = await supabase
      .from("grocery_lists")
      .update({ status: "not_found", store_name })
      .eq("user_id", userId)
      .ilike("item_name", item_name)
      .select("id,item_name");
    if (error) return JSON.stringify({ ok: false, error: error.message });
    return JSON.stringify({ ok: true, updated: data?.length ?? 0, store_name });
  }
  return JSON.stringify({ ok: false, error: "unknown tool" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const trimmed = Array.isArray(messages) ? messages.slice(-5) : [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_PUBLISHABLE_KEY =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase env not set");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const convo: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed];

    async function streamPass(
      withTools: boolean,
      writer: WritableStreamDefaultWriter<Uint8Array>,
      enc: TextEncoder,
    ): Promise<{ toolCalls: any[]; assistantContent: string; status: number; errBody?: string }> {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: convo,
          stream: true,
          ...(withTools
            ? { tools, tool_choice: "auto", parallel_tool_calls: false }
            : {}),
        }),
      });
      if (!resp.ok || !resp.body) {
        const errBody = await resp.text().catch(() => "");
        return { toolCalls: [], assistantContent: "", status: resp.status, errBody };
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      const toolAcc: Record<number, { id?: string; name?: string; args: string }> = {};

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          let j: any;
          try { j = JSON.parse(payload); } catch { continue; }
          const delta = j.choices?.[0]?.delta;
          if (!delta) continue;
          if (typeof delta.content === "string" && delta.content) {
            assistantContent += delta.content;
            const out = JSON.stringify({ choices: [{ delta: { content: delta.content } }] });
            await writer.write(enc.encode(`data: ${out}\n\n`));
          }
          if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const i = tc.index ?? 0;
              const slot = (toolAcc[i] ??= { args: "" });
              if (tc.id) slot.id = tc.id;
              if (tc.function?.name) slot.name = tc.function.name;
              if (tc.function?.arguments) slot.args += tc.function.arguments;
            }
          }
        }
      }
      const toolCalls = Object.keys(toolAcc)
        .map((k) => Number(k))
        .sort((a, b) => a - b)
        .map((i) => ({
          id: toolAcc[i].id ?? `call_${i}`,
          type: "function",
          function: { name: toolAcc[i].name ?? "", arguments: toolAcc[i].args },
        }))
        .filter((c) => c.function.name);
      return { toolCalls, assistantContent, status: 200 };
    }

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const enc = new TextEncoder();

    async function streamFallback(text: string) {
      const out = JSON.stringify({ choices: [{ delta: { content: text } }] });
      await writer.write(enc.encode(`data: ${out}\n\n`));
    }

    (async () => {
      try {
        const first = await streamPass(true, writer, enc);
        if (first.status === 429 || first.status === 402) {
          await streamFallback(first.status === 429 ? "Rate limit exceeded." : "AI credits exhausted.");
        } else if (first.status !== 200) {
          console.error("AI first pass error:", first.status, first.errBody);
          await streamFallback("Sorry, something went wrong. 🌱");
        } else if (first.toolCalls.length) {
          convo.push({
            role: "assistant",
            content: first.assistantContent || null,
            tool_calls: first.toolCalls,
          });
          for (const tc of first.toolCalls) {
            let args: any = {};
            try { args = JSON.parse(tc.function.arguments || "{}"); } catch { args = {}; }
            const result = await executeTool(tc.function.name, args, supabase, userId);
            convo.push({ role: "tool", tool_call_id: tc.id, content: result });
          }
          // Force a text reply on the second pass — no more tools.
          convo.push({
            role: "system",
            content:
              "Now write your short, warm reply to the user about the ingredient list you just added. Mention 1–2 healthy swaps you made. Do not call any more tools. Keep it to 1–3 short sentences.",
          });
          const second = await streamPass(false, writer, enc);
          if (second.status !== 200 || !second.assistantContent.trim()) {
            // Defensive fallback so the user always sees Sprout reply
            await streamFallback("Ooh! I've put together a wholesome ingredient list for you. 🌱");
          }
        }
        await writer.write(enc.encode(`data: [DONE]\n\n`));
      } catch (err) {
        console.error("stream error:", err);
      } finally {
        try { await writer.close(); } catch { /* ignore */ }
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
