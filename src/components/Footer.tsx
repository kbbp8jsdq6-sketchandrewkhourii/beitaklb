import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { PatternBackground } from "./PatternBackground";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const BECOME_HOST_MESSAGE = "Hi Beitak! I'm interested in listing my unit on your website. Could you help me get started?";
const WHATSAPP_URL = `https://wa.me/96181160435?text=${encodeURIComponent(BECOME_HOST_MESSAGE)}`;
const INSTAGRAM_URL = "https://instagram.com/beitak.lb";

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
              Discover unique stays across Lebanon - from coastal villas to mountain retreats.
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
