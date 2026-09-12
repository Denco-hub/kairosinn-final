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

const searchSchema = z.object({
  type: z.enum(["standard", "family_suite"]).optional(),
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
  room_type: "standard" | "family_suite";
  price_per_night: number;
  group_id: string | null;
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
  const { type = "standard" } = useSearch({ from: "/book" });
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

  // Prefill from existing session if signed in (optional)
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

  // Load rooms (all active — picker and prices derived below, nothing hardcoded)
  useEffect(() => {
    supabase
      .from("rooms")
      .select("id, room_number, display_name, room_type, price_per_night, group_id")
      .eq("active", true)
      .order("room_number")
      .then(({ data }) => {
        if (data) {
          setRooms(data as Room[]);
        }
      });
  }, []);

  // Reset the room picker when switching between Standard / Family Suite
  useEffect(() => {
    setSelectedRoomId("");
  }, [type]);

  const standardRooms = useMemo(() => rooms.filter((r) => r.room_type === "standard"), [rooms]);
  const familyRooms = useMemo(() => rooms.filter((r) => r.room_type === "family_suite"), [rooms]);

  const standardPrice = standardRooms.length
    ? Math.min(...standardRooms.map((r) => Number(r.price_per_night)))
    : null;
  const familyPrice = familyRooms.length
    ? familyRooms.reduce((s, r) => s + Number(r.price_per_night), 0)
    : null;
  const familyNumbers = familyRooms.map((r) => r.room_number).join(" + ");

  // Availability for chosen dates (uses public RPC — no auth needed)
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
  const isFamily = type === "family_suite";
  const familyUnavailable = isFamily && familyRooms.some((r) => unavailableIds.has(r.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (n <= 0) return toast.error("Check-out must be after check-in.");
    if (!guestName.trim() || !guestPhone.trim()) {
      return toast.error("Please enter your name and phone.");
    }

    let roomIds: string[] = [];
    if (isFamily) {
      if (familyRooms.length < 2) return toast.error("Family suite is not available right now.");
      if (familyUnavailable) return toast.error("Family suite is already booked for those dates.");
      roomIds = familyRooms.map((r) => r.id);
    } else {
      if (!selectedRoomId) return toast.error("Please pick a room.");
      if (unavailableIds.has(selectedRoomId)) return toast.error("That room is no longer available for those dates.");
      roomIds = [selectedRoomId];
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
        _room_ids: roomIds,
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
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Book {isFamily ? "the Family Suite" : "a Standard Room"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No account required — just pick your dates and leave your phone number. Reception will confirm.
          </p>
          <div className="mt-3 flex gap-2 text-sm">
            <Link
              to="/book"
              search={{ type: "standard" }}
              className={`rounded-full border px-3 py-1 ${type === "standard" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
            >
              Standard{standardPrice != null ? ` · RWF ${standardPrice.toLocaleString()}` : ""}
            </Link>
            <Link
              to="/book"
              search={{ type: "family_suite" }}
              className={`rounded-full border px-3 py-1 ${isFamily ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
            >
              Family Suite{familyPrice != null ? ` · RWF ${familyPrice.toLocaleString()}` : ""}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2"
        >
          <div>
            <Label htmlFor="ci">Check-in</Label>
            <Input
              id="ci"
              type="date"
              min={today()}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="co">Check-out</Label>
            <Input
              id="co"
              type="date"
              min={checkIn}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          {!isFamily && (
            <div className="md:col-span-2">
              <Label>Choose a room (for {n} night{n === 1 ? "" : "s"})</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {standardRooms.map((r) => {
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
                      <div>Room {r.room_number}</div>
                      <div className={`mt-1 text-xs ${taken ? "" : active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {taken ? "Booked" : "Available"}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!standardRooms.length && (
                <p className="mt-2 text-sm text-muted-foreground">No standard rooms found.</p>
              )}
            </div>
          )}

          {isFamily && (
            <div className="md:col-span-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">Family Suite (rooms {familyNumbers || "—"})</p>
              <p className="mt-1 text-muted-foreground">
                Both connected rooms are reserved together. Two beds, two private bathrooms.
              </p>
              {familyUnavailable && (
                <p className="mt-2 text-sm text-destructive">
                  Sorry — the Family Suite is taken for those dates.
                </p>
              )}
            </div>
          )}

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
              max={isFamily ? 6 : 2}
              value={numGuests}
              onChange={(e) => setNumGuests(Math.max(1, Number(e.target.value)))}
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
            <Button type="submit" size="lg" disabled={submitting || n <= 0}>
              {submitting ? "Submitting..." : "Request booking"}
            </Button>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
