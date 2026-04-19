import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { BasketCharacter } from "@/components/illustrations/BasketCharacter";

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
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="grid h-56 w-56 place-items-center rounded-full bg-[oklch(0.93_0.06_150)] shadow-[0_18px_40px_-18px_oklch(0.6_0.15_145_/_0.4)]">
          <BasketCharacter className="h-44 w-44" />
        </div>
        <h2 className="mt-8 text-2xl font-extrabold">Coming soon 🌱</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Point your camera at any food and HealthyHat will identify it, score its
          nutrition, and suggest healthier swaps.
        </p>
        <Button asChild className="mt-8 h-12 rounded-full px-8 font-extrabold">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </MobileShell>
  );
}
