import { useLocation } from "@tanstack/react-router";
import { WhatsAppLogo } from "@/components/icons/WhatsAppLogo";

const WHATSAPP_URL = "https://wa.me/96181160435";

/**
 * Floating WhatsApp button visible on every page.
 * On listing detail pages, offset higher to avoid sticky reserve bar.
 */
export function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const isListing = pathname.startsWith("/listing/");

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{
        bottom: isListing ? "92px" : "20px",
        right: "20px",
      }}
      className="fixed z-[9999] flex h-14 w-14 items-center justify-center rounded-full transition hover:scale-105 drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
    >
      <WhatsAppLogo className="h-14 w-14" />
    </a>
  );
}
