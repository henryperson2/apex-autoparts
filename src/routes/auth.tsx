import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Sign in to track your Apex Auto Parts orders, reorder past parts and speed up offline checkout.",
      },
      { property: "og:title", content: "Account Access | Apex Auto Parts" },
      { property: "og:description", content: "Sign in to track and reorder your parts." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/orders" });
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/orders`,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/orders` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <p className="label-stencil text-sm text-brass">Account</p>
      <h1 className="mt-1 text-4xl">{mode === "signin" ? "Sign in" : "Create an account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Track orders and reorder parts fast. Checkout stays offline either way.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-md border border-border bg-card p-6">
        {mode === "signup" && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" variant="brass" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
          Continue with Google
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-brass"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
