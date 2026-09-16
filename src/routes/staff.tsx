import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as RTabs from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";
import roomImage from "@/assets/room.jpg";
import singleRoomImage from "@/assets/single-room.jpg";
import {
  CalendarCheck,
  BedDouble,
  MessageSquare,
  Star,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Loader2,
  LayoutGrid,
  LayoutList,
} from "lucide-react";

/* ─────────────────  Shared boutique styling tokens  ─────────────────
   Kairos Inn staff/account design language: sharp architectural edges,
   brass borders, warm charcoal stone surfaces, serif panel headings and
   tabular monospace figures. */
const BUTTON_PRIMARY = "rounded-none uppercase tracking-wider text-xs font-medium";
const MONO_FIGURE = "font-mono text-xs tracking-wide";
const BRASS_BORDER = "border-stone-200";

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

const LuxTabsPanel = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RTabs.Content>) => (
  <RTabs.Content className={cn("mt-6", className)} {...props} />
);

const PanelTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-4 font-serif text-xl tracking-tight text-stone-900">{children}</h3>
);

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard — Kairos Inn" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffPage,
});

type Booking = {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  status:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "checked_in"
    | "checked_out";
  notes: string | null;
  created_at: string;
};

type Room = {
  id: string;
  room_number: string;
  display_name: string;
  room_type: "king_bed" | "large_double" | "double" | "twin";
  price_per_night: number;
  active: boolean;
  description: string | null;
};

type ReviewRow = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type AppRole =
  | "guest"
  | "staff"
  | "manager"
  | "owner"
  | "accountant"
  | "receptionist";

type RoleRow = {
  user_id: string;
  role: AppRole;
};

type Transaction = {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string;
  booking_id: string | null;
  receipt_number: string | null;
  transaction_type: "payment" | "expense" | "refund";
  recorded_by: string;
  created_at: string;
};

type BookingOption = { id: string; label: string };

type RackStatus = "vacant" | "occupied" | "arriving_today" | "maintenance";

type RackRoom = {
  room_id: string;
  room_number: string;
  display_name: string | null;
  room_type: string | null;
  image_url: string | null;
  status: RackStatus;
  booking_id: string | null;
  guest_name: string | null;
  arrives_at: string | null;
  departs_at: string | null;
};

const RACK_STYLES: Record<
  RackStatus,
  { border: string; ribbon: string; label: string }
> = {
  vacant: {
    border: "border-emerald-300 bg-emerald-50/50",
    ribbon: "bg-emerald-500 text-white",
    label: "Vacant / Clean",
  },
  occupied: {
    border: "border-blue-300 bg-blue-50/50",
    ribbon: "bg-blue-500 text-white",
    label: "Occupied",
  },
  arriving_today: {
    border: "border-[#b85a2c]/40 bg-[#b85a2c]/10",
    ribbon: "bg-[#b85a2c] text-white",
    label: "Arriving Today",
  },
  maintenance: {
    border: "border-stone-300 bg-stone-100",
    ribbon: "bg-stone-500 text-white",
    label: "Out of Order",
  },
};

const RACK_LEGEND = [
  { c: "border-emerald-500 bg-emerald-500", label: "Vacant" },
  { c: "border-blue-500 bg-blue-500", label: "Occupied" },
  { c: "border-[#b85a2c] bg-[#b85a2c]", label: "Expected Arrival" },
  { c: "border-stone-500 bg-stone-500", label: "Out of Order" },
] as const;

/* Actual Kairos Inn room-image mapping:
   - King Bed Room → room.jpg
   - Large Double Room → room.jpg
   - Double Room → single-room.jpg
   - Twin Bed Room → single-room.jpg
*/
const rackImageFallback = (roomType: string | null) =>
  roomType === "double" || roomType === "twin"
    ? singleRoomImage
    : roomImage;

type PasskeyRow = { role: AppRole; passkey: string };

type NewRoomForm = {
  room_number: string;
  display_name: string;
  price_per_night: string;
  room_type: "king_bed" | "large_double" | "double" | "twin";
  description: string;
};

function StaffPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const isOwner = roles.includes("owner");
  const isManager = roles.includes("manager");
  const isAccountant = roles.includes("accountant");
  const isOwnerOrManager = isOwner || isManager;
  const canSeeTransactions = isOwnerOrManager || isAccountant;
  const canManageStaff = isOwnerOrManager;

  const primaryRole: AppRole = isOwner
    ? "owner"
    : isManager
      ? "manager"
      : isAccountant
        ? "accountant"
        : roles.includes("receptionist")
          ? "receptionist"
          : "staff";

  const isPrimaryAccountant = primaryRole === "accountant";

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();

      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }

      const uid = sess.session.user.id;

      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);

      const list = (r?.map((x) => x.role) ?? []) as AppRole[];

      const allowed: AppRole[] = [
        "staff",
        "manager",
        "owner",
        "accountant",
        "receptionist",
      ];

      if (!list.some((x) => allowed.includes(x))) {
        setDenied(true);
        setReady(true);
        return;
      }

      setRoles(list);
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16 text-stone-500">
          Loading...
        </div>
      </SiteLayout>
    );
  }

  if (denied) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Staff access required
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Ask a manager for a staff passkey, then claim it from your account
            to unlock the staff dashboard.
          </p>
          <Link to="/account" className="mt-6 inline-block">
            <Button className={BUTTON_PRIMARY}>
              Claim a staff passkey
            </Button>
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-[70vh] bg-[#faf8f5] text-stone-800">
        <section className="border-b border-stone-300 bg-stone-100/70">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
                  Staff Dashboard
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                  Manage bookings, rooms, messages, and reviews.
                </p>
              </div>

              <Badge className="rounded-none border border-[#af8f52]/40 bg-stone-50 uppercase tracking-wider text-[#b85a2c]">
                {primaryRole}
              </Badge>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
          <RTabs.Root defaultValue="bookings">
            <div className="border-b border-stone-200">
              <div className="overflow-x-auto">
                <LuxTabsList className="min-w-max sm:w-full">
                  {isPrimaryAccountant ? (
                    <>
                      <LuxTabsTrigger value="transactions">
                        💰 Transactions & Ledger
                      </LuxTabsTrigger>

                      <LuxTabsTrigger value="bookings">
                        <CalendarCheck className="mr-1.5 h-4 w-4" />
                        Bookings
                      </LuxTabsTrigger>
                    </>
                  ) : (
                    <>
                      <LuxTabsTrigger value="bookings">
                        <CalendarCheck className="mr-1.5 h-4 w-4" />
                        Bookings
                      </LuxTabsTrigger>

                      {isOwnerOrManager && (
                        <LuxTabsTrigger value="rooms">
                          <BedDouble className="mr-1.5 h-4 w-4" />
                          Rooms
                        </LuxTabsTrigger>
                      )}

                      <LuxTabsTrigger value="messages">
                        <MessageSquare className="mr-1.5 h-4 w-4" />
                        Messages
                      </LuxTabsTrigger>

                      <LuxTabsTrigger value="reviews">
                        <Star className="mr-1.5 h-4 w-4" />
                        Reviews
                      </LuxTabsTrigger>

                      {canSeeTransactions && (
                        <LuxTabsTrigger value="transactions">
                          💰 Transactions & Ledger
                        </LuxTabsTrigger>
                      )}

                      {canManageStaff && (
                        <LuxTabsTrigger value="staff">
                          <Users className="mr-1.5 h-4 w-4" />
                          Staff
                        </LuxTabsTrigger>
                      )}

                      {isOwner && (
                        <LuxTabsTrigger value="passkeys">
                          🔑 Passkeys
                        </LuxTabsTrigger>
                      )}
                    </>
                  )}
                </LuxTabsList>
              </div>
            </div>

            <LuxTabsPanel value="bookings">
              <BookingsPanel />
            </LuxTabsPanel>

            {isOwnerOrManager && (
              <LuxTabsPanel value="rooms">
                <RoomsPanel canEdit={isOwner || isManager} />
              </LuxTabsPanel>
            )}

            {!isPrimaryAccountant && (
              <>
                <LuxTabsPanel value="messages">
                  <MessagesPanel />
                </LuxTabsPanel>

                <LuxTabsPanel value="reviews">
                  <ReviewsPanel />
                </LuxTabsPanel>
              </>
            )}

            {canSeeTransactions && (
              <LuxTabsPanel value="transactions">
                <TransactionsPanel
                  canEdit={isOwner || isManager || isAccountant}
                />
              </LuxTabsPanel>
            )}

            {canManageStaff && (
              <LuxTabsPanel value="staff">
                <StaffPanel isOwner={isOwner} />
              </LuxTabsPanel>
            )}

            {isOwner && (
              <LuxTabsPanel value="passkeys">
                <PasskeysPanel />
              </LuxTabsPanel>
            )}
          </RTabs.Root>
        </section>
      </div>
    </SiteLayout>
  );
}

