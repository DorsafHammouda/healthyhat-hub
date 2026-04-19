
## Problem
`src/routes/manager.tsx` is the parent layout for `/manager/login` and `/manager/$storeName` (TanStack flat dot routing). Currently it renders `<Navigate to="/manager/login" />` instead of an `<Outlet />`, so visiting `/manager/login` re-mounts the parent → redirects again → infinite loop, and the login child never renders.

## Fix (1 file)
Update `src/routes/manager.tsx`:
- Render `<Outlet />` so children (`login`, `$storeName`) display.
- Handle the bare `/manager` index redirect via the route's `beforeLoad` (only fires when the parent matches with no child), redirecting to `/manager/login`.

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manager")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/manager" || location.pathname === "/manager/") {
      throw redirect({ to: "/manager/login" });
    }
  },
  component: () => <Outlet />,
});
```

No other files change.
