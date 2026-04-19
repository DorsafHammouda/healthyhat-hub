import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Check, MapPin, Navigation, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { RecipeBookCharacter } from "@/components/illustrations/RecipeBookCharacter";
import {
  directionsUrl,
  estimateItemPrice,
  getNearestStore,
  getNextStoreAfter,
  getStoreByName,
  rankStores,
} from "@/lib/mockStoreData";

export const Route = createFileRoute("/grocery-list")({
  head: () => ({
    meta: [
      { title: "Grocery List — HealthyHat" },
      { name: "description", content: "Your AI-powered grocery list with realtime updates and store routing." },
    ],
  }),
  component: GroceryListPage,
});

type Item = {
  id: string;
  item_name: string;
  status: "pending" | "found" | "not_found";
  store_name: string | null;
  distance_km: number | null;
};

function GroceryListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [pos, setPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from("grocery_lists")
      .select("id,item_name,status,store_name,distance_km")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        else setItems((data ?? []) as Item[]);
      });

    const channel = supabase
      .channel(`grocery_lists_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grocery_lists", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Item;
              if (prev.some((p) => p.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Item;
              return prev.map((p) => (p.id === row.id ? row : p));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Item;
              return prev.filter((p) => p.id !== row.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const nearest = useMemo(() => getNearestStore(pos), [pos]);

  const totalCost = useMemo(() => {
    let total = 0;
    for (const it of items) {
      if (it.status === "found" || it.status === "not_found") continue;
      const store = getStoreByName(it.store_name) ?? nearest;
      total += estimateItemPrice(it.item_name, store.multiplier);
    }
    return total;
  }, [items, nearest]);

  const setStatus = async (it: Item, status: Item["status"]) => {
    const patch: Partial<Item> =
      status === "found" || status === "not_found"
        ? { status, store_name: it.store_name ?? nearest.name, distance_km: it.distance_km ?? Math.round(nearest.distanceKm * 10) / 10 }
        : { status };
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("grocery_lists").update(patch).eq("id", it.id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    setItems((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from("grocery_lists").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  const findElsewhere = async (it: Item) => {
    const next = getNextStoreAfter(it.store_name, pos);
    if (!next) {
      toast.error("No more nearby stores to try.");
      return;
    }
    const distance = Math.round(next.distanceKm * 10) / 10;
    setItems((p) =>
      p.map((x) =>
        x.id === it.id
          ? { ...x, status: "pending", store_name: next.name, distance_km: distance }
          : x,
      ),
    );
    const { error } = await supabase
      .from("grocery_lists")
      .update({ status: "pending", store_name: next.name, distance_km: distance })
      .eq("id", it.id);
    if (error) toast.error(error.message);
    else toast.success(`Try ${next.name} — ${distance} km away 🌿`);
  };

  const openRoute = (it: Item) => {
    const ranked = rankStores(pos);
    const target = ranked.find((s) => s.name === it.store_name) ?? nearest;
    window.location.assign(directionsUrl(target.lat, target.lng, target.name));
  };

  const resetTrip = async () => {
    if (!user) return;
    if (!window.confirm("Reset trip? This clears your grocery list and chat history.")) return;
    setItems([]);
    localStorage.setItem("hh:lastSeenGroceryCount", "0");
    const [g, c] = await Promise.all([
      supabase.from("grocery_lists").delete().eq("user_id", user.id),
      supabase.from("chat_messages").delete().eq("user_id", user.id),
    ]);
    if (g.error || c.error) toast.error(g.error?.message ?? c.error?.message ?? "Reset failed");
    else toast.success("Clean slate! 🌱");
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <MobileShell title="Grocery List">
      {/* Cost + nearest store summary */}
      <div className="rounded-[2rem] bg-[oklch(0.93_0.06_150)] p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">
          Estimated total · {pendingCount} item{pendingCount === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-foreground">${totalCost.toFixed(2)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
          Nearest: {nearest.name} · {nearest.distanceKm.toFixed(1)} km
        </p>
      </div>

      {/* Hint to use the chat */}
      <button
        onClick={() => navigate({ to: "/chat" })}
        className="mt-4 w-full rounded-[1.75rem] bg-[oklch(0.96_0.05_85)] px-5 py-3 text-left text-sm font-semibold text-foreground shadow-sm hover:bg-[oklch(0.94_0.06_85)]"
      >
        ✨ Paste a recipe in chat — I'll add the ingredients automatically.
      </button>

      {/* Items */}
      <ul className="mt-5 space-y-3">
        {items.length === 0 && (
          <li className="flex flex-col items-center rounded-3xl border border-dashed border-border p-8 text-center">
            <RecipeBookCharacter className="h-28 w-28" />
            <p className="mt-3 text-sm text-muted-foreground">
              Your list is empty. Ask me to add a recipe and watch it appear here. 🥕
            </p>
          </li>
        )}
        {items.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            onToggleFound={() => setStatus(it, it.status === "found" ? "pending" : "found")}
            onMarkNotFound={() => setStatus(it, "not_found")}
            onFindElsewhere={() => findElsewhere(it)}
            onRoute={() => openRoute(it)}
            onRemove={() => remove(it.id)}
          />
        ))}
      </ul>
    </MobileShell>
  );
}

function ItemRow({
  item,
  onToggleFound,
  onMarkNotFound,
  onFindElsewhere,
  onRoute,
  onRemove,
}: {
  item: Item;
  onToggleFound: () => void;
  onMarkNotFound: () => void;
  onFindElsewhere: () => void;
  onRoute: () => void;
  onRemove: () => void;
}) {
  const tone =
    item.status === "found"
      ? "bg-[oklch(0.93_0.06_150)]"
      : item.status === "not_found"
        ? "bg-[oklch(0.92_0.07_60)]"
        : "bg-[oklch(0.96_0.05_85)]";

  return (
    <li className={`rounded-[1.75rem] px-4 py-3.5 shadow-sm ${tone}`}>
      <div className="flex items-center gap-3">
        {/* Organic blob checkbox */}
        <button
          onClick={onToggleFound}
          aria-label="Mark found"
          className="relative grid h-10 w-10 shrink-0 place-items-center"
        >
          <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
            <path
              d="M20 2 C30 2 38 9 38 20 C38 31 31 38 20 38 C9 38 2 31 2 20 C2 9 10 2 20 2 Z"
              fill={item.status === "found" ? "oklch(0.74 0.14 150)" : "white"}
              stroke="oklch(0.74 0.14 150)"
              strokeWidth="2.5"
            />
          </svg>
          {item.status === "found" && (
            <Check className="relative h-5 w-5 text-white" strokeWidth={3} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold ${
              item.status === "found" ? "text-foreground/60 line-through" : "text-foreground"
            }`}
          >
            {item.item_name}
          </p>
          {item.store_name && (
            <p className="mt-0.5 text-[11px] font-semibold text-foreground/60">
              {item.status === "not_found" ? "Not at " : "@ "}
              {item.store_name}
              {item.distance_km != null && ` · ${item.distance_km} km`}
            </p>
          )}
        </div>

        <button
          onClick={onRemove}
          aria-label="Remove"
          className="grid h-9 w-9 place-items-center rounded-full bg-card/70 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Action row */}
      {item.status !== "found" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.status === "not_found" ? (
            <>
              <Button
                size="sm"
                onClick={onFindElsewhere}
                className="h-8 rounded-full bg-[oklch(0.74_0.14_55)] px-4 text-xs font-bold text-[oklch(0.99_0.01_95)] hover:bg-[oklch(0.7_0.14_55)]"
              >
                Find elsewhere
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRoute}
                className="h-8 rounded-full border-foreground/20 bg-white/60 px-3 text-xs font-bold"
              >
                <Navigation className="mr-1 h-3 w-3" strokeWidth={2.5} /> Route
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkNotFound}
                className="h-8 rounded-full border-foreground/20 bg-white/60 px-3 text-xs font-bold"
              >
                <Trash2 className="mr-1 h-3 w-3" strokeWidth={2.5} /> Not found
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRoute}
                className="h-8 rounded-full border-foreground/20 bg-white/60 px-3 text-xs font-bold"
              >
                <Navigation className="mr-1 h-3 w-3" strokeWidth={2.5} /> Route
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
