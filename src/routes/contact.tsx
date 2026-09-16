import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Kairos Inn, Karangazi" },
      {
        name: "description",
        content:
          "Get in touch with Kairos Inn reception in Karangazi, Nyagatare District. Call, WhatsApp, or email us to ask about availability.",
      },
      { property: "og:title", content: "Contact Kairos Inn" },
      {
        property: "og:description",
        content: "Reach Kairos Inn reception by phone, WhatsApp, or email.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <div className="bg-[#fbf9f4] text-[#2c2520] min-h-screen">
        
        {/* --- PAGE HEADER --- */}
        <section className="bg-[#faf6ee] border-b border-[#af8f52]/20">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center md:text-left">
            <span className="text-xs font-bold tracking-[0.3em] text-[#af8f52] block mb-2">INQUIRIES</span>
            <h1 className="font-serif text-4xl font-normal tracking-wide text-[#2c2520] md:text-5xl">
              Contact Reception
            </h1>
            <div className="w-16 h-[1px] bg-[#af8f52] my-4 mx-auto md:mx-0" />
            <p className="max-w-2xl font-serif italic text-sm text-muted-foreground leading-relaxed">
              Whether arranging formal bookings, seeking custom provisions, or requesting guidance through the province, our desk remains open to your communication.
            </p>
          </div>
        </section>

        {/* --- COMMUNICATIONS DIRECTORY --- */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Phone Channel */}
            <a
              href="tel:+250791271095"
              className="group relative rounded-none border border-[#af8f52]/20 bg-[#fbf9f4] p-6 transition-all duration-300 hover:border-[#af8f52] hover:shadow-md flex items-start gap-4"
            >
              <div className="p-2.5 border border-[#af8f52]/10 bg-[#faf6ee] group-hover:bg-[#af8f52]/10 transition-colors shrink-0">
                <Phone className="h-5 w-5 text-[#af8f52]" />
              </div>
              <div>
                <div className="font-serif text-sm font-semibold tracking-wider text-[#2c2520] uppercase">Voice Dispatch</div>
                <div className="mt-1 font-serif text-base text-muted-foreground group-hover:text-[#af8f52] transition-colors">
                  +250 791 271 095
                </div>
              </div>
            </a>

            {/* WhatsApp Channel */}
            <a
              href="https://wa.me/250791271095"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-none border border-[#af8f52]/20 bg-[#fbf9f4] p-6 transition-all duration-300 hover:border-[#af8f52] hover:shadow-md flex items-start gap-4"
            >
              <div className="p-2.5 border border-[#af8f52]/10 bg-[#faf6ee] group-hover:bg-[#af8f52]/10 transition-colors shrink-0">
                <MessageCircle className="h-5 w-5 text-[#af8f52]" />
              </div>
              <div>
                <div className="font-serif text-sm font-semibold tracking-wider text-[#2c2520] uppercase">Instant Messaging</div>
                <div className="mt-1 font-serif text-sm text-muted-foreground group-hover:text-[#2c2520] transition-colors">
                  Chat via WhatsApp
                </div>
              </div>
            </a>

            {/* Email Channel */}
            <a
              href="mailto:admin@kairosinn.com"
              className="group relative rounded-none border border-[#af8f52]/20 bg-[#fbf9f4] p-6 transition-all duration-300 hover:border-[#af8f52] hover:shadow-md flex items-start gap-4"
            >
              <div className="p-2.5 border border-[#af8f52]/10 bg-[#faf6ee] group-hover:bg-[#af8f52]/10 transition-colors shrink-0">
                <Mail className="h-5 w-5 text-[#af8f52]" />
              </div>
              <div>
                <div className="font-serif text-sm font-semibold tracking-wider text-[#2c2520] uppercase">Electronic Mail</div>
                <div className="mt-1 font-serif text-base text-muted-foreground group-hover:text-[#af8f52] transition-colors break-all">
                  admin@kairosinn.com
                </div>
              </div>
            </a>

            {/* Location Module */}
            <div className="relative rounded-none border border-[#af8f52]/20 bg-[#faf6ee] p-6 flex items-start gap-4 sm:col-span-2">
              <div className="p-2.5 border border-[#af8f52]/10 bg-[#fbf9f4] shrink-0">
                <MapPin className="h-5 w-5 text-[#af8f52]" />
              </div>
              <div>
                <div className="font-serif text-sm font-semibold tracking-wider text-[#2c2520] uppercase">Our Coordinates</div>
                <p className="mt-1 font-serif text-sm italic text-muted-foreground leading-relaxed">
                  Karangazi, Nyagatare District, Eastern Province, Rwanda
                </p>
              </div>
            </div>

          </div>
          
          {/* Subtle Structural Design Ornament Base */}
          <div className="flex items-center justify-center gap-2 mt-16 opacity-40">
            <div className="w-16 h-[1px] bg-[#af8f52]" />
            <span className="text-[#af8f52] text-xs">◆</span>
            <div className="w-16 h-[1px] bg-[#af8f52]" />
          </div>
        </section>

      </div>
    </SiteLayout>
  );
}
