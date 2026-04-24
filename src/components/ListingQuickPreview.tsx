import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, X } from "lucide-react";
import { useState } from "react";
import type { ListingCardData } from "./ListingCard";
import { buildListingWhatsAppHref, buildListingWhatsAppHrefSync } from "@/lib/whatsapp";
import { WhatsAppReserveModal } from "./WhatsAppReserveModal";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.32c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.92 0-10.73 4.81-10.74 10.72 0 1.89.49 3.74 1.43 5.36L5.2 26.67l5.42-1.42a10.7 10.7 0 0 0 5.39 1.45h.01c5.92 0 10.73-4.81 10.74-10.72a10.66 10.66 0 0 0-3.14-7.59 10.66 10.66 0 0 0-7.59-3.16z" />
    </svg>
  );
}

export interface QuickPreviewListing extends ListingCardData {
  description?: string | null;
}

export function ListingQuickPreview({
  listing,
  open,
  onClose,
}: {
  listing: QuickPreviewListing | null;
  open: boolean;
  onClose: () => void;
}) {
  const [waLoading, setWaLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [waHref, setWaHref] = useState<string | null>(null);

  const openConfirm = () => {
    if (!listing) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/listing/${listing.id}`;
    const payload = {
      title: listing.title,
      location: listing.location,
      priceWeekday: listing.price_weekday ?? listing.price_per_night,
      priceWeekend: listing.price_weekend ?? listing.price_per_night,
      url,
    };
    // Build sync first so the modal's <a> link works immediately.
    const syncHref = buildListingWhatsAppHrefSync(payload);
    setWaHref(syncHref);
    setShowConfirm(true);

    // Try shortened URL in the background, non-blocking.
    setWaLoading(true);
    buildListingWhatsAppHref(payload)
      .then((short) => {
        if (short && short !== syncHref) setWaHref(short);
      })
      .catch(() => {})
      .finally(() => setWaLoading(false));
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setWaHref(null);
  };

  return (
    <AnimatePresence>
      {open && listing && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition hover:bg-background"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-[4/3] w-full bg-muted">
              {listing.cover ? (
                <img src={listing.cover} alt={listing.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <MapPin className="h-12 w-12 text-primary/40" />
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-2xl text-foreground">{listing.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {listing.location}
              </p>
              {listing.description && (
                <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{listing.description}</p>
              )}
              <p className="mt-3 text-base">
                <span className="text-muted-foreground">From </span>
                <span className="font-semibold text-foreground">
                  ${Math.min(listing.price_weekday ?? listing.price_per_night, listing.price_weekend ?? listing.price_per_night).toFixed(0)}
                </span>
                <span className="text-muted-foreground"> / night</span>
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  to="/listing/$id"
                  params={{ id: listing.id }}
                  className="inline-flex flex-1 items-center justify-center rounded-md border-2 border-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background"
                >
                  View full listing
                </Link>
                <button
                  type="button"
                  onClick={openConfirm}
                  disabled={waLoading}
                  className="inline-flex flex-1 animate-[pulse-soft_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {waLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="h-4 w-4" />
                      Reserve
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <WhatsAppReserveModal
        open={showConfirm}
        loading={waLoading}
        href={waHref ?? undefined}
        onCancel={closeConfirm}
      />
    </AnimatePresence>
  );
}
