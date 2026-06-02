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

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BASE_URLS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [isMobile]);

  // Preload the next slide for a smoother crossfade
  useEffect(() => {
    if (isMobile) return;
    const next = (index + 1) % BASE_URLS.length;
    const img = new Image();
    img.src = slideUrl(BASE_URLS[next], 1920, 75);
  }, [index, isMobile]);

  const currentBase = BASE_URLS[index];

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-foreground">
        {isMobile ? (
          <img
            src={slideUrl(BASE_URLS[0], 480, 40)}
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="eager"
            fetchPriority="high"
            crossOrigin="anonymous"
            width={480}
            height={360}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <AnimatePresence mode="sync">
            <motion.img
              key={currentBase}
              src={slideUrl(currentBase, 1920, 75)}
              srcSet={`${slideUrl(currentBase, 1200, 70)} 1200w, ${slideUrl(currentBase, 1920, 75)} 1920w`}
              sizes="1920px"
              alt=""
              aria-hidden="true"
              decoding="async"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
              width={1920}
              height={1280}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.2, ease: "easeInOut" } }}
            />
          </AnimatePresence>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
      </div>

      {!isMobile && (
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
      )}
    </>
  );
}
