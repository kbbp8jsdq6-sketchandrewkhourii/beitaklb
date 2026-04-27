import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { PatternBackground } from "./PatternBackground";

const BECOME_HOST_MESSAGE = "Hi Beitak! I'm interested in listing my unit on your website. Could you help me get started?";
const WHATSAPP_URL = `https://wa.me/96181160435?text=${encodeURIComponent(BECOME_HOST_MESSAGE)}`;
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
    <footer className="relative border-t border-border bg-white text-foreground">
      <PatternBackground />
      <div className="relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-foreground">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex justify-center md:justify-start">
              <Logo size="lg" />
            </div>
            <p className="mt-4 uppercase tracking-[0.25em] text-primary font-serif my-[8px] opacity-70 text-base">
              {" "}
            </p>
            <p className="mt-3 max-w-xs text-sm text-foreground/70">
              Discover unique stays across Lebanon — from coastal villas to mountain retreats.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-xl tracking-wider text-foreground">Quick links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-foreground/80 transition hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-foreground/80 transition hover:text-primary">
                  Browse listings
                </Link>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 transition hover:text-primary"
                >
                  Become a host
                </a>
              </li>
              <li>
                <a href="#faq" className="text-foreground/80 transition hover:text-primary">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-display text-xl tracking-wider text-foreground">Connect</h3>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow @beitak.lb on Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground transition hover:border-[#E1306C] hover:bg-[#E1306C] hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-foreground/70">
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

        <div className="mt-10 border-t border-foreground/10 pt-6 pb-6 text-center text-xs text-foreground/60">
          © {new Date().getFullYear()} BEITAK. All rights reserved.
        </div>
      </div>
      </div>

      {/* Red liquid wave — last element on the page. Sits in normal
          document flow so nothing can overlap footer content above. */}
      <div className="footer-wave" aria-hidden="true">
        {/* Back layer — slowest, most transparent (hidden on mobile) */}
        <svg className="fw-back" viewBox="0 0 2880 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#ffffff"
            d="M0,60 C240,10 480,110 720,70 C960,30 1200,100 1440,60 C1680,20 1920,110 2160,70 C2400,30 2640,100 2880,60 L2880,0 L0,0 Z"
          />
        </svg>
        {/* Mid layer */}
        <svg className="fw-mid" viewBox="0 0 2880 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#ffffff"
            d="M0,40 C300,90 600,0 900,50 C1200,100 1500,10 1800,50 C2100,90 2400,0 2700,50 C2820,70 2880,40 2880,40 L2880,0 L0,0 Z"
          />
        </svg>
        {/* Front layer — sharpest, opaque, defines the white→red transition */}
        <svg className="fw-front" viewBox="0 0 2880 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#ffffff"
            d="M0,30 C180,80 420,0 660,40 C900,80 1140,10 1380,50 C1620,90 1860,20 2100,50 C2340,80 2580,20 2880,50 L2880,0 L0,0 Z"
          />
        </svg>
      </div>
    </footer>
  );
}
