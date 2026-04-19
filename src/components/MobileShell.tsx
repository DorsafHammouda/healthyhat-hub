import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function MobileShell({
  children,
  title,
  back = true,
  right,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md">
        {(title || back) && (
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              {back && (
                <Link
                  to="/"
                  aria-label="Back to dashboard"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              {title && <h1 className="text-base font-semibold">{title}</h1>}
            </div>
            <div>{right}</div>
          </header>
        )}
        <main className="px-4 pb-20 pt-4">{children}</main>
      </div>
    </div>
  );
}
