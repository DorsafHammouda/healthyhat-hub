import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Building2, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HealthyHat" },
      { name: "description", content: "Sign in or create your HealthyHat account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to HealthyHat!");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[oklch(0.93_0.06_150)] via-[oklch(0.96_0.05_85)] to-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[2rem] bg-primary text-primary-foreground shadow-[0_18px_40px_-18px_oklch(0.6_0.15_145_/_0.6)]">
            <Leaf className="h-9 w-9" strokeWidth={2.25} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">HealthyHat</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome to your food buddy 🌱</p>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_18px_40px_-18px_oklch(0.4_0.1_80_/_0.2)]">
          <div className="mb-5 flex rounded-full bg-muted p-1 text-sm font-bold">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-2.5 transition ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 rounded-2xl px-4" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl px-4" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl px-4" />
            </div>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-extrabold">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>

        <Link
          to="/manager/login"
          className="mt-5 flex items-center justify-between rounded-2xl bg-[oklch(0.28_0.04_250)] px-5 py-3.5 text-[oklch(0.95_0.02_240)] shadow-sm transition hover:bg-[oklch(0.32_0.04_250)]"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.62_0.16_240)] text-[oklch(0.99_0.01_240)]">
              <Building2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider opacity-70">For business</span>
              <span className="block text-sm font-extrabold">Store Manager Portal</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
