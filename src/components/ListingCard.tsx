import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Star, Heart, Coffee, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { saveListingReturnState } from "@/lib/listing-return";

export interface ListingCardData {
  id: string;
  title: string;
  location: string;
  max_guests?: number | null;
  bedrooms?: number | null;
  /** Lower of weekday/weekend. */
  price_per_night: number;
  price_weekday?: number | null;
  price_weekend?: number | null;
  cover?: string | null;
  /** Full ordered photo list, enables card-level slider. Falls back to [cover] when missing. */
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

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function ListingCard({
  listing,
  index = 0,
  disablePhotoSwipe = false,
}: {
  listing: ListingCardData;
  index?: number;
  /** Turn off touch-swipe between photos (use inside horizontally scrolling rows). */
  disablePhotoSwipe?: boolean;
}) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFav = favoriteIds.has(listing.id);

  const photos: string[] = (() => {
    if (listing.photos && listing.photos.length > 0) return listing.photos;
    if (listing.cover) return [listing.cover];
    return [];
  })();

  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

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
    setCurrent(Math.max(0, Math.min(photos.length - 1, i)));
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
    if (dx > 40) goTo(current - 1);
    else if (dx < -40) goTo(current + 1);
  };

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  const hasBreakfast = (listing.amenities ?? []).some((a) => a.toLowerCase() === "breakfast included");

  const weekday = listing.price_weekday ?? listing.price_per_night;
  const weekend = listing.price_weekend ?? listing.price_per_night;
  const nightly = Math.min(weekday, weekend);
  const showWeekend = weekend > weekday;

  const kindLine = listing.category
    ? `${CATEGORY_LABEL[listing.category]} in ${listing.location}`
    : listing.location;

  const roomParts: string[] = [];
  if (listing.bedrooms != null && listing.bedrooms > 0) {
    roomParts.push(`${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}`);
  }
  if (listing.max_guests != null && listing.max_guests > 0) {
    roomParts.push(`Up to ${listing.max_guests} guest${listing.max_guests === 1 ? "" : "s"}`);
  }

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
        onClick={() => saveListingReturnState()}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          {photos.length > 0 ? (
            <div
              className="absolute inset-0 h-full w-full overflow-hidden"
              {...(disablePhotoSwipe ? {} : { onTouchStart, onTouchMove, onTouchEnd })}
            >
              <div
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
                      alt={`${listing.title} - photo ${i + 1}`}
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

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => handleArrow(e, -1)}
                aria-label="Previous photo"
                className={`absolute left-2 top-1/2 z-[2] h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-opacity duration-200 hover:bg-white md:opacity-0 md:group-hover:opacity-100 ${
                  current === 0 ? "hidden md:inline-flex" : "inline-flex"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleArrow(e, 1)}
                aria-label="Next photo"
                className={`absolute right-2 top-1/2 z-[2] h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-opacity duration-200 hover:bg-white md:opacity-0 md:group-hover:opacity-100 ${
                  current === photos.length - 1 ? "hidden md:inline-flex" : "inline-flex"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {photos.length > 1 && photos.length <= 8 && (
            <div className="pointer-events-auto absolute bottom-2.5 left-1/2 z-[2] flex -translate-x-1/2 gap-1">
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

          {hasBreakfast && (
            <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              <Coffee className="h-3.5 w-3.5 text-[#CC0000]" aria-hidden="true" />
              Breakfast included
            </span>
          )}

          <button
            type="button"
            onClick={handleHeart}
            aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={isFav}
            className="absolute right-3 top-3 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition active:scale-90 hover:bg-white"
          >
            <motion.span
              key={isFav ? "on" : "off"}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 14 }}
              className="inline-flex"
            >
              <Heart className={`h-[18px] w-[18px] transition-colors ${isFav ? "fill-primary text-primary" : "text-foreground"}`} />
            </motion.span>
          </button>
        </div>

        <div className="mt-3.5 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 min-w-0 flex-1 font-sans text-base font-semibold leading-snug text-foreground md:text-[17px]">
              {listing.title}
            </h3>
            {listing.rating != null && (
              <span className="flex shrink-0 items-center gap-1 text-sm text-foreground">
                <Star className="h-3.5 w-3.5 fill-foreground" aria-hidden="true" />
                {listing.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="line-clamp-1 text-sm text-[#6B6363]">{kindLine}</p>
          {roomParts.length > 0 && (
            <p className="line-clamp-1 text-sm text-[#6B6363]">{roomParts.join(" · ")}</p>
          )}
          <p className="mt-1.5 text-[15px] text-foreground">
            <span className="font-semibold">{usd(nightly)}</span> / night
            {showWeekend && <span className="text-[#6B6363]"> · {usd(weekend)} weekends</span>}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
