import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Star, Instagram, Heart, Coffee } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export interface ListingCardData {
  id: string;
  title: string;
  location: string;
  /** Lower of weekday/weekend (used for "From $X / night" display). */
  price_per_night: number;
  price_weekday?: number | null;
  price_weekend?: number | null;
  cover?: string | null;
  rating?: number | null;
  amenities?: string[];
  category?: "villa" | "cabin" | "apartment" | null;
}

const CATEGORY_LABEL: Record<"villa" | "cabin" | "apartment", string> = {
  villa: "Villa",
  cabin: "Cabin",
  apartment: "Apartment",
};

export function ListingCard({
  listing,
  index = 0,
  onQuickPreview,
}: {
  listing: ListingCardData;
  index?: number;
  onQuickPreview?: (listing: ListingCardData) => void;
}) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFav = favoriteIds.has(listing.id);

  const handleMobileTap = (e: React.MouseEvent) => {
    if (!onQuickPreview) return;
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      onQuickPreview(listing);
    }
  };

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  const hasBreakfast = (listing.amenities ?? []).some(
    (a) => a.toLowerCase() === "breakfast included",
  );

  const fromPrice = Math.min(
    listing.price_weekday ?? listing.price_per_night,
    listing.price_weekend ?? listing.price_per_night,
  );

  return (
    <motion.div
      className="group block"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.6), ease: "easeOut" }}
      onMouseEnter={() => onQuickPreview && onQuickPreview(listing)}
    >
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block"
        onClick={handleMobileTap}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          {listing.cover ? (
            <img
              src={listing.cover}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent">
              <MapPin className="h-10 w-10 text-primary/40" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur">
              {listing.location.split(" (")[0]}
            </span>
            {listing.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow backdrop-blur">
                {CATEGORY_LABEL[listing.category]}
              </span>
            )}
            {hasBreakfast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                <Coffee className="h-3 w-3" /> Breakfast
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleHeart}
            aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={isFav}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition active:scale-90 hover:bg-background"
          >
            <motion.span
              key={isFav ? "on" : "off"}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 14 }}
              className="inline-flex"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFav ? "fill-primary text-primary" : "text-foreground"
                }`}
              />
            </motion.span>
          </button>
        </div>
      </Link>
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <Link to="/listing/$id" params={{ id: listing.id }} className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-sans text-base font-semibold text-foreground">
              {listing.title}
            </h3>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {listing.rating != null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                <span>{listing.rating.toFixed(1)}</span>
              </div>
            )}
            <a
              href="https://instagram.com/beitak.lb"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @beitak.lb on Instagram"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground transition-colors hover:text-[#E1306C]"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
        <Link to="/listing/$id" params={{ id: listing.id }} className="block">
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {listing.location}
          </p>
          <p className="mt-1.5 text-sm">
            <span className="text-muted-foreground">From </span>
            <span className="font-semibold text-foreground">${fromPrice.toFixed(0)}</span>
            <span className="text-muted-foreground"> / night</span>
          </p>
        </Link>
      </div>
    </motion.div>
  );
}
