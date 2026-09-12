import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, LogOut } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Kairos Inn" },
      { name: "description", content: "Manage your Kairos Inn bookings and profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const BUTTON_PRIMARY =
  "rounded-none uppercase tracking-wider text-xs font-medium bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50 border border-[#af8f52]/40";
const MONO_FIGURE = "font-mono text-xs tracking-wide";

function AccountPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null>(null);
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
        <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">Loading...</div>
      </SiteLayout>
    );
  }

  const initials =
    (profile?.full_name ?? "Guest")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";

  const dossierRows = [
    { k: "Member Name", v: profile?.full_name || "Guest" },
    { k: "Contact", v: profile?.phone || "—" },
    { k: "Class", v: role || "guest" },
    { k: "Member No.", v: `KI-${(profile?.id ?? "GUEST").slice(0, 6).toUpperCase()}` },
  ];

  return (
    <SiteLayout>
      <div className="min-h-[70vh] bg-[#faf8f5] text-stone-800">
        <section className="mx-auto max-w-3xl px-4 py-12">
          {/* ── Dossier masthead ── */}
          <div className="flex flex-wrap items-center gap-4 border-b border-stone-300 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-none border border-[#af8f52]/40 bg-stone-100/70 font-serif text-2xl tracking-tight text-[#b85a2c]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
                Member Dossier
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Signed in as{" "}
                <span className="font-medium text-stone-800">{profile?.full_name || "Guest"}</span>
              </p>
            </div>
            {role && (
              <span className="rounded-none border border-[#af8f52]/40 bg-stone-50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#b85a2c]">
                {role}
              </span>
            )}
          </div>

          {/* ── Dossier grid with fine dividers ── */}
          <div className="mt-6 divide-y divide-stone-100 border border-stone-200 bg-white">
            {dossierRows.map((row) => (
              <div
                key={row.k}
                className="grid grid-cols-[110px_1fr] items-center gap-3 px-4 py-3 text-sm sm:grid-cols-[140px_1fr]"
              >
                <span className="text-[10px] uppercase tracking-widest text-stone-600">{row.k}</span>
                <span className={`${row.k === "Member No." ? MONO_FIGURE : ""} font-medium text-stone-900`}>
                  {row.v}
                </span>
              </div>
            ))}
          </div>

          {/* ── Quick actions ── */}
          <h2 className="mt-10 font-serif text-xl tracking-tight text-stone-900">Guest Services</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Link
              to="/rooms"
              className="rounded-none border border-stone-200 bg-white p-6 transition hover:border-[#b85a2c]/50"
            >
              <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">Book a room</h3>
              <p className="mt-1 text-sm text-stone-600">
                Browse available rooms and make a reservation.
              </p>
            </Link>
            <Link
              to="/messages"
              className="rounded-none border border-stone-200 bg-white p-6 transition hover:border-[#b85a2c]/50"
            >
              <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">Chat with reception</h3>
              <p className="mt-1 text-sm text-stone-600">
                Ask questions, request services, or confirm details.
              </p>
            </Link>
            <Link
              to="/reviews"
              className="rounded-none border border-stone-200 bg-white p-6 transition hover:border-[#b85a2c]/50"
            >
              <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">Leave a review</h3>
              <p className="mt-1 text-sm text-stone-600">
                Share your experience after your stay.
              </p>
            </Link>

            {role && role !== "guest" && (
              <Link
                to="/staff"
                className="rounded-none border border-[#b85a2c]/60 bg-white p-6 transition hover:border-[#b85a2c]"
              >
                <h3 className="font-serif text-lg font-bold tracking-tight text-[#b85a2c]">
                  Staff Dashboard →
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  {role === "owner"
                    ? "Manage everything: transactions, staff, managers, room passkeys."
                    : role === "manager"
                      ? "Manage bookings, rooms, transactions, and staff."
                      : role === "accountant"
                        ? "Record transactions and view bookings."
                        : "Manage bookings, messages, and reviews."}
                </p>
              </Link>
            )}
          </div>

          {/* ── Passkey claim ── */}
          {role === "guest" && (
            <div className="mt-10">
              <div className="rounded-none border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#b85a2c]" />
                  <h2 className="font-serif text-lg font-bold tracking-tight text-stone-900">
                    Claim a staff passkey
                  </h2>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  Have a passkey from a manager? Enter it below to claim your staff role.
                </p>
                <form onSubmit={handleClaim} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <label
                      htmlFor="passkey"
                      className="mb-1.5 block text-[10px] uppercase tracking-widest text-stone-600"
                    >
                      Staff Passkey
                    </label>
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
            </div>
          )}

          {/* ── Sign out ── */}
          <div className="mt-10">
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