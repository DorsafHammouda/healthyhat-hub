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
3. **Item not found**: When the user says they "can't find" an item, or it's "not at" / "out of stock at" a store, call the \`mark_item_not_found\` tool with the item and current store. Then suggest the next nearest store from their map and offer to show the route.

Formatting: brief markdown is fine (lists, **bold**). Keep replies short, warm, and never ask for a pasted recipe.`;

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
    const rows = items.map((i) => ({
      user_id: userId,
      item_name: i.item_name,
      status: "pending",
    }));
    const { data, error } = await supabase.from("grocery_lists").insert(rows).select("id,item_name");
    if (error) return JSON.stringify({ ok: false, error: error.message });
    return JSON.stringify({ ok: true, added: data?.map((d: any) => d.item_name) ?? [] });
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

    const convo: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    // First pass — non-streaming, allow tools.
    const firstResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: convo,
        tools,
      }),
    });

    if (firstResp.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (firstResp.status === 402)
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!firstResp.ok) {
      const t = await firstResp.text();
      console.error("AI first pass error:", firstResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstJson = await firstResp.json();
    const assistantMsg = firstJson.choices?.[0]?.message;
    const toolCalls = assistantMsg?.tool_calls ?? [];

    if (toolCalls.length) {
      convo.push(assistantMsg);
      for (const tc of toolCalls) {
        let args: any = {};
        try {
          args = JSON.parse(tc.function?.arguments ?? "{}");
        } catch {
          args = {};
        }
        const result = await executeTool(tc.function.name, args, supabase, userId);
        convo.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    } else if (assistantMsg) {
      // No tool call — we already have the assistant text. Stream it back synthetically
      // so the client streaming code keeps working.
      const text = assistantMsg.content ?? "";
      const stream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
          controller.enqueue(enc.encode(`data: ${chunk}\n\n`));
          controller.enqueue(enc.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Second pass — streaming follow-up with tool results in context.
    const followResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: convo,
        stream: true,
      }),
    });

    if (!followResp.ok || !followResp.body) {
      const t = await followResp.text().catch(() => "");
      console.error("AI follow-up error:", followResp.status, t);
      return new Response(JSON.stringify({ error: "AI follow-up error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(followResp.body, {
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
