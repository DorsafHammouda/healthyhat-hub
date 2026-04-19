
The user wants to update the chat system prompt so Sprout proactively generates ingredient lists from meal names (no more "paste a recipe" prompts). The tool calling, realtime sync, and healthy swap logic are already wired up — this is purely a system prompt rewrite in the edge function.

Also need to update the empty-state copy on `src/routes/chat.tsx` which currently says "Ask me about ingredients, recipes, or how to eat healthier" to match the new behavior.

Tiny scope, no schema changes, no new tools.
