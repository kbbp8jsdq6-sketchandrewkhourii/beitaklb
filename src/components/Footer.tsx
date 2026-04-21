import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { Logo } from "./Logo";

const WHATSAPP_URL = "https://wa.me/96181160435";
const INSTAGRAM_URL = "https://instagram.com/beitak.lb";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.32c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.92 0-10.73 4.81-10.74 10.72 0 1.89.49 3.74 1.43 5.36L5.2 26.67l5.42-1.42a10.7 10.7 0 0 0 5.39 1.45h.01c5.92 0 10.73-4.81 10.74-10.72a10.66 10.66 0 0 0-3.14-7.59 10.66 10.66 0 0 0-7.59-3.16z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex justify-center md:justify-start">
              <Logo size="lg" variant="white" />
            </div>
            <p className="mt-4 uppercase tracking-[0.25em] text-primary font-serif my-[8px] shadow-md opacity-70 text-base">
              Home is closer than you think.
            </p>
            <p className="mt-3 max-w-xs text-sm text-secondary-foreground/70">
              Discover unique stays across Lebanon — from coastal villas to mountain retreats.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-xl tracking-wider text-white">Quick links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-secondary-foreground/80 transition hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-secondary-foreground/80 transition hover:text-primary">
                  Browse listings
                </Link>
              </li>
              <li>
                <Link to="/host/new" className="text-secondary-foreground/80 transition hover:text-primary">
                  Become a host
                </Link>
              </li>
              <li>
                <a href="#faq" className="text-secondary-foreground/80 transition hover:text-primary">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-display text-xl tracking-wider text-white">Connect</h3>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow @beitak.lb on Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-[#E1306C] hover:bg-[#E1306C] hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-secondary-foreground/70">
              <p>@Beitak.lb</p>
              <p className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
                <span>+961 81 160 435</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>Beitaklb@gmail.com</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} BEITAK. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
