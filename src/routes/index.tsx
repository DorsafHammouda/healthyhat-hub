import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { BasketCharacter } from "@/components/illustrations/BasketCharacter";
import { RecipeBookCharacter } from "@/components/illustrations/RecipeBookCharacter";
import { ChefCharacter } from "@/components/illustrations/ChefCharacter";
import { MapPinCharacter } from "@/components/illustrations/MapPinCharacter";
import { LeafBlob } from "@/components/illustrations/LeafBlob";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthyHat — Your food buddy" },
      { name: "description", content: "Your wholesome shopping companion: lists, AI chat, nearby stores, and more." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const name = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "friend";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* decorative blobs */}
      <LeafBlob className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 text-[oklch(0.92_0.07_155)]" />
      <LeafBlob className="pointer-events-none absolute -left-24 top-40 h-56 w-56 rotate-45 text-[oklch(0.93_0.06_75)]" />

      <div className="relative mx-auto w-full max-w-md px-5 pb-32 pt-8">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">HealthyHat</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight">Hello, {name} 🌿</h1>
            <p className="mt-1 text-sm text-muted-foreground">What's on the menu today?</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Sign out"
            className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.25} />
          </Button>
        </header>

        {/* Hero card */}
        <Link
          to="/shopping-trip"
          className="group relative mb-4 flex items-center justify-between overflow-hidden rounded-[2.25rem] bg-primary p-5 text-primary-foreground shadow-[0_20px_40px_-20px_oklch(0.6_0.15_145_/_0.5)] transition active:scale-[0.98]"
        >
          <div className="max-w-[55%]">
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">Today</div>
            <div className="mt-1 text-2xl font-extrabold leading-tight">Start a shopping trip</div>
            <div className="mt-1 text-sm opacity-90">Scan foods with AI</div>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
              Let's go <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </div>
          <BasketCharacter className="-mr-3 h-36 w-36 shrink-0 drop-shadow-md" />
        </Link>

        {/* Stacked friendly cards */}
        <div className="space-y-4">
          <Link
            to="/grocery-list"
            className="relative flex items-center gap-4 rounded-[2rem] bg-[oklch(0.96_0.05_85)] p-4 shadow-sm transition active:scale-[0.98]"
          >
            <RecipeBookCharacter className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <div className="text-lg font-extrabold leading-tight text-foreground">Grocery List</div>
              <div className="text-sm text-muted-foreground">Plan your basket</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" strokeWidth={2.25} />
            {hasNewItems && (
              <span
                aria-label="New items added"
                className="absolute right-3 top-3 h-3 w-3 rounded-full bg-destructive ring-2 ring-background"
              />
            )}
          </Link>

          <Link
            to="/chat"
            className="flex items-center gap-4 rounded-[2rem] bg-[oklch(0.92_0.07_155)] p-4 shadow-sm transition active:scale-[0.98]"
          >
            <ChefCharacter className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <div className="text-lg font-extrabold leading-tight text-foreground">HealthyHat AI</div>
              <div className="text-sm text-muted-foreground">Ask about food</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" strokeWidth={2.25} />
          </Link>

          <Link
            to="/stores"
            className="flex items-center gap-4 rounded-[2rem] bg-[oklch(0.9_0.08_55)] p-4 shadow-sm transition active:scale-[0.98]"
          >
            <MapPinCharacter className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <div className="text-lg font-extrabold leading-tight text-foreground">Nearby Stores</div>
              <div className="text-sm text-foreground/70">Find groceries near you</div>
            </div>
            <ArrowRight className="h-5 w-5 text-foreground/60" strokeWidth={2.25} />
          </Link>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-muted-foreground">
          Eat fresh, shop smart 🌱
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
