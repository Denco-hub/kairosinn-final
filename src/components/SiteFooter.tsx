import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[#af8f52]/20 bg-[#2c2520] text-[#fbf9f4]">
      {/* Visual Accent: Triple decorative top line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#af8f52]/40 to-transparent" />
      
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        {/* Brand Description Column */}
        <div className="space-y-4">
          <div className="inline-block rounded-none border border-[#af8f52]/40 bg-[#fbf9f4] p-1 brightness-95">
            <Logo />
          </div>
          <p className="max-w-xs font-serif text-sm italic text-[#fbf9f4]/70 leading-relaxed">
            A timeless sanctuary of comfort situated in Karangazi, Nyagatare District, Eastern Province of Rwanda.
          </p>
        </div>

        {/* Location & Directory Column */}
        <div className="text-sm font-serif">
          <h3 className="mb-4 text-xs font-bold tracking-[0.25em] text-[#e0cfb3] uppercase">
            The Coordinates
          </h3>
          <ul className="space-y-3 text-[#fbf9f4]/80">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#af8f52]" />
              <span className="text-xs leading-relaxed">
                Karangazi, Nyagatare District, Eastern Province, Rwanda
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#af8f52]" />
              <a href="tel:+250793081660" className="text-xs transition-colors hover:text-[#e0cfb3]">
                +250 793 081 660
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#af8f52]" />
              <a href="mailto:hello@kairosinn.rw" className="text-xs transition-colors hover:text-[#e0cfb3] break-all">
                hello@kairosinn.rw
              </a>
            </li>
          </ul>
        </div>

        {/* Navigation Directory Column */}
        <div className="text-sm font-serif">
          <h3 className="mb-4 text-xs font-bold tracking-[0.25em] text-[#e0cfb3] uppercase">
            Navigation
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-[#fbf9f4]/80">
            <li>
              <Link to="/" className="transition-colors hover:text-[#e0cfb3] flex items-center gap-1.5">
                <span className="text-[#af8f52]/40 text-[9px]">◆</span> HOME
              </Link>
            </li>
            <li>
              <Link to="/rooms" className="transition-colors hover:text-[#e0cfb3] flex items-center gap-1.5">
                <span className="text-[#af8f52]/40 text-[9px]">◆</span> ROOMS
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-[#e0cfb3] flex items-center gap-1.5">
                <span className="text-[#af8f52]/40 text-[9px]">◆</span> CONTACT
              </Link>
            </li>
            <li>
              <Link to="/auth" className="transition-colors hover:text-[#e0cfb3] flex items-center gap-1.5">
                <span className="text-[#af8f52]/40 text-[9px]">◆</span> SIGN IN
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* --- SUB-FOOTER CREDITS --- */}
      <div className="border-t border-[#af8f52]/10 bg-black/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 font-serif text-[11px] tracking-wider text-[#fbf9f4]/50 sm:flex-row">
          <span>
            © {new Date().getFullYear()} KAIROS INN. ALL RIGHTS RESERVED.
          </span>
          <span className="flex items-center gap-1.5">
            ARCHITECTED BY 
            <a
              href="https://wa.me/250793081660"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#e0cfb3] transition-colors hover:text-[#af8f52] hover:underline"
            >
              PI-PRODUCTIONS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}