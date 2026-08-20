import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_URLS = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop",
];

const isUnsplash = (u: string) => u.includes("images.unsplash.com");
const slideUrl = (base: string, w: number, q: number) =>
  isUnsplash(base) ? `${base}&w=${w}&q=${q}` : base;

export function HeroSlideshow({ initialImages }: { initialImages?: string[] } = {}) {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const heroQ = useQuery({
    queryKey: ["hero-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_images")
        .select("url")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => r.url as string);
    },
    staleTime: 5 * 60_000,
    initialData: initialImages && initialImages.length > 0 ? initialImages : undefined,
  });

  const BASE_URLS = heroQ.data && heroQ.data.length > 0 ? heroQ.data : FALLBACK_URLS;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (BASE_URLS.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BASE_URLS.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [BASE_URLS.length]);

  // Preload next slide for smoother crossfade
  useEffect(() => {
    if (BASE_URLS.length < 2) return;
    const next = (index + 1) % BASE_URLS.length;
    const img = new Image();
    img.src = isMobile ? slideUrl(BASE_URLS[next], 480, 40) : slideUrl(BASE_URLS[next], 1920, 75);
  }, [index, isMobile, BASE_URLS]);

  // Keep index in range if list shrinks
  useEffect(() => {
    if (index >= BASE_URLS.length) setIndex(0);
  }, [BASE_URLS.length, index]);

  const currentBase = BASE_URLS[index] ?? BASE_URLS[0];

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-foreground">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentBase}
            src={isMobile ? slideUrl(currentBase, 480, 40) : slideUrl(currentBase, 1920, 75)}
            srcSet={
              !isMobile && isUnsplash(currentBase)
                ? `${slideUrl(currentBase, 1200, 70)} 1200w, ${slideUrl(currentBase, 1920, 75)} 1920w`
                : undefined
            }
            sizes={isMobile ? "480px" : "1920px"}
            alt=""
            aria-hidden="true"
            decoding="async"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
            crossOrigin={isMobile ? "anonymous" : undefined}
            width={isMobile ? 480 : 1920}
            height={isMobile ? 360 : 1280}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2, ease: "easeInOut" } }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
      </div>

      {BASE_URLS.length > 1 && (
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
