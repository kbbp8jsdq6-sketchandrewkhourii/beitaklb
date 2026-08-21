import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoSliderProps {
  photos: { id?: string; photo_url: string }[];
  alt: string;
  onPhotoClick?: (index: number) => void;
  className?: string;
  overlayChildren?: React.ReactNode;
}

export function PhotoSlider({
  photos,
  alt,
  onPhotoClick,
  className,
  overlayChildren,
}: PhotoSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: photos.length > 1,
    align: "start",
    duration: 22, // ~0.35s at 60fps, natural easing
    dragFree: false,
    skipSnaps: false,
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Preload neighboring images so sliding never waits on network
  useEffect(() => {
    if (photos.length <= 1) return;
    const next = (selected + 1) % photos.length;
    const prev = (selected - 1 + photos.length) % photos.length;
    [next, prev].forEach((i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = photos[i].photo_url;
    });
  }, [selected, photos]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (photos.length === 0) return null;

  return (
    <div className={cn("relative h-[50vh] w-full overflow-hidden bg-muted", className)}>
      <div className="h-full w-full overflow-hidden" ref={emblaRef}>
        <div
          className="flex h-full touch-pan-y"
          style={{
            willChange: "transform",
            transform: "translate3d(0,0,0)",
            backfaceVisibility: "hidden",
          }}
        >
          {photos.map((p, i) => (
            <div
              key={p.id ?? i}
              className="relative h-full w-full min-w-0 shrink-0 grow-0 basis-full"
              style={{ transform: "translate3d(0,0,0)", backfaceVisibility: "hidden" }}
            >
              <button
                type="button"
                onClick={() => onPhotoClick?.(i)}
                className="block h-full w-full"
                aria-label={`Open photo ${i + 1}`}
              >
                <img
                  src={p.photo_url}
                  alt={`${alt} - photo ${i + 1}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                  decoding="async"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  style={{ willChange: "transform" }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Soft gradient for legibility of overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

      {/* Desktop arrows */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white disabled:opacity-40 md:inline-flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white disabled:opacity-40 md:inline-flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Counter */}
      {photos.length > 1 && (
        <span className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          {selected + 1} / {photos.length}
        </span>
      )}

      {/* Dots */}
      {photos.length > 1 && photos.length <= 10 && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selected ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}

      {overlayChildren}
    </div>
  );
}
