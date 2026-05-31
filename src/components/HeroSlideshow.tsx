import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BASE_URLS = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop",
];

const slideUrl = (base: string, w: number, q: number) => `${base}&w=${w}&q=${q}`;

// Inject a <link rel="preload" as="image"> for the first hero slide so it
// starts downloading before React hydrates.
if (typeof document !== "undefined") {
  const firstSrc = slideUrl(BASE_URLS[0], 1920, 80);
  if (!document.querySelector(`link[rel="preload"][href="${firstSrc}"]`)) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstSrc;
    (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = "high";
    document.head.appendChild(link);
  }
}

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BASE_URLS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  // Preload the next slide for a smoother crossfade
  useEffect(() => {
    const next = (index + 1) % BASE_URLS.length;
    const img = new Image();
    img.src = slideUrl(BASE_URLS[next], 1920, 80);
  }, [index]);

  const currentBase = BASE_URLS[index];

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-foreground">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentBase}
            src={slideUrl(currentBase, 1920, 80)}
            srcSet={`${slideUrl(currentBase, 800, 60)} 800w, ${slideUrl(currentBase, 1920, 80)} 1920w`}
            sizes="(max-width: 768px) 800px, 1920px"
            alt=""
            aria-hidden="true"
            decoding="async"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
            width={1920}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ willChange: "transform, opacity" }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4, ease: "easeInOut" }, scale: { duration: 8, ease: "easeOut" } }}
          />
        </AnimatePresence>
        {/* Soft dark overlay for readable text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
      </div>

      {/* Dots */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {BASE_URLS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </>
  );
}
