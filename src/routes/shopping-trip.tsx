import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shopping-trip")({
  head: () => ({
    meta: [
      { title: "Start Shopping Trip — HealthyHat" },
      { name: "description", content: "Scan foods in real-time with the HealthyHat camera and AI recognition." },
    ],
  }),
  component: ShoppingTrip,
});

function ShoppingTrip() {
  return (
    <MobileShell title="Shopping Trip">
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="grid h-28 w-28 place-items-center rounded-full bg-secondary text-primary">
          <Camera className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Coming soon</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Point your camera at any food and HealthyHat will identify it, score its
          nutrition, and suggest healthier swaps.
        </p>
        <Button asChild className="mt-8 h-11 rounded-2xl px-6">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </MobileShell>
  );
}
