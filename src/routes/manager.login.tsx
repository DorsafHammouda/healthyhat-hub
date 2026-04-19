import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/login")({
  head: () => ({
    meta: [
      { title: "Manager Sign in — HealthyHat Business" },
      { name: "description", content: "Sign in to the Store Manager Portal." },
    ],
  }),
  component: ManagerLogin,
});

function ManagerLogin() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = storeName.trim();
    if (!trimmed) {
      toast.error("Please enter a store name");
      return;
    }
    toast.success(`Welcome, ${name || "Manager"} 👋`);
    navigate({ to: "/manager/$storeName", params: { storeName: trimmed } });
  };

  return (
    <div className="manager-theme min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[2rem] bg-primary text-primary-foreground shadow-[0_18px_40px_-18px_oklch(0.4_0.16_240_/_0.6)]">
            <Building2 className="h-9 w-9" strokeWidth={2.25} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">For Business</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Store Manager Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to view your store insights</p>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_18px_40px_-18px_oklch(0.1_0.05_240_/_0.6)]">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 rounded-2xl border-border bg-background px-4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store">Store Name</Label>
              <Input
                id="store"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Whole Foods Market"
                className="h-12 rounded-2xl border-border bg-background px-4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@store.com"
                className="h-12 rounded-2xl border-border bg-background px-4"
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-full text-base font-extrabold">
              Sign in
            </Button>
          </form>
        </div>

        <Link
          to="/auth"
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground transition hover:bg-secondary/80"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Back to Customer App
        </Link>
      </div>
    </div>
  );
}
