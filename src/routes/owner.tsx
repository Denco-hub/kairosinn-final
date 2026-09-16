import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  Clock3,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — Kairos Inn" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerPage,
});

type Booking = {
  id: string;
  status: string;
  total_price: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  created_at: string;
};

type Room = { id: string; active: boolean };

type Transaction = {
  amount: number;
  transaction_type: "payment" | "expense" | "refund";
  created_at: string;
};

type Manager = {
  user_id: string;
  name: string;
  email: string;
};

type Activity = {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string | null;
  description: string | null;
  created_at: string;
};

const money = (value: number) => `RWF ${value.toLocaleString()}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "Owner";

const METRIC_CARDS = [
  ["Net ledger", BarChart3],
  ["Occupied", BedDouble],
  ["Pending", Clock3],
  ["Arrivals", CalendarCheck],
  ["Departures", CalendarCheck],
] as const;

function OwnerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [name, setName] = useState("Owner");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [activityAvailable, setActivityAvailable] = useState(true);

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      navigate({ to: "/auth" });
      return;
    }

    const uid = session.user.id;
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
    ]);

    const isOwner = roleRows?.some((row) => row.role === "owner") ?? false;
    if (!isOwner) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    setName(firstName(profile?.full_name ?? "Owner"));

    const [bookingResult, roomResult, transactionResult, managerResult, activityResult] =
      await Promise.all([
        supabase
          .from("bookings")
          .select("id,status,total_price,check_in,check_out,guest_name,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("rooms").select("id,active").eq("active", true),
        supabase
          .from("transactions")
          .select("amount,transaction_type,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role").eq("role", "manager"),
        supabase
          .from("activity_logs")
          .select("id,actor_user_id,action,entity_type,description,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    setBookings((bookingResult.data ?? []) as Booking[]);
    setRooms((roomResult.data ?? []) as Room[]);
    setTransactions((transactionResult.data ?? []) as Transaction[]);

    const managerRows = managerResult.data ?? [];
    if (managerRows.length) {
      const ids = managerRows.map((row) => row.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Unnamed"]));
      setManagers(
        managerRows.map((row) => ({
          user_id: row.user_id,
          name: profileMap.get(row.user_id) ?? "Unnamed manager",
          email: "Private account",
        })),
      );
    } else {
      setManagers([]);
    }

    if (activityResult.error) {
      setActivityAvailable(false);
      setActivity([]);
    } else {
      setActivityAvailable(true);
      setActivity((activityResult.data ?? []) as Activity[]);
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const revenue = transactions.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      if (item.transaction_type === "payment") return sum + amount;
      if (item.transaction_type === "refund" || item.transaction_type === "expense") return sum - amount;
      return sum;
    }, 0);
    const occupied = bookings.filter((b) => b.status === "checked_in").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const today = new Date().toISOString().slice(0, 10);
    const arrivals = bookings.filter(
      (b) => b.check_in === today && !["cancelled", "checked_in", "checked_out", "completed"].includes(b.status),
    ).length;
    const departures = bookings.filter((b) => b.check_out === today && b.status === "checked_in").length;
    return { revenue, occupied, pending, arrivals, departures };
  }, [bookings, transactions]);

  const metricValues = [
    money(metrics.revenue),
    `${metrics.occupied} / ${rooms.length}`,
    String(metrics.pending),
    String(metrics.arrivals),
    String(metrics.departures),
  ] as const;

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-16 text-stone-500">Loading owner dashboard...</div>
      </SiteLayout>
    );
  }

  if (!allowed) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-stone-400" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-stone-900">Owner access required</h1>
          <p className="mt-2 text-sm text-stone-500">This dashboard is restricted to the Kairos Inn owner account.</p>
          <Link to="/staff" className="mt-6 inline-block">
            <Button className="rounded-none uppercase tracking-wider text-xs">Back to dashboard</Button>
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-[70vh] bg-[#faf8f5] text-stone-800">
        <section className="border-b border-stone-300 bg-stone-100/70">
          <div className="mx-auto max-w-6xl px-4 py-7 sm:py-9">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#b85a2c]">Kairos Inn · Private</p>
                <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Hello {name}</h1>
                <p className="mt-1 text-sm text-stone-500">Owner operations, finances, staffing, and management oversight.</p>
              </div>
              <Link to="/account">
                <Button variant="outline" className="rounded-none border-stone-300 bg-white uppercase tracking-wider text-xs">My Account</Button>
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-7 sm:py-9">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {METRIC_CARDS.map(([label, Icon], index) => (
              <div key={label} className="border border-stone-200 bg-white p-5">
                <Icon className="h-4 w-4 text-[#b85a2c]" />
                <p className="mt-4 text-[10px] uppercase tracking-widest text-stone-500">{label}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-stone-900">{metricValues[index]}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="border border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#b85a2c]">Management</p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">Manager Oversight</h2>
                </div>
                <Users className="h-5 w-5 text-[#b85a2c]" />
              </div>
              <div className="mt-5 space-y-3">
                {managers.length === 0 ? (
                  <p className="text-sm text-stone-500">No manager role is currently assigned.</p>
                ) : (
                  managers.map((manager) => (
                    <div key={manager.user_id} className="flex items-center justify-between gap-4 border border-stone-200 p-4">
                      <div>
                        <p className="font-medium text-stone-900">{manager.name}</p>
                        <p className="mt-1 text-xs text-stone-500">{manager.email}</p>
                      </div>
                      <Badge className="rounded-none border border-[#af8f52]/40 bg-stone-50 text-[#b85a2c]">MANAGER</Badge>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="border border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-4">
                <ShieldCheck className="h-5 w-5 text-[#b85a2c]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#b85a2c]">Access boundary</p>
                  <h2 className="mt-1 font-serif text-xl font-bold text-stone-900">Owner-only controls</h2>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-stone-600">
                <li>• Owner dashboard access is checked against the signed-in user's owner role.</li>
                <li>• Manager accounts do not receive a link to this dashboard.</li>
                <li>• Passkey administration remains owner-only in the staff dashboard.</li>
                <li>• Personal profile changes remain separate from operational permissions.</li>
              </ul>
            </section>
          </div>

          <section className="mt-6 border border-stone-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#b85a2c]">Audit trail</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">Manager Activity</h2>
              </div>
              <Link to="/staff"><Button variant="outline" className="rounded-none border-stone-300 bg-white uppercase tracking-wider text-xs">Operations</Button></Link>
            </div>

            {!activityAvailable ? (
              <div className="mt-5 border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
                <p className="font-medium text-stone-900">Audit logging is not connected yet.</p>
                <p className="mt-1">Run the owner-audit SQL migration in Supabase to record manager actions here.</p>
              </div>
            ) : activity.length === 0 ? (
              <p className="mt-5 text-sm text-stone-500">No recorded management activity yet.</p>
            ) : (
              <div className="mt-5 divide-y divide-stone-100">
                {activity.map((item) => (
                  <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]">
                    <p className="font-mono text-xs text-stone-500">{new Date(item.created_at).toLocaleString()}</p>
                    <div>
                      <p className="font-medium text-stone-900">{item.description || item.action}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">{item.entity_type || "system"} · {item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/staff"><Button className="rounded-none uppercase tracking-wider text-xs">Open Operations</Button></Link>
            <Link to="/account"><Button variant="outline" className="rounded-none border-stone-300 bg-white uppercase tracking-wider text-xs">Edit My Profile</Button></Link>
          </div>
        </main>
      </div>
    </SiteLayout>
  );
}
