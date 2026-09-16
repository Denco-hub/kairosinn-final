import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, LogOut, UserRound, Save } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Kairos Inn" },
      { name: "description", content: "Manage your Kairos Inn profile and account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const BUTTON_PRIMARY =
  "rounded-none uppercase tracking-wider text-xs font-medium bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50 border border-[#af8f52]/40";
const MONO_FIGURE = "font-mono text-xs tracking-wide";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

function getFirstName(fullName: string | null | undefined, fallback = "there") {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || fallback;
}

function AccountPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      navigate({ to: "/auth" });
      return;
    }

    const uid = sess.session.user.id;
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);

    setProfile(p);
    setFullName(p?.full_name ?? "");
    setPhone(p?.phone ?? "");
    setEmail(sess.session.user.email ?? "");

    const roles = r?.map((x) => x.role) ?? [];
    setRole(
      roles.includes("owner")
        ? "owner"
        : roles.includes("manager")
          ? "manager"
          : roles.includes("accountant")
            ? "accountant"
            : roles.includes("receptionist")
              ? "receptionist"
              : roles.includes("staff")
                ? "staff"
                : "guest",
    );
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: profile?.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setProfile((current) =>
      current
        ? { ...current, full_name: fullName.trim(), phone: phone.trim() || null }
        : current,
    );
    toast.success("Profile updated.");
  };

  const handleClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return toast.error("Enter your staff passkey.");
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_staff_passkey", {
      _passkey: passkeyInput.trim(),
    });
    setClaiming(false);
    if (error) return toast.error(error.message);
    toast.success(`Role "${data?.role ?? "?"}" claimed successfully!`);
    setPasskeyInput("");
    void load();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-16 text-stone-500">Loading...</div>
      </SiteLayout>
    );
  }

  const firstName = getFirstName(fullName || profile?.full_name);
  const initials =
    (fullName || profile?.full_name || "Guest")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";

  return (
    <SiteLayout>
      <div className="min-h-[70vh] bg-[#faf8f5] text-stone-800">
        <section className="border-b border-stone-300 bg-stone-100/70">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#af8f52]/40 bg-white font-serif text-2xl tracking-tight text-[#b85a2c]">
                  {initials}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Kairos Inn</p>
                  <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                    Hello {firstName}
                  </h1>
                  <p className="mt-1 text-sm text-stone-600">
                    Manage your personal information and account.
                  </p>
                </div>
              </div>
              {role && (
                <span className="rounded-none border border-[#af8f52]/40 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-[#b85a2c]">
                  {role}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="border border-stone-200 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-4">
                <UserRound className="h-5 w-5 text-[#b85a2c]" />
                <div>
                  <h2 className="font-serif text-xl font-bold tracking-tight text-stone-900">Personal Information</h2>
                  <p className="text-xs text-stone-500">Only you can edit your personal profile.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="full-name" className="mb-1.5 block text-[10px] uppercase tracking-widest text-stone-600">
                    Full name
                  </label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-none border-stone-300 bg-white text-stone-900"
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-[10px] uppercase tracking-widest text-stone-600">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-none border-stone-300 bg-white text-stone-900"
                    placeholder="Phone number"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[10px] uppercase tracking-widest text-stone-600">
                    Email
                  </label>
                  <Input
                    id="email"
                    value={email}
                    readOnly
                    className="rounded-none border-stone-200 bg-stone-50 text-stone-500"
                  />
                  <p className="mt-1 text-xs text-stone-400">Your login email is managed by your account authentication.</p>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500">Role</p>
                    <p className="mt-1 font-medium uppercase tracking-wider text-stone-900">{role || "guest"}</p>
                  </div>
                  <Button type="submit" disabled={saving} className={BUTTON_PRIMARY}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              {role && role !== "guest" && (
                <Link
                  to="/staff"
                  className="block border border-[#b85a2c]/50 bg-white p-6 transition hover:border-[#b85a2c]"
                >
                  <p className="text-[10px] uppercase tracking-widest text-[#b85a2c]">{role} access</p>
                  <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-stone-900">
                    {role === "owner" ? "Owner Dashboard" : role === "manager" ? "Manager Dashboard" : "Staff Dashboard"} →
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {role === "owner"
                      ? "Oversee Kairos Inn operations, staff, finances, rooms, and management activity."
                      : role === "manager"
                        ? "Manage day-to-day operations, bookings, rooms, staff, and transactions."
                        : "Access your assigned Kairos Inn operations."}
                  </p>
                </Link>
              )}

              <div className="border border-stone-200 bg-white p-6">
                <p className="text-[10px] uppercase tracking-widest text-stone-500">Account ID</p>
                <p className={`${MONO_FIGURE} mt-2 break-all text-stone-800`}>
                  KI-{(profile?.id ?? "GUEST").slice(0, 12).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {role === "guest" && (
            <div className="mt-8 border border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#b85a2c]" />
                <h2 className="font-serif text-lg font-bold tracking-tight text-stone-900">Claim a staff passkey</h2>
              </div>
              <p className="mt-2 text-sm text-stone-600">Have a passkey from a manager? Enter it below to claim your staff role.</p>
              <form onSubmit={handleClaim} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="passkey" className="mb-1.5 block text-[10px] uppercase tracking-widest text-stone-600">Staff Passkey</label>
                  <Input
                    id="passkey"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Enter passkey"
                    className={`${MONO_FIGURE} rounded-none border-stone-300 bg-white tracking-widest text-stone-900 placeholder:normal-case`}
                    required
                  />
                </div>
                <Button type="submit" disabled={claiming} className={BUTTON_PRIMARY}>
                  {claiming ? "Claiming..." : "Claim"}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-8">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="rounded-none border-stone-300 bg-transparent text-xs font-medium uppercase tracking-wider text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
