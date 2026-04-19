import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export function MobileShell({
  children,
  title,
  back = true,
  right,
  bottomNav = true,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  right?: ReactNode;
  bottomNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md">
        {(title || back) && (
          <header className="sticky top-0 z-10 flex items-center justify-between bg-background/85 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              {back && (
                <Link
                  to="/"
                  aria-label="Back to dashboard"
                  className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-sm transition active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
                </Link>
              )}
              {title && <h1 className="text-lg font-extrabold">{title}</h1>}
            </div>
            <div>{right}</div>
          </header>
        )}
        <main className={`px-4 pt-4 ${bottomNav ? "pb-32" : "pb-10"}`}>{children}</main>
      </div>
      {bottomNav && <BottomNav />}
    </div>
  );
}
