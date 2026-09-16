import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, Bath, BedDouble, Fan, Coffee, Briefcase } from "lucide-react";
import roomStandard from "@/assets/room-standard.jpg";
import roomFamily from "@/assets/room-family.jpg";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms & Rates — Kairos Inn, Karangazi" },
      {
        name: "description",
        content:
          "Browse our rooms and rates at Kairos Inn, Karangazi. WiFi, breakfast, private bath included in every room.",
      },
      { property: "og:title", content: "Rooms & Rates — Kairos Inn" },
      {
        property: "og:description",
        content: "Browse our rooms and book your stay in Karangazi, Rwanda.",
      },
    ],
  }),
  component: RoomsPage,
});

type RoomType = "king_bed" | "double" | "twin" | "large_double";

type PublicRoom = {
  id: string;
  room_number: string;
  display_name: string;
  room_type: RoomType;
  price_per_night: number;
  description: string | null;
  image_url: string | null;
  available_count: number;
};

const FALLBACK_BODY =
  "A thoughtfully provisioned room at Kairos Inn, Karangazi — natural cooling, private bath, and a fresh breakfast served daily.";

const ROOM_TYPE_ORDER: RoomType[] = ["king_bed", "double", "twin", "large_double"];

const fallbackImages: Record<RoomType, string> = {
  king_bed: roomFamily,
  double: roomStandard,
  twin: roomStandard,
  large_double: roomFamily,
};

function RoomsPage() {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("rooms")
      .select("id, room_number, room_type, display_name, description, price_per_night, image_url, active, available_count")
      .eq("active", true)
      .order("room_type")
      .then(({ data }) => {
        setRooms((data as PublicRoom[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const roomTypes = useMemo(
    () =>
      ROOM_TYPE_ORDER.map((type) => rooms.find((room) => room.room_type === type)).filter(
        (room): room is PublicRoom => Boolean(room),
      ),
    [rooms],
  );

  const amenities = [Wifi, Fan, Bath, BedDouble, Briefcase, Coffee];
  const amenityLabels = ["WiFi", "Cooling Fan", "Private Bath", "Plush Bed", "Work Desk", "Breakfast"];

  return (
    <SiteLayout>
      <div className="bg-[#fbf9f4] text-[#2c2520] min-h-screen">
        <section className="bg-[#faf6ee] border-b border-[#af8f52]/20">
          <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between text-center md:text-left">
            <div>
              <span className="text-xs font-bold tracking-[0.3em] text-[#af8f52] block mb-2">ACCOMMODATIONS</span>
              <h1 className="font-serif text-4xl font-normal tracking-wide text-[#2c2520] md:text-5xl">
                Our Rooms & Rates
              </h1>
              <div className="w-16 h-[1px] bg-[#af8f52] my-4 mx-auto md:mx-0" />
              <p className="max-w-2xl font-serif italic text-sm text-muted-foreground leading-relaxed">
                Four room categories and 13 rooms in total, each provisioned with modern essentials, regional comfort, and a fresh morning breakfast.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          {loading ? (
            <p className="font-serif text-sm italic text-muted-foreground">Loading rooms...</p>
          ) : roomTypes.length === 0 ? (
            <p className="font-serif text-sm italic text-muted-foreground">
              No rooms available right now — please call reception.
            </p>
          ) : (
            <div className="grid gap-12 md:grid-cols-2">
              {roomTypes.map((r) => (
                <article
                  key={r.id}
                  className="overflow-hidden rounded-none border border-[#af8f52]/20 bg-[#fbf9f4] transition-all duration-300 hover:border-[#af8f52] hover:shadow-md flex flex-col"
                >
                  <div className="relative overflow-hidden group">
                    <ImageWithSkeleton
                      src={r.image_url || fallbackImages[r.room_type]}
                      alt={r.display_name}
                      fallbackSrc={fallbackImages[r.room_type]}
                      className="h-72 w-full transition-transform duration-700 group-hover:scale-105 filter brightness-[0.95]"
                    />
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 right-4 bg-[#2c2520] border border-[#af8f52] px-4 py-2 text-center shadow-md">
                      <span className="font-serif text-sm font-semibold text-[#e0cfb3] tracking-wider block">
                        RWF {Number(r.price_per_night).toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-[#fbf9f4]/60 block mt-0.5">
                        per night
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-[#2c2520] mb-3">
                        {r.display_name}
                      </h2>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#af8f52] block mb-3 uppercase">
                        {Number(r.available_count) || 0} room{Number(r.available_count) === 1 ? "" : "s"} in this category
                      </p>
                      <p className="font-serif text-sm italic text-muted-foreground leading-relaxed mb-6">
                        {r.description || FALLBACK_BODY}
                      </p>

                      <div className="border-t border-b border-[#af8f52]/10 py-4 my-6">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#af8f52] block mb-3 uppercase">Suite Provisions:</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                          {amenities.map((Icon, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-[#2c2520]/80">
                              <Icon className="h-4 w-4 text-[#af8f52]/80 shrink-0" />
                              <span className="font-serif text-xs font-medium tracking-wide">
                                {amenityLabels[i]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link to="/book" search={{ type: r.room_type }}>
                        <Button className="w-full bg-gradient-to-b from-[#c5a86a] to-[#af8f52] text-[#fbf9f4] font-serif tracking-widest rounded-none py-6 border border-[#af8f52] hover:brightness-110 transition-all shadow-sm">
                          ARRANGE RESERVATION
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
