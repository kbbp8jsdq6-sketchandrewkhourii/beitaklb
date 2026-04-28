import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Curated Unsplash placeholders matching the warm Beitak palette
// (cozy stone homes, mountain retreats, seaside stays, gardens).
const SLIDES = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1920&q=80",
];

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  // Preload the next slide for a smoother crossfade
  useEffect(() => {
    const next = (index + 1) % SLIDES.length;
    const img = new Image();
    img.src = SLIDES[next];
  }, [index]);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-foreground">
        <AnimatePresence mode="sync">
          <motion.img
            key={SLIDES[index]}
            src={SLIDES[index]}
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
        {SLIDES.map((_, i) => (
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
