import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import type { ListingCardData } from "./ListingCard";
import { ReserveDetailsModal } from "./ReserveDetailsModal";
import { saveListingReturnState } from "@/lib/listing-return";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

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
  const [reserveOpen, setReserveOpen] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const listingUrl = listing ? `${origin}/listing/${listing.id}` : "";


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
  onClick={() => saveListingReturnState()}
>
  View full listing
</Link>
                <button
                  type="button"
                  onClick={() => setReserveOpen(true)}
                  className="inline-flex flex-1 animate-[pulse-soft_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-70"
                >
                  <>
                    <WhatsAppIcon className="h-4 w-4" />
                    Reserve
                  </>
                </button>
              </div>
            </div>
          </motion.div>
          <ReserveDetailsModal
            open={reserveOpen}
            onCancel={() => setReserveOpen(false)}
            listingId={listing.id}
            listingTitle={listing.title}
            listingLocation={listing.location}
            priceWeekday={listing.price_weekday ?? listing.price_per_night ?? null}
            priceWeekend={listing.price_weekend ?? listing.price_per_night ?? null}
            listingUrl={listingUrl}
            defaultGuests={listing.max_guests ?? 1}
          />
        </motion.div>
      )}
    </AnimatePresence>

  );
}
