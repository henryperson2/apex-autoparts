import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useCms";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Login | Apex Auto Parts" },
      {
        name: "description",
        content: "Authorized administrator sign-in for the Apex Auto Parts store control centre.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Login | Apex Auto Parts" },
      { property: "og:description", content: "Authorized administrator access only." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // If an admin session already exists, go straight through.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user) {
        await supabase.rpc("claim_super_admin");
        const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: data.user.id });
        if (isAdmin) {
          navigate({ to: "/admin/dashboard", replace: true });
          return;
        }
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter both your administrator email and password.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Sign-in failed. Try again.");

      // First authorized sign-in claims SUPER_ADMIN; afterwards this is a no-op.
      await supabase.rpc("claim_super_admin");

      const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin", {
        _user_id: data.user.id,
      });
      if (roleError) throw roleError;

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error(
          "This account does not have administrator access. Contact the super admin.",
        );
      }

      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.16_0.004_106)] px-4 py-14">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded bg-brass text-brass-foreground">
            <Wrench className="h-6 w-6" />
          </span>
          <span className="font-display text-3xl leading-none text-steel-foreground">
            {settings["logo_text"] || "ApexParts"}
          </span>
        </div>
        <p className="mt-2 text-center text-sm text-steel-foreground/60">
          {settings["business_name"] || "Apex Auto Parts"}
        </p>

        <div className="mt-8 rounded-md border border-brass/25 bg-card p-6 shadow-xl sm:p-8">
          <p className="label-stencil flex items-center gap-2 text-xs text-brass">
            <ShieldCheck className="h-4 w-4" /> Restricted area
          </p>
          <h1 className="mt-2 text-3xl">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Authorized administrators only. Customer accounts sign in from the storefront.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-brass"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" variant="brass" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-steel-foreground/45">
          The first authorized sign-in becomes the SUPER_ADMIN. Access is enforced by database
          role checks, not by this URL.
        </p>
      </div>
    </div>
  );
}
