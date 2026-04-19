import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "HealthyHat — Smarter, healthier shopping" },
      { name: "description", content: "HealthyHat helps you shop smarter with AI-powered grocery lists, food chat, and nearby store maps." },
      { name: "theme-color", content: "#4CAF50" },
      { property: "og:title", content: "HealthyHat — Smarter, healthier shopping" },
      { property: "og:description", content: "HealthyHat helps you shop smarter with AI-powered grocery lists, food chat, and nearby store maps." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "HealthyHat — Smarter, healthier shopping" },
      { name: "twitter:description", content: "HealthyHat helps you shop smarter with AI-powered grocery lists, food chat, and nearby store maps." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7a711950-7b7d-4198-967a-0d444b8f95ec/id-preview-7a56da1a--dc6328d1-ac3a-42ef-8c8a-cf24de4c2060.lovable.app-1776607818975.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7a711950-7b7d-4198-967a-0d444b8f95ec/id-preview-7a56da1a--dc6328d1-ac3a-42ef-8c8a-cf24de4c2060.lovable.app-1776607818975.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
