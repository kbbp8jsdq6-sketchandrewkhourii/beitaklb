import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardPhotoSliderProps {
  photos: string[];
  alt: string;
  /** Optional fallback when photos array is empty. */
  fallback?: React.ReactNode;
  /** Extra classes for each <img> (e.g. hover scale). */
  imgClassName?: string;
}

/**
 * Smooth GPU-accelerated photo slider for use inside listing cards.
 * - Mobile: arrows always visible + swipe gesture
 * - Desktop: arrows fade in on parent `.group:hover`
 * - Hides left arrow on first photo, right arrow on last (no wrap)
 * - Arrow clicks stop propagation so the parent <Link> still handles taps elsewhere
 */
export function CardPhotoSlider({
  photos,
  alt,
  fallback,
  imgClassName = "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
}: CardPhotoSliderProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  // Preload neighbors for instant slides
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

  if (photos.length === 0) {
    return <>{fallback}</>;
  }

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(photos.length - 1, i));
    setCurrent(clamped);
  };

  const handleArrow = (e: React.MouseEvent, dir: -1 | 1) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(current + dir);
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
    const threshold = 40;
    if (dx > threshold) goTo(current - 1);
    else if (dx < -threshold) goTo(current + 1);
  };

  return (
    <>
      <div
        className="absolute inset-0 h-full w-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
                alt={`${alt} — photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className={imgClassName}
              />
            </div>
          ))}
        </div>
      </div>

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

      {photos.length > 1 && photos.length <= 8 && (
        <div className="pointer-events-auto absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(i);
              }}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/70 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
