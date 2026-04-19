import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
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

  return (
    <MobileShell title="Nearby Stores">
      {denied && (
        <p className="mb-3 rounded-full bg-accent/40 px-4 py-2 text-xs font-bold text-accent-foreground">
          Location unavailable — showing a demo area 🌍
        </p>
      )}
      <div className="overflow-hidden rounded-[2rem] border border-border shadow-[0_18px_40px_-18px_oklch(0.4_0.1_80_/_0.2)]">
        {mounted && pos ? (
          <Suspense fallback={<div className="grid h-[70vh] place-items-center text-sm text-muted-foreground">Loading map…</div>}>
            <StoresMap pos={pos} />
          </Suspense>
        ) : (
          <div className="grid h-[70vh] place-items-center text-sm text-muted-foreground">Locating you…</div>
        )}
      </div>
    </MobileShell>
  );
}
