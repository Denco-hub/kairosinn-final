import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { Wifi, BedDouble, Bath, Coffee, Fan, Briefcase, MapPin, Star } from "lucide-react";
import hero from "@/assets/hero-motel.jpg";
import roomPhoto from "@/assets/room.jpg";
import singleRoomPhoto from "@/assets/single-room.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kairos Inn — Comfortable Motel in Karangazi, Nyagatare, Rwanda" },
      {
        name: "description",
        content:
          "Book a clean, affordable room at Kairos Inn in Karangazi, Nyagatare District. Free WiFi, breakfast included. Reserve online today.",
      },
      { property: "og:title", content: "Kairos Inn — Karangazi, Rwanda" },
      {
        property: "og:description",
        content: "Affordable, comfortable motel rooms in Karangazi. Free WiFi & breakfast included.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const amenities = [
  { icon: Wifi, label: "FREE WIFI" },
  { icon: Fan, label: "COOLING FAN" },
  { icon: Bath, label: "PRIVATE BATH" },
  { icon: BedDouble, label: "LUXURY BED" },
  { icon: Briefcase, label: "WORK DESK" },
  { icon: Coffee, label: "BREAKFAST" },
];

const roomPreview = [
  { name: "King Bed Room", price: "RWF 20,000", count: "2 rooms", image: roomPhoto, alt: "King Bed Room at Kairos Inn" },
  { name: "Large Double Room", price: "RWF 16,000", count: "6 rooms", image: roomPhoto, alt: "Large Double Room at Kairos Inn" },
  { name: "Double Room", price: "RWF 13,000", count: "4 rooms", image: singleRoomPhoto, alt: "Double Room at Kairos Inn" },
  { name: "Twin Bed Room", price: "RWF 10,000", count: "1 room", image: singleRoomPhoto, alt: "Twin Bed Room at Kairos Inn" },
];

function HomePage() {
  return (
    <SiteLayout>
      <div className="bg-[#fbf9f4] text-[#2c2520] min-h-screen">
        <section className="relative isolate overflow-hidden border-b border-[#af8f52]/20">
          <div className="absolute inset-0 -z-10">
            <ImageWithSkeleton
              src={hero}
              alt="Kairos Inn motel exterior at golden hour"
              loading="eager"
              fetchPriority="high"
              className="h-full w-full filter brightness-[0.7] sepia-[0.15]"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-[#2c2520]/80" />

          <div className="mx-auto flex min-h-[90vh] max-w-5xl flex-col items-center text-center justify-center px-6 py-20 text-[#fbf9f4]">
            <span className="mb-6 inline-flex items-center gap-2 border border-[#af8f52]/40 bg-[#2c2520]/60 px-4 py-1.5 font-serif text-xs uppercase tracking-[0.2em] text-[#e0cfb3] backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-[#af8f52]" /> Karangazi · Nyagatare · Rwanda
            </span>
            <h1 className="font-serif text-5xl font-light tracking-wide leading-tight md:text-7xl">
              Welcome to <span className="block mt-2 font-normal italic text-[#e0cfb3]">Kairos Inn</span>
            </h1>
            <div className="w-24 h-[1px] bg-[#af8f52] my-6" />
            <p className="max-w-2xl font-serif text-base md:text-lg text-[#fbf9f4]/80 leading-relaxed tracking-wide">
              A timeless oasis of rest in Eastern Rwanda. Discover pristine lodging,
              genuine hospitality, and quiet comfort curated for the modern traveler.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/rooms">
                <Button size="lg" className="bg-gradient-to-b from-[#c5a86a] to-[#af8f52] text-[#fbf9f4] font-serif tracking-widest rounded-none px-8 hover:brightness-110 shadow-md border border-[#af8f52]">
                  VIEW ROOMS & BOOK
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-[#fbf9f4]/40 bg-white/5 text-[#fbf9f4] font-serif tracking-widest rounded-none px-8 hover:bg-[#fbf9f4]/10 hover:text-white transition-all">
                  CONTACT RECEPTION
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold tracking-[0.3em] text-[#af8f52] block mb-2">PROVISIONS</span>
            <h2 className="font-serif text-3xl font-normal text-[#2c2520] md:text-4xl">Everything You Need</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-12 h-[1px] bg-[#af8f52]/30" />
              <span className="text-[#af8f52] text-xs">◆</span>
              <div className="w-12 h-[1px] bg-[#af8f52]/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {amenities.map((a) => (
              <div key={a.label} className="flex flex-col items-center gap-3 rounded-none border border-[#af8f52]/20 bg-[#fbf9f4] p-6 text-center transition-all duration-300 hover:border-[#af8f52] hover:shadow-md group">
                <div className="p-3 border border-[#af8f52]/10 bg-[#faf6ee] group-hover:bg-[#af8f52]/10 transition-colors">
                  <a.icon className="h-5 w-5 text-[#af8f52]" />
                </div>
                <span className="font-serif text-xs font-semibold tracking-wider text-[#2c2520]/90">{a.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#faf6ee] border-y border-[#af8f52]/10 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-[0.3em] text-[#af8f52] block mb-2">SANCTUARY</span>
                <h2 className="font-serif text-3xl font-normal text-[#2c2520] md:text-4xl">Our Private Rooms</h2>
              </div>
              <Link to="/rooms" className="hidden md:inline">
                <Button variant="outline" className="border-[#af8f52]/40 text-[#2c2520] font-serif tracking-widest rounded-none hover:bg-[#af8f52]/10">
                  SEE ALL ROOMS
                </Button>
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {roomPreview.map((room) => (
                <div key={room.name} className="overflow-hidden rounded-none border border-[#af8f52]/20 bg-[#fbf9f4] shadow-sm transition-all hover:shadow-md flex flex-col">
                  <div className="relative overflow-hidden">
                    <ImageWithSkeleton
                      src={room.image}
                      alt={room.alt}
                      objectFit="contain"
                      className="h-64 w-full bg-[#faf6ee]"
                    />
                    <div className="absolute top-4 right-4 bg-[#2c2520] border border-[#af8f52] px-3 py-1 text-center">
                      <span className="font-serif text-xs text-[#e0cfb3] tracking-wide block">{room.price}</span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-2xl font-normal text-[#2c2520] mb-2">{room.name}</h3>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#af8f52] uppercase">{room.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/rooms">
                <Button variant="outline" className="w-full md:w-auto border-[#af8f52]/40 font-serif tracking-widest rounded-none px-8">
                  VIEW ALL ROOMS & RATES
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-4 w-4 text-[#af8f52] fill-[#af8f52]/30" />
            <Star className="h-5 w-5 text-[#af8f52] fill-[#af8f52]" />
            <Star className="h-4 w-4 text-[#af8f52] fill-[#af8f52]/30" />
          </div>
          <span className="text-xs font-bold tracking-[0.4em] text-[#af8f52] block mb-2">EXPERIENCE</span>
          <h2 className="font-serif text-3xl font-normal md:text-4xl italic text-[#2c2520]">“Local hospitality, real comfort.”</h2>
          <p className="mt-6 font-serif max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed">
            Kairos Inn is tended to by native staff dedicated to the art of hosting. Whether your journey leads you through Nyagatare for professional ventures, regional transit, or family celebrations, we welcome you to find sanctuary within our stone.
          </p>
          <div className="mt-10">
            <Link to="/rooms">
              <Button size="lg" className="bg-gradient-to-b from-[#c5a86a] to-[#af8f52] text-[#fbf9f4] font-serif tracking-widest rounded-none px-10 hover:brightness-110 shadow-md border border-[#af8f52]">
                RESERVE YOUR ROOM
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
