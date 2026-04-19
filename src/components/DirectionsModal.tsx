import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Footprints, Clock } from "lucide-react";
import type { RankedStore } from "@/lib/mockStoreData";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: RankedStore | null;
};

// Deterministic mock turn-by-turn steps based on store name + distance.
function mockSteps(store: RankedStore): { dir: string; street: string; meters: number }[] {
  const totalMeters = Math.max(120, Math.round(store.distanceKm * 1000));
  const streets = ["Main St", "Oak Ave", "Cedar Ln", "Maple Rd", "Birch Way", "Pine Blvd"];
  const dirs = ["north", "east", "south", "west"];
  let h = 0;
  for (let i = 0; i < store.name.length; i++) h = (h * 31 + store.name.charCodeAt(i)) | 0;
  const seed = Math.abs(h);

  const stepCount = 3 + (seed % 2); // 3 or 4 steps
  const portions = Array.from({ length: stepCount }, (_, i) => 0.15 + ((seed >> (i * 2)) & 7) * 0.05);
  const sum = portions.reduce((a, b) => a + b, 0);

  return portions.map((p, i) => ({
    dir: i === 0 ? `Head ${dirs[seed % 4]}` : ["Turn right onto", "Turn left onto", "Continue onto", "Bear right onto"][(seed >> i) & 3],
    street: streets[(seed + i * 7) % streets.length],
    meters: Math.round((p / sum) * totalMeters),
  }));
}

export function DirectionsModal({ open, onOpenChange, store }: Props) {
  if (!store) return null;
  const steps = mockSteps(store);
  const totalMeters = steps.reduce((s, x) => s + x.meters, 0);
  const minutes = Math.max(2, Math.round((totalMeters / 1000) * 12)); // ~12 min/km

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2rem] border-0 bg-card p-0 shadow-[0_24px_60px_-20px_oklch(0.4_0.1_140_/_0.4)]">
        <div className="rounded-t-[2rem] bg-[oklch(0.93_0.06_150)] px-6 pb-5 pt-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground/60">
              <Navigation className="h-3.5 w-3.5" strokeWidth={2.5} />
              Walking directions
            </div>
            <DialogTitle className="text-2xl font-extrabold leading-tight text-foreground">
              {store.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex gap-4 text-xs font-bold text-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5" strokeWidth={2.5} />
              {(totalMeters / 1000).toFixed(1)} km
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
              ~{minutes} min walk
            </span>
          </div>
        </div>

        <ol className="space-y-3 px-6 py-5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                {i + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-bold text-foreground">
                  {s.dir} {s.street}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">{s.meters} m</p>
              </div>
            </li>
          ))}
          <li className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[oklch(0.74_0.14_55)] text-[oklch(0.99_0.01_95)]">
              <MapPin className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-bold text-foreground">Arrive at {store.name} 🌿</p>
              <p className="text-xs font-semibold text-muted-foreground">You're here!</p>
            </div>
          </li>
        </ol>

        <div className="px-6 pb-6">
          <Button
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-full text-sm font-extrabold"
          >
            Got it, let's go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
