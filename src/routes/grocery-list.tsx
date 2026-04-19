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
import { RecipeBookCharacter } from "@/components/illustrations/RecipeBookCharacter";

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

const TINTS = ["bg-[oklch(0.96_0.05_85)]", "bg-[oklch(0.93_0.06_150)]"];

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
          className="h-12 rounded-full bg-card px-5 shadow-sm"
        />
        <Button type="submit" disabled={busy || !text.trim()} className="h-12 w-12 rounded-full bg-[oklch(0.74_0.14_55)] p-0 text-[oklch(0.99_0.01_95)] hover:bg-[oklch(0.7_0.14_55)]">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Button>
      </form>

      <ul className="mt-5 space-y-3">
        {items.length === 0 && (
          <li className="flex flex-col items-center rounded-3xl border border-dashed border-border p-8 text-center">
            <RecipeBookCharacter className="h-28 w-28" />
            <p className="mt-3 text-sm text-muted-foreground">Your list is empty. Add your first ingredient above. 🥕</p>
          </li>
        )}
        {items.map((it, i) => (
          <li
            key={it.id}
            className={`flex items-center gap-3 rounded-3xl px-5 py-4 shadow-sm ${TINTS[i % TINTS.length]}`}
          >
            <Checkbox checked={it.checked} onCheckedChange={() => toggle(it)} className="h-5 w-5 rounded-full" />
            <span className={`flex-1 text-sm font-bold ${it.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {it.name}
            </span>
            <button
              onClick={() => remove(it.id)}
              aria-label="Remove"
              className="grid h-9 w-9 place-items-center rounded-full bg-card/70 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
