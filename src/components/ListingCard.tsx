import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Star, Instagram, Heart, Coffee, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { saveListingReturnState } from "@/lib/listing-return";

export interface ListingCardData {
  id: string;
  title: string;
  location: string;
  /** Lower of weekday/weekend (used for "From $X / night" display). */
  price_per_night: number;
  price_weekday?: number | null;
  price_weekend?: number | null;
  cover?: string | null;
  /** Full ordered photo list — enables card-level slider. Falls back to [cover] when missing. */
  photos?: string[];
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

  // Build the slider's photo list. Always falls back to cover if no photos array provided.
  const photos: string[] = (() => {
    if (listing.photos && listing.photos.length > 0) return listing.photos;
    if (listing.cover) return [listing.cover];
    return [];
  })();

  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  // Preload neighbors to avoid flicker when sliding
  useEffect(() => {
    if (photos.length <= 1) return;
    const next = (current + 1) % photos.length;
    const prev = (current - 1 + photos.length) % photos.length;
    [next, prev].forEach((i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = photos[i];
    });
  }, [current, photos]);

  const goTo = (i: number) => {
    if (photos.length === 0) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, i));
    setCurrent(clamped);
  };

  const handleArrow = (e: React.MouseEvent, dir: -1 | 1) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(current + dir);
  };

  const handleDot = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(i);
  };

  // Touch swipe — passive listeners via React (touchmove uses passive: true by default in React 19)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null) return;
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    const threshold = 40;
    if (dx > threshold) goTo(current - 1);
    else if (dx < -threshold) goTo(current + 1);
  };

  const handleMobileTap = (e: React.MouseEvent) => {
    saveListingReturnState();
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

  // Detect coarse pointer (mobile/touch) once per render — disables hover preview entirely.
  const isCoarsePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <motion.div
      className="listing-card group block"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.6), ease: "easeOut" }}
    >
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block"
        onClick={handleMobileTap}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          {photos.length > 0 ? (
            <div
              className="absolute inset-0 h-full w-full overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                ref={trackRef}
                className="flex h-full w-full"
                style={{
                  transform: `translate3d(-${current * 100}%, 0, 0)`,
                  transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                }}
              >
                {photos.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-full w-full shrink-0 grow-0 basis-full"
                    style={{ transform: "translate3d(0,0,0)" }}
                  >
                    <img
                      src={src}
                      alt={`${listing.title} — photo ${i + 1}`}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent">
              <MapPin className="h-10 w-10 text-primary/40" />
            </div>
          )}

          {/* Center hover hotspot — only triggers preview when hovering exact center of the cover photo */}
          {onQuickPreview && !isCoarsePointer && (
            <div
              aria-hidden="true"
              onMouseEnter={() => onQuickPreview(listing)}
              className="pointer-events-auto absolute left-1/2 top-1/2 z-[1] h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2"
            />
          )}

          {/* Desktop arrows — appear on hover */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => handleArrow(e, -1)}
                aria-label="Previous photo"
                className={`absolute left-2 top-1/2 z-[2] h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-opacity duration-200 hover:bg-white md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 ${
                  current === 0 ? "hidden md:inline-flex" : "inline-flex"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleArrow(e, 1)}
                aria-label="Next photo"
                className={`absolute right-2 top-1/2 z-[2] h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-opacity duration-200 hover:bg-white md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 ${
                  current === photos.length - 1 ? "hidden md:inline-flex" : "inline-flex"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {photos.length > 1 && photos.length <= 8 && (
            <div className="pointer-events-auto absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleDot(e, i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-4 bg-white" : "w-1.5 bg-white/70 hover:bg-white/90"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute left-3 top-3 z-[2] flex flex-col gap-1.5">
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
            className="absolute right-3 top-3 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition active:scale-90 hover:bg-background"
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
          <Link to="/listing/$id" params={{ id: listing.id }} onClick={saveReturnUrl} className="min-w-0 flex-1">
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
        <Link to="/listing/$id" params={{ id: listing.id }} onClick={saveReturnUrl} className="block">
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
