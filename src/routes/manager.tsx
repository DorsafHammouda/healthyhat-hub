import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MOCK_STORES } from "@/lib/mockStoreData";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Store Manager Portal — HealthyHat" },
      { name: "description", content: "Business insights dashboard for store managers." },
    ],
  }),
  component: ManagerIndex,
});

function ManagerIndex() {
  const first = MOCK_STORES[0].name;
  return <Navigate to="/manager/$storeName" params={{ storeName: first }} />;
}
