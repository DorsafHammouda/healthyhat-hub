import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manager")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/manager" || location.pathname === "/manager/") {
      throw redirect({ to: "/manager/login" });
    }
  },
  component: () => <Outlet />,
});
