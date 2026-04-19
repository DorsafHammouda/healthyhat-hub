import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/manager")({
  component: () => <Navigate to="/manager/login" />,
});
