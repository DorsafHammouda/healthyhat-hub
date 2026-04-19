import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingBasket, MessageCircleHeart, MapPin } from "lucide-react";

const TABS = [
  { to: "/" as const, label: "Home", Icon: Home },
  { to: "/grocery-list" as const, label: "List", Icon: ShoppingBasket },
  { to: "/chat" as const, label: "Chat", Icon: MessageCircleHeart },
  { to: "/stores" as const, label: "Stores", Icon: MapPin },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-border bg-card/95 px-2 py-2 shadow-[0_18px_40px_-18px_oklch(0.4_0.1_80_/_0.25)] backdrop-blur">
        {TABS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 transition ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