/* ─────────────────  Bookings  ───────────────── */

const today = () => new Date().toISOString().slice(0, 10);

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

type BookingFilter =
  | "all"
  | "arrivals"
  | "in_house"
  | "departures"
  | "pending";

const FILTER_LABELS: Record<BookingFilter, string> = {
  all: "All",
  arrivals: "Today's Arrivals",
  in_house: "In-House",
  departures: "Today's Departures",
  pending: "Pending",
};

function BookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"list" | "rack">("list");
  const [rack, setRack] = useState<RackRoom[]>([]);
  const [rackLoading, setRackLoading] = useState(false);

  const [showWalkIn, setShowWalkIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [checkInDate, setCheckInDate] = useState(today());
  const [checkOutDate, setCheckOutDate] = useState(tomorrow());
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(
    new Set(),
  );
  const [amount, setAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [autoCheckIn, setAutoCheckIn] = useState(true);

  const load = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadRack = async () => {
    setRackLoading(true);

    const [{ data: rackRows }, { data: roomMeta }] = await Promise.all([
      supabase.rpc("get_room_rack_status", {}),
      supabase.from("rooms").select("id, image_url, room_type"),
    ]);

    const meta: Record<
      string,
      { image_url: string | null; room_type: string | null }
    > = {};

    (roomMeta ?? []).forEach((m) => {
      meta[m.id] = {
        image_url: m.image_url,
        room_type: m.room_type,
      };
    });

    setRack(
      ((rackRows as RackRoom[] | null) ?? []).map((r) => ({
        ...r,
        image_url: meta[r.room_id]?.image_url ?? null,
        room_type: meta[r.room_id]?.room_type ?? r.room_type,
      })),
    );

    setRackLoading(false);
  };

  useEffect(() => {
    if (view === "rack") loadRack();
  }, [view]);

  useEffect(() => {
    supabase
      .from("rooms")
      .select("id, room_number, display_name, room_type, price_per_night, active, description")
      .eq("active", true)
      .order("room_number")
      .then(({ data }) => {
        if (data) setActiveRooms(data as Room[]);
      });
  }, []);

  const update = async (
    id: string,
    status: Booking["status"],
  ) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) return toast.error(error.message);

    toast.success(`Booking ${status}.`);
    load();
  };

  const checkIn = async (bookingId: string) => {
    const { error } = await supabase.rpc("check_in_guest", {
      _booking_id: bookingId,
    });

    if (error) return toast.error(error.message);

    toast.success("Guest checked in.");
    load();

    if (view === "rack") loadRack();
  };

  const checkOut = async (bookingId: string) => {
    const { error } = await supabase.rpc("check_out_guest", {
      _booking_id: bookingId,
    });

    if (error) return toast.error(error.message);

    toast.success("Guest checked out.");
    load();

    if (view === "rack") loadRack();
  };

  const list = useMemo(() => {
    const todayDate = today();

    return bookings.filter((b) => {
      switch (filter) {
        case "pending":
          return b.status === "pending";

        case "in_house":
          return b.status === "checked_in";

        case "arrivals":
          return (
            b.check_in === todayDate &&
            b.status !== "checked_in" &&
            b.status !== "cancelled"
          );

        case "departures":
          return b.check_out === todayDate && b.status === "checked_in";

        default:
          return true;
      }
    });
  }, [bookings, filter]);

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);

      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }

      return next;
    });
  };

  const openWalkInWithRoom = (roomId: string) => {
    setSelectedRoomIds(new Set(roomId ? [roomId] : []));
    setShowWalkIn(true);
  };

  const resetWalkInForm = () => {
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setNotes("");
    setCheckInDate(today());
    setCheckOutDate(tomorrow());
    setSelectedRoomIds(new Set());
    setAmount("0");
    setPaymentMethod("cash");
    setAutoCheckIn(true);
  };

  const submitWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !guestPhone.trim()) {
      return toast.error("Please enter guest name and phone.");
    }

    if (selectedRoomIds.size === 0) {
      return toast.error("Please select at least one room.");
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.rpc("create_walkin_booking", {
        _guest_name: guestName.trim(),
        _guest_phone: guestPhone.trim(),
        _guest_email: guestEmail.trim() || null,
        _notes: notes.trim() || null,
        _check_in: checkInDate,
        _check_out: checkOutDate,
        _room_ids: Array.from(selectedRoomIds),
        _amount: Number(amount),
        _payment_method: paymentMethod,
        _auto_check_in: autoCheckIn,
      });

      if (error) throw error;

      toast.success("Walk-in booking created.");
      setShowWalkIn(false);
      resetWalkInForm();
      load();

      if (view === "rack") loadRack();
    } catch (error) {
      return toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create walk-in booking.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const badgeFor = (b: Booking) => {
    switch (b.status) {
      case "confirmed":
        return {
          variant: "default" as const,
          label: "Confirmed",
        };

      case "checked_in":
        return {
          variant: "default" as const,
          label: "In House",
        };

      case "checked_out":
        return {
          variant: "secondary" as const,
          label: "Checked Out",
        };

      case "completed":
        return {
          variant: "secondary" as const,
          label: "Completed",
        };

      case "cancelled":
        return {
          variant: "destructive" as const,
          label: "Cancelled",
        };

      default:
        return {
          variant: "secondary" as const,
          label: "Pending",
        };
    }
  };

  return (
    <div>
      <PanelTitle>Guest Bookings</PanelTitle>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-2 divide-x divide-stone-200 border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm transition-colors ${
              view === "list"
                ? "bg-[#b85a2c] text-white"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            List View
          </button>

          <button
            type="button"
            onClick={() => setView("rack")}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm transition-colors ${
              view === "rack"
                ? "bg-[#b85a2c] text-white"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Room Rack
          </button>
        </div>

        <Button
          size="sm"
          className={BUTTON_PRIMARY}
          onClick={() => setShowWalkIn(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Walk-In
        </Button>
      </div>

      {view === "rack" ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-600">
            {RACK_LEGEND.map((x) => (
              <span
                key={x.label}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-[2px] border ${x.c}`}
                />
                {x.label}
              </span>
            ))}
          </div>

          {rackLoading && rack.length === 0 ? (
            <p className="text-stone-600">Loading rooms...</p>
          ) : rack.length === 0 ? (
            <p className="text-stone-600">No rooms on the rack.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {rack.map((r) => {
                const styles = RACK_STYLES[r.status];
                const fallbackImage = rackImageFallback(r.room_type);

                return (
                  <div
                    key={r.room_id}
                    className={`relative flex flex-col overflow-hidden rounded-none border ${styles.border} bg-white shadow-sm`}
                  >
                    <ImageWithSkeleton
                      src={r.image_url || fallbackImage}
                      alt={r.display_name || `Room ${r.room_number}`}
                      fallbackSrc={fallbackImage}
                      className="h-24 w-full"
                      objectFit="cover"
                    />

                    <span
                      className={`absolute left-0 top-3 z-20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles.ribbon}`}
                    >
                      {styles.label}
                    </span>

                    <div className="flex flex-1 flex-col gap-2 border-t border-stone-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-900">
                          {r.display_name || `Room ${r.room_number}`}
                        </span>

                        <span
                          className={`shrink-0 ${MONO_FIGURE} text-[#b85a2c]`}
                        >
                          № {r.room_number}
                        </span>
                      </div>

                      {r.status === "occupied" && r.guest_name && (
                        <div className="text-xs">
                          <div className="font-medium text-stone-800">
                            {r.guest_name}
                          </div>

                          <div className={`${MONO_FIGURE} text-stone-600`}>
                            Departs {r.departs_at}
                          </div>
                        </div>
                      )}

                      {r.status === "arriving_today" && r.guest_name && (
                        <div className="text-xs font-medium text-stone-800">
                          {r.guest_name}
                        </div>
                      )}

                      {r.status === "maintenance" && (
                        <div className="text-xs text-stone-600">
                          {r.room_type
                            ? `Type: ${r.room_type}`
                            : "Not available"}
                        </div>
                      )}

                      <div className="mt-auto pt-1">
                        {r.status === "occupied" && r.booking_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`w-full ${BUTTON_PRIMARY} border-stone-300 bg-transparent text-stone-700`}
                            onClick={() => checkOut(r.booking_id!)}
                          >
                            Check Out
                          </Button>
                        )}

                        {(r.status === "vacant" ||
                          r.status === "arriving_today") && (
                          <button
                            type="button"
                            onClick={() => openWalkInWithRoom(r.room_id)}
                            className="w-full rounded-none border border-stone-300 bg-stone-50 py-1.5 text-xs uppercase tracking-wider text-stone-700 transition-colors hover:border-[#b85a2c] hover:text-[#b85a2c]"
                          >
                            Book Walk-In
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200 pb-0">
            {(
              [
                "all",
                "arrivals",
                "in_house",
                "departures",
                "pending",
              ] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 border-b-2 px-3 py-1.5 text-sm transition-colors ${
                  filter === f
                    ? "border-[#b85a2c] bg-white/70 text-[#b85a2c]"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-stone-600">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-stone-600">No bookings.</p>
          ) : (
            <div className="space-y-3">
              {list.map((b) => {
                const badge = badgeFor(b);

                return (
                  <article
                    key={b.id}
                    className="rounded-none border border-stone-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-stone-900">
                            {b.guest_name}
                          </span>

                          <Badge
                            variant={badge.variant}
                            className="rounded-none text-[10px] uppercase tracking-wider"
                          >
                            {badge.label}
                          </Badge>
                        </div>

                        <div
                          className={`mt-1 ${MONO_FIGURE} text-stone-600`}
                        >
                          {b.check_in} → {b.check_out} · {b.num_guests} guest(s)
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                          <a
                            href={`tel:${b.guest_phone}`}
                            className="text-[#b85a2c] hover:underline"
                          >
                            {b.guest_phone}
                          </a>

                          {b.guest_email && (
                            <span className="break-all text-stone-600">
                              {b.guest_email}
                            </span>
                          )}
                        </div>

                        {b.notes && (
                          <p className="mt-2 text-sm text-stone-700">
                            📝 {b.notes}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`${MONO_FIGURE} text-[#b85a2c]`}
                        >
                          RWF {Number(b.total_price).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className={`flex-1 sm:flex-none ${BUTTON_PRIMARY}`}
                            onClick={() =>
                              update(b.id, "confirmed")
                            }
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Confirm
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className={`flex-1 sm:flex-none ${BUTTON_PRIMARY} border-stone-300 bg-transparent text-stone-700`}
                            onClick={() =>
                              update(b.id, "cancelled")
                            }
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Decline
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className={`flex-1 sm:flex-none ${BUTTON_PRIMARY}`}
                            onClick={() =>
                              update(b.id, "cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      {b.status === "confirmed" && (
                        <>
                          <Button
                            size="sm"
                            className={`flex-1 sm:flex-none ${BUTTON_PRIMARY}`}
                            onClick={() => checkIn(b.id)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Check In
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className={`flex-1 sm:flex-none ${BUTTON_PRIMARY} border-stone-300 bg-transparent text-stone-700`}
                            onClick={() =>
                              update(b.id, "cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      {b.status === "checked_in" && (
                        <Button
                          size="sm"
                          className={`flex-1 sm:flex-none ${BUTTON_PRIMARY}`}
                          onClick={() => checkOut(b.id)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Check Out
                        </Button>
                      )}

                      {(b.status === "checked_out" ||
                        b.status === "completed" ||
                        b.status === "cancelled") && (
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[10px] uppercase tracking-wider"
                        >
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={showWalkIn} onOpenChange={setShowWalkIn}>
        <DialogContent className="rounded-none border-stone-200 bg-white text-stone-800 sm:rounded-none! sm:max-w-lg">
          <DialogHeader className="border-b border-stone-300 pb-3">
            <DialogTitle className="font-serif text-xl tracking-tight text-stone-900">
              New Walk-In Booking
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submitWalkIn} className="space-y-4">
            <fieldset className="rounded-none border border-stone-200 p-3">
              <legend className="px-1 text-[10px] uppercase tracking-widest text-[#b85a2c]">
                Guest Details
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-stone-600">
                    Guest Name
                  </Label>

                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-stone-600">
                    Phone
                  </Label>

                  <Input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs uppercase tracking-wider text-stone-600">
                  Email (optional)
                </Label>

                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
                />
              </div>
            </fieldset>

            <fieldset className="rounded-none border border-stone-200 p-3">
              <legend className="px-1 text-[10px] uppercase tracking-widest text-[#b85a2c]">
                Stay Dates
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-stone-600">
                    Check-in
                  </Label>

                  <Input
                    type="date"
                    min={today()}
                    value={checkInDate}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
                      setAutoCheckIn(e.target.value === today());
                    }}
                    required
                    className="rounded-none border-stone-300 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-stone-600">
                    Check-out
                  </Label>

                  <Input
                    type="date"
                    min={checkInDate}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    required
                    className="rounded-none border-stone-300 bg-white text-stone-900"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs uppercase tracking-wider text-stone-600">
                  Notes (optional)
                </Label>

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
                />
              </div>
            </fieldset>

            <fieldset className="rounded-none border border-stone-200 p-3">
              <legend className="px-1 text-[10px] uppercase tracking-widest text-[#b85a2c]">
                Rooms
              </legend>

              <div className="max-h-44 space-y-1 overflow-y-auto border border-stone-100 bg-stone-50 p-2">
                {activeRooms.length === 0 && (
                  <p className="text-xs text-stone-600">
                    No active rooms available.
                  </p>
                )}

                {activeRooms.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 px-1 py-1 text-sm text-stone-700"
                  >
                    <Checkbox
                      checked={selectedRoomIds.has(r.id)}
                      onCheckedChange={() => toggleRoom(r.id)}
                    />

                    {r.display_name}

                    <span
                      className={`${MONO_FIGURE} text-[#b85a2c]`}
                    >
                      · Room {r.room_number}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-none border border-stone-200 p-3">
              <legend className="px-1 text-[10px] uppercase tracking-widest text-[#b85a2c]">
                Payment
              </legend>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-stone-600">
                    Amount (RWF)
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-none border-stone-300 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-stone-600">
                    Method
                  </Label>

                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                    className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">
                      Bank Transfer
                    </option>
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <Checkbox
                      checked={autoCheckIn}
                      onCheckedChange={() =>
                        setAutoCheckIn((prev) => !prev)
                      }
                    />
                    Auto Check-In
                  </label>
                </div>
              </div>
            </fieldset>

            <Button
              type="submit"
              disabled={submitting}
              className={`w-full ${BUTTON_PRIMARY} bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50`}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Walk-In"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────  Rooms  ───────────────── */

function RoomsPanel({ canEdit }: { canEdit: boolean }) {
  const [rooms, setRooms] = useState<Room[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newRoom, setNewRoom] = useState<NewRoomForm>({
    room_number: "",
    display_name: "",
    price_per_night: "",
    room_type: "double",
    description: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    setRooms((data as Room[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = async (
    id: string,
    patch: Partial<Room>,
  ) => {
    const { error } = await supabase
      .from("rooms")
      .update(patch)
      .eq("id", id);

    if (error) return toast.error(error.message);

    toast.success("Saved");
    load();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newRoom.display_name ||
      !newRoom.room_number ||
      !newRoom.price_per_night
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("room-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("room-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("rooms")
        .insert({
          room_number: newRoom.room_number,
          display_name: newRoom.display_name,
          price_per_night: parseInt(newRoom.price_per_night),
          room_type: newRoom.room_type,
          description: newRoom.description || null,
          image_url: imageUrl,
          active: true,
        });

      if (insertError) throw insertError;

      toast.success("Room created successfully!");

      setNewRoom({
        room_number: "",
        display_name: "",
        price_per_night: "",
        room_type: "double",
        description: "",
      });

      setImageFile(null);
      setShowAddForm(false);
      load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong creating the room.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PanelTitle>Room Inventory Rack</PanelTitle>

      {canEdit && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 ${BUTTON_PRIMARY}`}
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? "Cancel Add Room" : "Add New Room"}
          </Button>
        </div>
      )}

      {canEdit && showAddForm && (
        <article className="mx-auto max-w-xl rounded-none border border-stone-200 bg-white p-6 text-stone-800 shadow-sm">
          <h3 className="mb-4 font-serif text-lg tracking-tight text-stone-900">
            Add New Room
          </h3>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="display_name"
                  className="text-xs uppercase tracking-wider text-stone-600"
                >
                  Room Title / Display Name
                </Label>

                <Input
                  id="display_name"
                  type="text"
                  placeholder="e.g., King Bed Room"
                  value={newRoom.display_name}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      display_name: e.target.value,
                    })
                  }
                  required
                  className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="room_number"
                  className="text-xs uppercase tracking-wider text-stone-600"
                >
                  Room Number / Identifier
                </Label>

                <Input
                  id="room_number"
                  type="text"
                  placeholder="e.g., KING"
                  value={newRoom.room_number}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      room_number: e.target.value,
                    })
                  }
                  required
                  className={`${MONO_FIGURE} rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="price_per_night"
                  className="text-xs uppercase tracking-wider text-stone-600"
                >
                  Price (RWF) / Night
                </Label>

                <Input
                  id="price_per_night"
                  type="number"
                  placeholder="e.g., 20000"
                  value={newRoom.price_per_night}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      price_per_night: e.target.value,
                    })
                  }
                  required
                  className={`${MONO_FIGURE} rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600`}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="room_type"
                  className="text-xs uppercase tracking-wider text-stone-600"
                >
                  Room Type Block
                </Label>

                <select
                  id="room_type"
                  value={newRoom.room_type}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      room_type:
                        e.target.value as NewRoomForm["room_type"],
                    })
                  }
                  className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                >
                  <option value="king_bed">King Bed Room</option>
                  <option value="large_double">
                    Large Double Room
                  </option>
                  <option value="double">Double Room</option>
                  <option value="twin">Twin Bed Room</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs uppercase tracking-wider text-stone-600"
              >
                Description
              </Label>

              <Textarea
                id="description"
                placeholder="Describe the room finishes, provisions, bed types..."
                value={newRoom.description}
                onChange={(e) =>
                  setNewRoom({
                    ...newRoom,
                    description: e.target.value,
                  })
                }
                className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="image_file"
                className="text-xs uppercase tracking-wider text-stone-600"
              >
                Room Image File (Optional)
              </Label>

              <Input
                id="image_file"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImageFile(
                    e.target.files ? e.target.files[0] : null,
                  )
                }
                className="cursor-pointer rounded-none border-stone-300 bg-white text-stone-700 file:rounded-none file:border-0 file:bg-[#af8f52]/15 file:text-[#b85a2c]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full ${BUTTON_PRIMARY} bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Room...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </form>
        </article>
      )}

      <div className="space-y-3">
        {rooms.map((r) => (
          <article
            key={r.id}
            className="rounded-none border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-stone-900">
                  {r.display_name}
                </div>

                <div className={`${MONO_FIGURE} text-stone-600`}>
                  Room {r.room_number} ·{" "}
                  {r.room_type === "king_bed"
                    ? "King Bed Room"
                    : r.room_type === "large_double"
                      ? "Large Double Room"
                      : r.room_type === "double"
                        ? "Double Room"
                        : "Twin Bed Room"}{" "}
                  · RWF{" "}
                  {Number(r.price_per_night).toLocaleString()}
                  /night
                </div>
              </div>

              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={r.active ? "outline" : "default"}
                    className={`flex-1 sm:flex-none ${BUTTON_PRIMARY} ${
                      r.active
                        ? "border-stone-300 bg-transparent text-stone-700"
                        : ""
                    }`}
                    onClick={() =>
                      updateField(r.id, {
                        active: !r.active,
                      })
                    }
                  >
                    {r.active
                      ? "Mark out of service"
                      : "Reactivate"}
                  </Button>

                  <Input
                    type="number"
                    defaultValue={r.price_per_night}
                    onBlur={(e) => {
                      const n = Number(e.target.value);

                      if (
                        n &&
                        n !== r.price_per_night
                      ) {
                        updateField(r.id, {
                          price_per_night: n,
                        });
                      }
                    }}
                    className={`${MONO_FIGURE} w-28 rounded-none border-stone-300 bg-white text-stone-900 sm:w-32`}
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────  Messages (staff side)  ───────────────── */

type MsgRow = {
  id: string;
  body: string;
  sender_id: string | null;
  conversation_user_id: string | null;
  guest_session_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string;
};

type Conversation = {
  key: string;
  isGuest: boolean;
  name: string;
  phone: string | null;
  last: string;
  at: string;
};

function MessagesPanel() {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [active, setActive] = useState<Conversation | null>(
    null,
  );

  const [thread, setThread] = useState<MsgRow[]>([]);
  const [body, setBody] = useState("");
  const [me, setMe] = useState<string>("");
  const [mobileView, setMobileView] = useState<
    "list" | "thread"
  >("list");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) =>
        setMe(data.session?.user.id ?? ""),
      );
  }, []);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("messages")
      .select(
        "conversation_user_id, guest_session_id, guest_name, guest_phone, body, created_at",
      )
      .order("created_at", { ascending: false });

    if (!data) return;

    const seen = new Set<string>();
    const list: Conversation[] = [];
    const userIds: string[] = [];

    for (const m of data) {
      const isGuest =
        !m.conversation_user_id &&
        !!m.guest_session_id;

      const key = isGuest
        ? (m.guest_session_id as string)
        : (m.conversation_user_id as string | null);

      if (!key) continue;
      if (seen.has(key)) continue;

      seen.add(key);

      if (!isGuest) userIds.push(key);

      list.push({
        key,
        isGuest,
        name:
          m.guest_name ||
          (isGuest ? "Guest" : "Member"),
        phone: m.guest_phone ?? null,
        last: m.body,
        at: m.created_at,
      });
    }

    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);

      const map = new Map<string, Profile>();

      profs?.forEach((p) =>
        map.set(p.id, p as Profile),
      );

      for (const c of list) {
        if (!c.isGuest) {
          const p = map.get(c.key);

          if (p) {
            c.name = p.full_name || "Member";
            c.phone = p.phone ?? c.phone;
          }
        }
      }
    }

    setConversations(list);
  };

  const loadThread = async (c: Conversation) => {
    const q = supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    const { data } = c.isGuest
      ? await q.eq("guest_session_id", c.key)
      : await q.eq("conversation_user_id", c.key);

    setThread((data as MsgRow[]) ?? []);
  };

  useEffect(() => {
    loadConversations();

    const ch = supabase
      .channel("staff-msgs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          loadConversations();

          if (active) loadThread(active);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key]);

  const openConv = (c: Conversation) => {
    setActive(c);
    loadThread(c);
    setMobileView("thread");
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!active || !body.trim()) return;

    const payload: TablesInsert<"messages"> =
      active.isGuest
        ? {
            body: body.trim(),
            sender_id: me,
            guest_session_id: active.key,
            guest_name: active.name,
            guest_phone: active.phone,
          }
        : {
            body: body.trim(),
            sender_id: me,
            conversation_user_id: active.key,
          };

    const { error } = await supabase
      .from("messages")
      .insert(payload);

    if (error) return toast.error(error.message);

    setBody("");
    loadThread(active);
  };

  return (
    <>
      <PanelTitle>Guest Correspondence</PanelTitle>

      <div className="md:hidden">
        {mobileView === "list" ? (
          <div className="rounded-none border border-stone-200 bg-white p-1">
            {conversations.length === 0 && (
              <p className="p-2 text-sm text-stone-600">
                No conversations yet.
              </p>
            )}

            {conversations.map((c) => (
              <button
                key={c.key}
                onClick={() => openConv(c)}
                className={`block w-full rounded-none border-b border-stone-100 p-3 text-left text-sm transition last:border-0 ${
                  active?.key === c.key
                    ? "bg-stone-50"
                    : "hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-stone-900">
                    {c.name}
                  </span>

                  {c.isGuest && (
                    <Badge
                      variant="secondary"
                      className="rounded-none text-[10px] uppercase tracking-wider"
                    >
                      Guest
                    </Badge>
                  )}
                </div>

                {c.phone && (
                  <div
                    className={`${MONO_FIGURE} text-[#b85a2c]`}
                  >
                    {c.phone}
                  </div>
                )}

                <div className="truncate text-xs text-stone-600">
                  {c.last}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[70vh] flex-col rounded-none border border-stone-300 bg-white">
            <div className="flex items-center gap-3 border-b border-stone-200 p-3">
              <button
                onClick={() => setMobileView("list")}
                className="text-sm text-[#b85a2c] hover:underline"
              >
                ← Back
              </button>

              <span className="text-sm font-semibold text-stone-900">
                {active?.name}
              </span>

              {active?.phone && (
                <a
                  href={`tel:${active.phone}`}
                  className={`ml-auto ${MONO_FIGURE} text-[#b85a2c] hover:underline`}
                >
                  {active.phone}
                </a>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {thread.map((m) => {
                const mine =
                  !!m.sender_id && m.sender_id === me;

                return (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-none border px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto border-[#b85a2c]/60 bg-[#b85a2c] text-[#f5ead6]"
                        : "border-stone-200 bg-stone-50 text-stone-800"
                    }`}
                  >
                    {m.body}
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={send}
              className="flex gap-2 border-t border-stone-200 p-3"
            >
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
              />

              <Button
                type="submit"
                size="sm"
                className={BUTTON_PRIMARY}
              >
                Send
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-[280px_1fr] md:gap-4">
        <aside className="rounded-none border border-stone-200 bg-white p-1">
          {conversations.length === 0 && (
            <p className="p-2 text-sm text-stone-600">
              No conversations yet.
            </p>
          )}

          {conversations.map((c) => (
            <button
              key={c.key}
              onClick={() => openConv(c)}
              className={`block w-full rounded-none border-b border-stone-100 p-2 text-left text-sm transition last:border-0 ${
                active?.key === c.key
                  ? "bg-stone-50"
                  : "hover:bg-stone-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-stone-900">
                  {c.name}
                </span>

                {c.isGuest && (
                  <Badge
                    variant="secondary"
                    className="rounded-none text-[10px] uppercase tracking-wider"
                  >
                    Guest
                  </Badge>
                )}
              </div>

              {c.phone && (
                <div
                  className={`${MONO_FIGURE} text-[#b85a2c]`}
                >
                  {c.phone}
                </div>
              )}

              <div className="truncate text-xs text-stone-600">
                {c.last}
              </div>
            </button>
          ))}
        </aside>

        <div className="flex h-[60vh] flex-col rounded-none border border-stone-300 bg-white">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-stone-600">
              Pick a conversation to view messages.
            </div>
          ) : (
            <>
              <div className="border-b border-stone-200 p-3 text-sm">
                <span className="font-semibold text-stone-900">
                  {active.name}
                </span>

                {active.phone && (
                  <a
                    href={`tel:${active.phone}`}
                    className={`ml-2 ${MONO_FIGURE} text-[#b85a2c] hover:underline`}
                  >
                    {active.phone}
                  </a>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => {
                  const mine =
                    !!m.sender_id && m.sender_id === me;

                  return (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-none border px-3 py-2 text-sm ${
                        mine
                          ? "ml-auto border-[#b85a2c]/60 bg-[#b85a2c] text-[#f5ead6]"
                          : "border-stone-200 bg-stone-50 text-stone-800"
                      }`}
                    >
                      {m.body}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={send}
                className="flex gap-2 border-t border-stone-200 p-3"
              >
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
                />

                <Button
                  type="submit"
                  className={BUTTON_PRIMARY}
                >
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────  Reviews moderation  ───────────────── */

function ReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    setReviews((data as ReviewRow[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const setApproved = async (
    id: string,
    approved: boolean,
  ) => {
    const { error } = await supabase
      .from("reviews")
      .update({ approved })
      .eq("id", id);

    if (error) return toast.error(error.message);

    toast.success(approved ? "Approved" : "Hidden");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) return toast.error(error.message);

    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-3">
      <PanelTitle>Guest Praise Book</PanelTitle>

      {reviews.length === 0 && (
        <p className="text-stone-600">No reviews yet.</p>
      )}

      {reviews.map((r) => (
        <article
          key={r.id}
          className="rounded-none border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-stone-900">
                  {r.guest_name}
                </span>

                <span className="text-sm text-[#d4a64f]">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>

                <Badge
                  variant={
                    r.approved ? "default" : "secondary"
                  }
                  className="rounded-none text-[10px] uppercase tracking-wider"
                >
                  {r.approved ? "Approved" : "Hidden"}
                </Badge>
              </div>

              {r.comment && (
                <p className="mt-2 text-sm text-stone-700">
                  {r.comment}
                </p>
              )}

              <p
                className={`mt-1 ${MONO_FIGURE} text-stone-600`}
              >
                {new Date(
                  r.created_at,
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={
                r.approved ? "outline" : "default"
              }
              className={`flex-1 sm:flex-none ${BUTTON_PRIMARY} ${
                r.approved
                  ? "border-stone-300 bg-transparent text-stone-700"
                  : ""
              }`}
              onClick={() =>
                setApproved(r.id, !r.approved)
              }
            >
              {r.approved ? "Hide" : "Approve"}
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className={`flex-1 sm:flex-none ${BUTTON_PRIMARY}`}
              onClick={() => remove(r.id)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ─────────────────  Transactions  ───────────────── */

function TransactionsPanel({
  canEdit,
}: {
  canEdit: boolean;
}) {
  const [transactions, setTransactions] = useState<
    Transaction[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<
    "all" | "payment" | "expense"
  >("all");

  const [entryType, setEntryType] = useState<
    "payment" | "expense"
  >("payment");

  const [recentBookings, setRecentBookings] = useState<
    BookingOption[]
  >([]);

  const [recordedBy, setRecordedBy] = useState<
    Record<string, string>
  >({});

  const [form, setForm] = useState({
    amount: "",
    payment_date: "",
    payment_method: "cash",
    description: "",
    booking_id: "",
    category: "Other",
  });

  const load = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("payment_date", { ascending: false });

    const rows = (data as Transaction[]) ?? [];

    setTransactions(rows);

    const uids = [
      ...new Set(rows.map((t) => t.recorded_by)),
    ];

    if (uids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uids);

      const map: Record<string, string> = {};

      profs?.forEach((p) => {
        if (p.full_name) {
          map[p.id] = p.full_name;
        }
      });

      setRecordedBy(map);
    } else {
      setRecordedBy({});
    }

    setLoading(false);
  };

  useEffect(() => {
    load();

    (async () => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, guest_name, status")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!bookings?.length) return;

      const roomMap: Record<string, string> = {};

      const { data: links } = await supabase
        .from("booking_rooms")
        .select("booking_id, rooms(room_number)")
        .in(
          "booking_id",
          bookings.map((b) => b.id),
        );

      links?.forEach((l) => {
        const rn = l.rooms?.room_number;

        if (rn) {
          roomMap[l.booking_id] = roomMap[l.booking_id]
            ? `${roomMap[l.booking_id]}, ${rn}`
            : rn;
        }
      });

      setRecentBookings(
        bookings.map((b) => ({
          id: b.id,
          label: `${b.guest_name}${
            roomMap[b.id]
              ? ` — Room ${roomMap[b.id]}`
              : ""
          } (${b.status})`,
        })),
      );
    })();
  }, []);

  const switchEntryType = (
    t: "payment" | "expense",
  ) => {
    setEntryType(t);

    setForm((f) =>
      t === "expense"
        ? {
            ...f,
            booking_id: "",
            description: "",
          }
        : {
            ...f,
            category: "Other",
          },
    );
  };

  const selectBooking = (bookingId: string) => {
    setForm((f) => ({
      ...f,
      booking_id: bookingId,
      description: bookingId
        ? `Payment for ${
            recentBookings.find(
              (b) => b.id === bookingId,
            )?.label ?? "guest"
          }`
        : f.description,
    }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const { data: sess } =
      await supabase.auth.getSession();

    const uid = sess.session?.user.id;

    if (!uid) {
      return toast.error(
        "You must be signed in to record a transaction.",
      );
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      return toast.error("Enter a valid amount.");
    }

    if (!form.payment_date) {
      return toast.error("Pick a date.");
    }

    const isExpense = entryType === "expense";

    if (
      isExpense &&
      !form.description.trim()
    ) {
      return toast.error(
        "Description is required for expenses.",
      );
    }

    const { error } = await supabase
      .from("transactions")
      .insert({
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        transaction_type: isExpense
          ? "expense"
          : "payment",
        description: isExpense
          ? `${form.category}${
              form.description
                ? ` — ${form.description}`
                : ""
            }`
          : form.description ||
            "Payment received",
        booking_id: isExpense
          ? null
          : form.booking_id || null,
        recorded_by: uid,
      });

    if (error) return toast.error(error.message);

    toast.success(
      isExpense
        ? "Expense recorded."
        : "Payment recorded.",
    );

    setForm({
      amount: "",
      payment_date: "",
      payment_method: "cash",
      description: "",
      booking_id: "",
      category: "Other",
    });

    load();
  };

  const todayStr = new Date()
    .toISOString()
    .slice(0, 10);

  const todayRows = transactions.filter(
    (t) =>
      t.payment_date === todayStr &&
      t.transaction_type === "payment",
  );

  const totalRevenue = todayRows.reduce(
    (s, t) => s + Number(t.amount),
    0,
  );

  const cashIntake = todayRows
    .filter((t) => t.payment_method === "cash")
    .reduce((s, t) => s + Number(t.amount), 0);

  const mobileIntake = todayRows
    .filter(
      (t) => t.payment_method === "mobile_money",
    )
    .reduce((s, t) => s + Number(t.amount), 0);

  const filtered = transactions.filter((t) =>
    filter === "all"
      ? true
      : filter === "payment"
        ? t.transaction_type === "payment" ||
          t.transaction_type === "refund"
        : t.transaction_type === "expense",
  );

  const typeInfo = (
    tt: Transaction["transaction_type"],
  ) =>
    tt === "expense"
      ? {
          label: "Expense",
          cls: "rounded-none bg-amber-50 text-amber-800 border-amber-300",
        }
      : tt === "refund"
        ? {
            label: "Refund",
            cls: "rounded-none bg-stone-100 text-stone-600 border-stone-300",
          }
        : {
            label: "Payment",
            cls: "rounded-none bg-emerald-50 text-emerald-800 border-emerald-300",
          };

  return (
    <div className="space-y-6">
      <PanelTitle>Daily Financial Ledger</PanelTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-none border border-stone-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-stone-600">
            Today's Total Revenue
          </div>

          <div className="mt-1 font-mono text-2xl text-[#b85a2c]">
            RWF {totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="rounded-none border border-stone-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-stone-600">
            Cash Intake
          </div>

          <div className="mt-1 font-mono text-2xl text-[#8fae6e]">
            RWF {cashIntake.toLocaleString()}
          </div>
        </div>

        <div className="rounded-none border border-stone-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-stone-600">
            Mobile Money Intake
          </div>

          <div className="mt-1 font-mono text-2xl text-[#8fae6e]">
            RWF {mobileIntake.toLocaleString()}
          </div>
        </div>
      </div>

      {canEdit && (
        <form
          onSubmit={submit}
          className="rounded-none border border-stone-200 bg-white p-4 text-stone-800"
        >
          <h3 className="mb-3 font-serif text-lg tracking-tight text-stone-900">
            Record Transaction
          </h3>

          <div className="mb-3 grid grid-cols-2 gap-0 border border-stone-200">
            <button
              type="button"
              onClick={() =>
                switchEntryType("payment")
              }
              className={`rounded-none px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                entryType === "payment"
                  ? "bg-[#b85a2c] text-white"
                  : "bg-white text-stone-500 hover:text-stone-900"
              }`}
            >
              Payment Received (Revenue)
            </button>

            <button
              type="button"
              onClick={() =>
                switchEntryType("expense")
              }
              className={`rounded-none px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                entryType === "expense"
                  ? "bg-[#b85a2c] text-white"
                  : "bg-white text-stone-500 hover:text-stone-900"
              }`}
            >
              Operational Expense (Cost)
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-stone-600">
                Amount (RWF)
              </Label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                required
                className={`${MONO_FIGURE} rounded-none border-stone-300 bg-white text-stone-900`}
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-stone-600">
                Date
              </Label>

              <Input
                type="date"
                value={form.payment_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_date: e.target.value,
                  })
                }
                required
                className={`${MONO_FIGURE} rounded-none border-stone-300 bg-white text-stone-900`}
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-stone-600">
                Method
              </Label>

              <select
                value={form.payment_method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_method: e.target.value,
                  })
                }
                className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="cash">Cash</option>
                <option value="mobile_money">
                  Mobile Money
                </option>
                <option value="card">Card</option>
                <option value="bank_transfer">
                  Bank Transfer
                </option>
              </select>
            </div>

            {entryType === "payment" ? (
              <div>
                <Label className="text-xs uppercase tracking-wider text-stone-600">
                  Booking (optional)
                </Label>

                <select
                  value={form.booking_id}
                  onChange={(e) =>
                    selectBooking(e.target.value)
                  }
                  className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                >
                  <option value="">
                    — Guest booking —
                  </option>

                  {recentBookings.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                    >
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Label className="text-xs uppercase tracking-wider text-stone-600">
                  Category
                </Label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                >
                  <option>Cleaning Supplies</option>
                  <option>Kitchen Gas</option>
                  <option>Laundry</option>
                  <option>Other</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-stone-600">
                {entryType === "expense"
                  ? "Description (required)"
                  : "Description"}
              </Label>

              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder={
                  entryType === "expense"
                    ? "e.g. cleaning supplies restock, kitchen gas refill…"
                    : "What was this payment for?"
                }
                required={entryType === "expense"}
                className="rounded-none border-stone-300 bg-white text-stone-900 placeholder:text-stone-600"
              />
            </div>
          </div>

          <Button
            type="submit"
            className={`mt-4 w-full sm:w-auto ${BUTTON_PRIMARY} bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50`}
          >
            Save{" "}
            {entryType === "expense"
              ? "Expense"
              : "Payment"}
          </Button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-0 border border-stone-200 bg-white">
        {(["all", "payment", "expense"] as const).map(
          (f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-none px-3 py-2 text-xs uppercase tracking-wider transition-colors first:border-r last:border-l ${
                filter === f
                  ? "border-stone-200 bg-stone-50 text-[#b85a2c]"
                  : "border-stone-200 text-stone-500 hover:text-stone-900"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "payment"
                  ? "Payments Only"
                  : "Expenses Only"}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <p className="text-stone-600">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-stone-600">
          No transactions found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-none border border-stone-200">
          <table className="w-full min-w-[720px] border-collapse bg-white text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100/70 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                <th className="px-3 py-2 font-medium">
                  Receipt #
                </th>
                <th className="px-3 py-2 font-medium">
                  Date
                </th>
                <th className="px-3 py-2 font-medium">
                  Type
                </th>
                <th className="px-3 py-2 font-medium">
                  Method
                </th>
                <th className="px-3 py-2 font-medium">
                  Description / Booking Info
                </th>
                <th className="px-3 py-2 font-medium">
                  Recorded By
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((t) => {
                const info = typeInfo(
                  t.transaction_type,
                );

                return (
                  <tr
                    key={t.id}
                    className="border-b border-stone-100 text-stone-700 last:border-0"
                  >
                    <td
                      className={`${MONO_FIGURE} px-3 py-2 text-[#b85a2c]`}
                    >
                      {t.receipt_number || "—"}
                    </td>

                    <td
                      className={`${MONO_FIGURE} px-3 py-2`}
                    >
                      {t.payment_date}
                    </td>

                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={info.cls}
                      >
                        {info.label}
                      </Badge>
                    </td>

                    <td className="px-3 py-2 text-xs uppercase tracking-wider">
                      {t.payment_method.replace(
                        "_",
                        " ",
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <div>{t.description}</div>

                      {t.booking_id && (
                        <div
                          className={`mt-0.5 ${MONO_FIGURE} text-stone-600`}
                        >
                          Booking ref:{" "}
                          {t.booking_id.slice(0, 8)}
                        </div>
                      )}
                    </td>

                    <td
                      className={`${MONO_FIGURE} px-3 py-2`}
                    >
                      {recordedBy[t.recorded_by] ||
                        `…${t.recorded_by.slice(-6)}`}
                    </td>

                    <td
                      className={`${MONO_FIGURE} px-3 py-2 text-right font-semibold ${
                        t.transaction_type ===
                        "expense"
                          ? "text-[#b85a2c]"
                          : "text-emerald-700"
                      }`}
                    >
                      {t.transaction_type ===
                      "expense"
                        ? "−"
                        : ""}
                      RWF{" "}
                      {Number(
                        t.amount,
                      ).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────  Staff management  ───────────────── */

function StaffPanel({
  isOwner,
}: {
  isOwner: boolean;
}) {
  const [users, setUsers] = useState<
    { profile: Profile; roles: AppRole[] }[]
  >([]);

  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (!roleRows) {
      setLoading(false);
      return;
    }

    const uids = [
      ...new Set(roleRows.map((r) => r.user_id)),
    ];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", uids);

    const map = new Map<
      string,
      { profile: Profile; roles: AppRole[] }
    >();

    profiles?.forEach((p) =>
      map.set(p.id, {
        profile: p as Profile,
        roles: [],
      }),
    );

    roleRows.forEach((r) => {
      const entry = map.get(r.user_id);

      if (entry) {
        entry.roles.push(r.role as AppRole);
      }
    });

    setUsers([...map.values()]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const removeRole = async (
    userId: string,
    role: AppRole,
  ) => {
    if (
      !confirm(
        `Remove role "${role}" from this user?`,
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) return toast.error(error.message);

    toast.success("Role removed.");
    load();
  };

  return (
    <div className="space-y-3">
      <PanelTitle>Staff & Roles</PanelTitle>

      {loading && (
        <p className="text-stone-600">
          Loading...
        </p>
      )}

      {users.map(({ profile, roles }) => (
        <article
          key={profile.id}
          className="rounded-none border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-stone-900">
                {profile.full_name || "Unnamed"}
              </div>

              {profile.phone && (
                <div
                  className={`${MONO_FIGURE} text-stone-600`}
                >
                  {profile.phone}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <div
                  key={role}
                  className="flex items-center gap-1"
                >
                  <Badge
                    variant="secondary"
                    className="rounded-none text-[10px] uppercase tracking-wider capitalize"
                  >
                    {role}
                  </Badge>

                  {isOwner && (
                    <button
                      onClick={() =>
                        removeRole(
                          profile.id,
                          role,
                        )
                      }
                      className="text-[#e05252] hover:opacity-70"
                      title={`Remove ${role}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ─────────────────  Passkeys  ───────────────── */

function PasskeysPanel() {
  const [passkeys, setPasskeys] = useState<
    PasskeyRow[]
  >([]);

  const [form, setForm] = useState<{
    role: AppRole;
    passkey: string;
  }>({
    role: "staff",
    passkey: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("role_passkeys")
      .select("role, passkey");

    setPasskeys((data as PasskeyRow[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("role_passkeys")
      .upsert(
        {
          role: form.role,
          passkey: form.passkey,
        },
        { onConflict: "role" },
      );

    if (error) return toast.error(error.message);

    toast.success("Passkey saved.");
    load();
  };

  return (
    <div className="space-y-6">
      <PanelTitle>Role Passkeys</PanelTitle>

      <form
        onSubmit={save}
        className="rounded-none border border-stone-200 bg-white p-4 text-stone-800"
      >
        <h3 className="mb-3 font-serif text-lg tracking-tight text-stone-900">
          Set Role Passkey
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-stone-600">
              Role
            </Label>

            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as AppRole,
                })
              }
              className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            >
              {(
                [
                  "staff",
                  "receptionist",
                  "accountant",
                  "manager",
                ] as AppRole[]
              ).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-stone-600">
              Passkey
            </Label>

            <Input
              type="password"
              value={form.passkey}
              onChange={(e) =>
                setForm({
                  ...form,
                  passkey: e.target.value,
                })
              }
              required
              className={`${MONO_FIGURE} rounded-none border-stone-300 bg-white text-stone-900`}
            />
          </div>
        </div>

        <Button
          type="submit"
          className={`mt-4 w-full sm:w-auto ${BUTTON_PRIMARY} bg-gradient-to-r from-[#b85a2c] to-[#af8f52] text-stone-50`}
        >
          Save Passkey
        </Button>
      </form>

      <div className="space-y-2">
        {passkeys.map((p) => (
          <div
            key={p.role}
            className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-stone-200 bg-white px-4 py-3"
          >
            <Badge className="rounded-none border border-[#af8f52]/40 bg-stone-50 text-[10px] uppercase tracking-wider text-[#b85a2c]">
              {p.role}
            </Badge>

            <span
              className={`${MONO_FIGURE} tracking-widest text-stone-500`}
            >
              ••••••••
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
