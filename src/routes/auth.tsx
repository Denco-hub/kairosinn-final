import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import * as RTabs from "@radix-ui/react-tabs";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — Kairos Inn" },
      {
        name: "description",
        content: "Sign in to manage your bookings at Kairos Inn, or create a new account.",
      },
    ],
  }),
  component: AuthPage,
});

const BUTTON_PRIMARY = "rounded-none uppercase tracking-wider text-xs font-medium";

const LuxTabsList = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RTabs.List>) => (
  <RTabs.List
    className={cn(
      "flex h-auto w-full items-stretch rounded-none",
      className,
    )}
    {...props}
  />
);

const LuxTabsTrigger = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RTabs.Trigger>) => (
  <RTabs.Trigger
    className={cn(
      "rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs uppercase tracking-wider text-stone-600 transition-colors hover:text-stone-900 sm:text-sm data-[state=active]:border-[#b85a2c] data-[state=active]:bg-white/70 data-[state=active]:font-semibold data-[state=active]:text-[#b85a2c]",
      className,
    )}
    {...props}
  />
);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/account" });
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const passkey = String(fd.get("passkey") ?? "").trim();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: String(fd.get("full_name")),
          phone: String(fd.get("phone")),
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (passkey) {
      const { data: granted, error: pkErr } = await supabase.rpc("claim_staff_passkey", {
        _passkey: passkey,
      });
      if (pkErr) toast.error(`Passkey: ${pkErr.message}`);
      else if (granted?.role) toast.success(`Role "${granted.role}" claimed successfully!`);
    } else {
      toast.success("Account created! You're now signed in.");
    }
    setLoading(false);
    navigate({ to: "/account" });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-none border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 font-serif text-2xl font-bold tracking-tight text-stone-900">
            Welcome
          </h1>
          <p className="mb-6 text-sm text-stone-600">
            Sign in or create an account to book and manage your stay.
          </p>

          {/* ── Tab strip ── */}
          <RTabs.Root defaultValue="signin">
            <div className="border-b border-stone-200">
            <LuxTabsList className="grid w-full grid-cols-2">
              <LuxTabsTrigger value="signin">Sign in</LuxTabsTrigger>
              <LuxTabsTrigger value="signup">Create account</LuxTabsTrigger>
            </LuxTabsList>
          </div>

          <RTabs.Content value="signin" className="mt-6">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <Label htmlFor="si-email">Email</Label>
                <Input
                  id="si-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-none border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div>
                <Label htmlFor="si-pw">Password</Label>
                <Input
                  id="si-pw"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="rounded-none border-stone-300 bg-white text-stone-900"
                />
              </div>
              <Button type="submit" className={`w-full ${BUTTON_PRIMARY} bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50`} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </RTabs.Content>
          <RTabs.Content value="signup" className="mt-6">
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div>
                <Label htmlFor="su-name">Full name</Label>
                <Input id="su-name" name="full_name" required className="rounded-none border-stone-300 bg-white text-stone-900" />
              </div>
              <div>
                <Label htmlFor="su-phone">Phone</Label>
                <Input id="su-phone" name="phone" type="tel" required placeholder="+250 ..." className="rounded-none border-stone-300 bg-white text-stone-900" />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" name="email" type="email" required autoComplete="email" className="rounded-none border-stone-300 bg-white text-stone-900" />
              </div>
              <div>
                <Label htmlFor="su-pw">Password</Label>
                <Input
                  id="su-pw"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="rounded-none border-stone-300 bg-white text-stone-900"
                />
                <p className="mt-1 text-xs text-stone-600">At least 8 characters.</p>
              </div>
              <div>
                <Label htmlFor="su-passkey">Staff passkey (optional)</Label>
                <Input id="su-passkey" name="passkey" placeholder="Leave blank if you're a guest" className="rounded-none border-stone-300 bg-white text-stone-900" />
                <p className="mt-1 text-xs text-stone-600">
                  Only enter this if a manager gave you a passkey.
                </p>
              </div>
              <Button type="submit" className={`w-full ${BUTTON_PRIMARY} bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50`} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </RTabs.Content>
          </RTabs.Root>
        </div>
      </section>
    </SiteLayout>
  );
}