import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion } from "framer-motion";
import { heroImageProps } from "@/lib/hero-images";

export function HeroSlideshow({ initialImages = [], viewport = "mobile" }: { initialImages?: string[]; viewport?: "mobile" | "desktop" } = {}) {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<{ index: number; src: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [original, setOriginal] = useState(false);
  const firstRef = useRef<HTMLImageElement>(null);
  const cache = useRef(new Map<number, Promise<string | null>>());
  const loaded = useRef(new Map<number, string>());
  const requestId = useRef(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const base = initialImages[index];

  useEffect(() => {
    const mq = window.matchMedia(viewport === "mobile" ? "(max-width: 767px)" : "(min-width: 768px)");
    const update = () => setActive(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [viewport]);

  async function markFirstReady(img: HTMLImageElement) {
    if (!img.complete || img.naturalWidth === 0) return;
    try { await img.decode(); } catch { return; }
    loaded.current.set(0, img.currentSrc || img.src);
    setReady(true);
  }

  useEffect(() => {
    const img = firstRef.current;
    if (img) void markFirstReady(img);
  }, [active, original]);

  function prepare(target: number): Promise<string | null> {
    const existing = cache.current.get(target);
    if (existing) return existing;
    const source = initialImages[target];
    if (!source) return Promise.resolve(null);
    const promise = new Promise<string | null>((resolve) => {
      const img = new Image();
      let retried = false;
      img.fetchPriority = "low";
      img.decoding = "async";
      img.onload = async () => {
        try {
          await img.decode();
          const src = img.currentSrc || img.src;
          loaded.current.set(target, src);
          resolve(src);
        } catch { resolve(null); }
      };
      img.onerror = () => {
        if (retried) { resolve(null); return; }
        retried = true;
        img.removeAttribute("srcset");
        img.src = source;
      };
      const props = heroImageProps(source);
      img.sizes = props.sizes;
      img.srcset = props.srcSet;
      img.src = props.src;
    });
    cache.current.set(target, promise);
    return promise;
  }

  async function goTo(target: number, skipFailed = false) {
    if (!ready || !active || target === index || previous) return;
    const id = ++requestId.current;
    let next = target;
    for (let count = 0; count < initialImages.length - 1; count++) {
      const src = loaded.current.get(next) ?? await prepare(next);
      if (id !== requestId.current) return;
      if (src) {
        const current = loaded.current.get(index);
        if (current) setPrevious({ index, src: current });
        setIndex(next);
        return;
      }
      if (!skipFailed) return;
      next = (next + 1) % initialImages.length;
      if (next === index) return;
    }
  }

  useEffect(() => {
    if (!ready || !active || initialImages.length < 2) return;
    let cancelled = false;
    // Sequential, low-priority downloads only after the first photo has decoded.
    async function loadRemaining() {
      for (let step = 1; step < initialImages.length; step++) {
        if (cancelled) return;
        await prepare((index + step) % initialImages.length);
      }
    }
    void loadRemaining();
    const timer = window.setTimeout(() => { void goTo((index + 1) % initialImages.length, true); }, 4500);
    return () => { cancelled = true; window.clearTimeout(timer); requestId.current++; };
  }, [ready, active, index, initialImages]);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || initialImages.length < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    void goTo((index + (dx < 0 ? 1 : initialImages.length - 1)) % initialImages.length);
  };

  return (
    <>
      <div data-hero-ready={ready} data-hero-index={index} className="absolute inset-0 overflow-hidden bg-hero-fallback touch-pan-y select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipeStart.current = null; }}>
        {previous && <img src={previous.src} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
        {base && (index === 0 && !previous ? (
          <img ref={firstRef} {...(original ? { src: base } : heroImageProps(base))} alt="" aria-hidden="true" draggable={false} decoding="async" loading="eager" fetchPriority="high" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover" onLoad={(event) => { void markFirstReady(event.currentTarget); }} onError={() => { if (!original) setOriginal(true); }} />
        ) : (
          <motion.img key={index} src={loaded.current.get(index)} alt="" aria-hidden="true" draggable={false} decoding="async" loading="eager" fetchPriority="low" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ opacity: { duration: 1.2, ease: "easeInOut" } }} onAnimationComplete={() => setPrevious(null)} />
        ))}
        <div className="hero-image-overlay absolute inset-0" />
      </div>
      {initialImages.length > 1 && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {initialImages.map((_, i) => (
            <button key={i} type="button" onClick={() => { void goTo(i); }} aria-label={`Go to slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} />
          ))}
        </div>
      )}
    </>
  );
}
