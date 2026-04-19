import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Nearby Stores — HealthyHat" },
      { name: "description", content: "Find grocery stores near your current location on the map." },
    ],
  }),
  component: StoresPage,
});

const StoresMap = lazy(() => import("@/components/StoresMap"));

const DEFAULT: [number, number] = [40.7128, -74.006];

function StoresPage() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [denied, setDenied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!navigator.geolocation) {
      setDenied(true);
      setPos(DEFAULT);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => { setDenied(true); setPos(DEFAULT); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const stores = useMemo(() => {
    if (!pos) return [];
    const [lat, lng] = pos;
    return [
      { name: "Green Garden Market", type: "Organic grocer", lat: lat + 0.004, lng: lng + 0.003 },
      { name: "Fresh & Co.", type: "Supermarket", lat: lat - 0.003, lng: lng + 0.005 },
      { name: "Nature's Basket", type: "Health foods", lat: lat + 0.002, lng: lng - 0.004 },
      { name: "Daily Harvest", type: "Produce shop", lat: lat - 0.005, lng: lng - 0.002 },
    ];
  }, [pos]);

  return (
    <MobileShell title="Nearby Stores">
      {denied && (
        <p className="mb-3 rounded-2xl bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
          Location unavailable — showing a demo area.
        </p>
      )}
      <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
        {mounted && pos ? (
          <Suspense fallback={<div className="grid h-[70vh] place-items-center text-sm text-muted-foreground">Loading map…</div>}>
            <StoresMap pos={pos} stores={stores} />
          </Suspense>
        ) : (
          <div className="grid h-[70vh] place-items-center text-sm text-muted-foreground">Locating you…</div>
        )}
      </div>
    </MobileShell>
  );
}
