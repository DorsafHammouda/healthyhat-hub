import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MobileShell } from "@/components/MobileShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/grocery-list")({
  head: () => ({
    meta: [
      { title: "Grocery List — HealthyHat" },
      { name: "description", content: "Plan your grocery basket with a quick checklist that syncs across devices." },
    ],
  }),
  component: GroceryListPage,
});

type Item = { id: string; name: string; checked: boolean };

function GroceryListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("grocery_items")
      .select("id,name,checked")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setItems(data ?? []);
      });
  }, [user]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const name = text.trim();
    if (!name || !user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("grocery_items")
      .insert({ name, user_id: user.id })
      .select("id,name,checked")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) {
      setItems((p) => [data, ...p]);
      setText("");
    }
  };

  const toggle = async (it: Item) => {
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)));
    const { error } = await supabase.from("grocery_items").update({ checked: !it.checked }).eq("id", it.id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    setItems((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from("grocery_items").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <MobileShell title="Grocery List">
      <form onSubmit={add} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an ingredient…"
          className="h-11 rounded-2xl"
        />
        <Button type="submit" disabled={busy || !text.trim()} className="h-11 rounded-2xl px-4">
          <Plus className="h-5 w-5" />
        </Button>
      </form>

      <ul className="mt-5 space-y-2">
        {items.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Your list is empty. Add your first ingredient above. 🥕
          </li>
        )}
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <Checkbox checked={it.checked} onCheckedChange={() => toggle(it)} />
            <span className={`flex-1 text-sm ${it.checked ? "text-muted-foreground line-through" : ""}`}>
              {it.name}
            </span>
            <button
              onClick={() => remove(it.id)}
              aria-label="Remove"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
