import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBasket, BookOpen, ChefHat, MapPin, LogOut, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthyHat — Dashboard" },
      { name: "description", content: "Your healthy shopping companion: lists, AI chat, nearby stores, and more." },
    ],
  }),
  component: Dashboard,
});

type CardDef = {
  to: "/shopping-trip" | "/grocery-list" | "/chat" | "/stores";
  title: string;
  subtitle: string;
  Icon: typeof ShoppingBasket;
  primary?: boolean;
};

const CARDS: CardDef[] = [
  { to: "/shopping-trip", title: "Start Shopping Trip", subtitle: "Scan foods with AI", Icon: ShoppingBasket, primary: true },
  { to: "/grocery-list", title: "Grocery List", subtitle: "Plan your basket", Icon: BookOpen },
  { to: "/chat", title: "HealthyHat AI", subtitle: "Ask about food", Icon: ChefHat },
  { to: "/stores", title: "Nearby Stores", subtitle: "Find groceries near you", Icon: MapPin },
];

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Leaf className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">HealthyHat</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight">Hello, {name} 👋</h1>
            <p className="text-sm text-muted-foreground">What's on the menu today?</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-full"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {CARDS.map(({ to, title, subtitle, Icon, primary }) => (
            <Link
              key={to}
              to={to}
              className={`group flex aspect-square flex-col justify-between rounded-3xl border p-4 shadow-sm transition active:scale-[0.97] ${
                primary
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-2xl ${
                  primary ? "bg-primary-foreground/15" : "bg-secondary"
                }`}
              >
                <Icon className={`h-6 w-6 ${primary ? "" : "text-primary"}`} />
              </div>
              <div>
                <div className="text-base font-semibold leading-tight">{title}</div>
                <div className={`mt-0.5 text-xs ${primary ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                  {subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Eat fresh, shop smart 🌱
        </p>
      </div>
    </div>
  );
}
