import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ROOM_TYPES = ["king_bed", "double", "twin", "large_double"] as const;
type RoomType = (typeof ROOM_TYPES)[number];

const searchSchema = z.object({
  type: z.enum(ROOM_TYPES).optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Book a Room — Kairos Inn, Karangazi" },
      {
        name: "description",
        content:
          "Reserve a room at Kairos Inn in Karangazi, Nyagatare. Pick your dates and confirm in seconds — no account needed.",
      },
    ],
  }),
  component: BookPage,
});

type Room = {
  id: string;
  room_number: string;
  display_name: string;
  room_type: RoomType;
  price_per_night: number;
  group_id: string | null;
};

const ROOM_LABELS: Record<RoomType, string> = {
  king_bed: "King Bed Room",
  double: "Double Room",
  twin: "Twin Bed Room",
  large_double: "Large Double Room",
};

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

function nights(checkIn: string, checkOut: string) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function BookPage() {
  const { type = "king_bed" } = useSearch({ from: "/book" });
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      setGuestEmail(data.session.user.email ?? "");
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", data.session.user.id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (p?.full_name) setGuestName(p.full_name);
          if (p?.phone) setGuestPhone(p.phone);
        });
    });
  }, []);

  useEffect(() => {
    supabase
      .from("rooms")
      .select("id, room_number, display_name, room_type, price_per_night, group_id")
      .eq("active", true)
      .order("room_type")
      .then(({ data }) => {
        if (data) setRooms(data as Room[]);
      });
  }, []);

  useEffect(() => {
    setSelectedRoomId("");
  }, [type]);

  const selectedTypeRooms = useMemo(
    () => rooms.filter((r) => r.room_type === type),
    [rooms, type],
  );

  const selectedTypePrice = selectedTypeRooms.length
    ? Number(selectedTypeRooms[0].price_per_night)
    : null;

  useEffect(() => {
    if (!checkIn || !checkOut || nights(checkIn, checkOut) <= 0) {
      setUnavailableIds(new Set());
      return;
    }
    supabase
      .rpc("get_unavailable_room_ids", { _check_in: checkIn, _check_out: checkOut })
      .then(({ data }) => {
        setUnavailableIds(new Set((data ?? []).map((r: { room_id: string }) => r.room_id)));
      });
  }, [checkIn, checkOut]);

  const n = nights(checkIn, checkOut);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (n <= 0) return toast.error("Check-out must be after check-in.");
    if (!guestName.trim() || !guestPhone.trim()) {
      return toast.error("Please enter your name and phone.");
    }
    if (!selectedRoomId) return toast.error("Please pick an available room.");
    if (unavailableIds.has(selectedRoomId)) {
      return toast.error("That room is no longer available for those dates.");
    }

    setSubmitting(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id ?? null;
      const groupId = crypto.randomUUID();

      const { data: result, error } = await supabase.rpc("create_booking_atomic", {
        _user_id: userId,
        _group_id: groupId,
        _guest_name: guestName.trim(),
        _guest_phone: guestPhone.trim(),
        _guest_email: guestEmail.trim() || null,
        _check_in: checkIn,
        _check_out: checkOut,
        _num_guests: numGuests,
        _notes: notes.trim() || null,
        _room_ids: [selectedRoomId],
      });

      if (error) throw error;

      setSubmitting(false);
      toast.success(
        `Booking request sent! Reception will call you shortly to confirm. Total: RWF ${Number(
          result?.total_price,
        ).toLocaleString()}`,
      );
      navigate({ to: "/" });
    } catch (error) {
      setSubmitting(false);
      return toast.error(error instanceof Error ? error.message : "Could not create booking.");
    }
  };

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Book a {ROOM_LABELS[type]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your dates and an available room. No account is required.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {ROOM_TYPES.map((roomType) => {
              const roomsOfType = rooms.filter((r) => r.room_type === roomType);
              const price = roomsOfType.length ? Number(roomsOfType[0].price_per_night) : null;
              return (
                <Link
                  key={roomType}
                  to="/book"
                  search={{ type: roomType }}
                  className={`rounded-full border px-3 py-1 ${type === roomType ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
                >
                  {ROOM_LABELS[roomType]}{price != null ? ` · RWF ${price.toLocaleString()}` : ""}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2"
        >
          <div>
            <Label htmlFor="ci">Check-in</Label>
            <Input id="ci" type="date" min={today()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="co">Check-out</Label>
            <Input id="co" type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
          </div>

          <div className="md:col-span-2">
            <Label>Choose a room (for {n} night{n === 1 ? "" : "s"})</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {selectedTypeRooms.map((r) => {
                const taken = unavailableIds.has(r.id);
                const active = selectedRoomId === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    disabled={taken}
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                      taken
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                        : active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    <div>{r.room_number}</div>
                    <div className={`mt-1 text-xs ${taken ? "" : active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {taken ? "Booked" : "Available"}
                    </div>
                  </button>
                );
              })}
            </div>
            {!selectedTypeRooms.length && (
              <p className="mt-2 text-sm text-muted-foreground">No rooms in this category are currently active.</p>
            )}
          </div>

          <div className="md:col-span-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">
              {selectedTypeRooms.length} {ROOM_LABELS[type]}{selectedTypeRooms.length === 1 ? "" : "s"}
              {selectedTypePrice != null ? ` · RWF ${selectedTypePrice.toLocaleString()} per night` : ""}
            </p>
            <p className="mt-1 text-muted-foreground">
              Select one available room from this category. Availability is checked for your chosen dates.
            </p>
          </div>

          <div>
            <Label htmlFor="gn">Full name</Label>
            <Input id="gn" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="gp">Phone</Label>
            <Input id="gp" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="ge">Email (optional)</Label>
            <Input id="ge" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ng">Number of guests</Label>
            <Input
              id="ng"
              type="number"
              min={1}
              max={2}
              value={numGuests}
              onChange={(e) => setNumGuests(Math.min(2, Math.max(1, Number(e.target.value))))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="nt">Notes (optional)</Label>
            <Textarea id="nt" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrival time, special requests..." />
          </div>

          <div className="md:col-span-2 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              {n} night{n === 1 ? "" : "s"}
            </p>
            <Button type="submit" size="lg" disabled={submitting || n <= 0 || !selectedRoomId}>
              {submitting ? "Submitting..." : "Request booking"}
            </Button>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
