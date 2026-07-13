import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LogoTransparent } from "@/components/LogoTransparent";
import { HeroSlideshow } from "@/components/HeroSlideshow";

export default function DesktopHero({ initialImages }: { initialImages?: string[] } = {}) {
  // Magnetic cursor effect for hero logo — gently pulls toward cursor when within 150px.
  // Disabled on touch / mobile devices for performance.
  const magneticRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = magneticRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse), (max-width: 768px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const RANGE = 150;
    const STRENGTH = 0.25;
    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const animate = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = 0;
      }
    };

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RANGE) {
        const falloff = 1 - dist / RANGE;
        targetX = dx * STRENGTH * falloff;
        targetY = dy * STRENGTH * falloff;
      } else {
        targetX = 0;
        targetY = 0;
      }
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    const handleLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const heroParallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroParallaxRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse), (max-width: 768px)").matches) return;
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      el.style.setProperty("--hero-parallax", `${y * 0.35}px`);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative">
      <div className="relative h-[100vh] min-h-[640px] w-full overflow-hidden">
        <div ref={heroParallaxRef} className="hero-parallax absolute inset-0">
          <HeroSlideshow />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
          <div ref={magneticRef} style={{ willChange: "transform" }} className="relative">
            <div className="hero-logo-aura" aria-hidden="true" />
            <div className="hero-particles" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => {
                const isRed = i % 2 === 0;
                const size = 4 + ((i * 3) % 5);
                const left = (i * 97) % 100;
                const delay = (i * 0.7) % 6;
                const duration = 5 + ((i * 1.3) % 4);
                return (
                  <span
                    key={i}
                    className="hero-particle"
                    style={{
                      left: `${left}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      background: isRed ? "rgba(230,48,48,0.85)" : "rgba(255,255,255,0.85)",
                      boxShadow: isRed
                        ? "0 0 8px rgba(230,48,48,0.8)"
                        : "0 0 8px rgba(255,255,255,0.8)",
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                    }}
                  />
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -8, y: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
                scale: { type: "spring", stiffness: 120, damping: 12 },
              }}
            >
              <div className="hero-logo-float">
                <div className="hero-logo-breathe">
                  <div className="hero-logo-glow">
                    <div className="hero-logo-stage">
                      <div className="hero-logo-spin">
                        {Array.from({ length: 8 }).map((_, i) => {
                          const total = 8;
                          const z = (i - (total - 1)) * 1.2;
                          const darkness = 0.55 + (i / (total - 1)) * 0.45;
                          const sat = 0.7 + (i / (total - 1)) * 0.3;
                          return (
                            <div
                              key={i}
                              className="hero-logo-layer"
                              style={{
                                transform: `translateZ(${z}px)`,
                                filter: `brightness(${darkness}) saturate(${sat})`,
                              }}
                              aria-hidden={i !== total - 1}
                            >
                              <LogoTransparent size="hero" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.h1
            className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] text-white drop-shadow-lg sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            Find your perfect stay in Lebanon
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-base text-white/90 sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          >
            Browse unique listings from trusted local hosts.
          </motion.p>
          <motion.p
            className="mt-8 text-xs uppercase tracking-[0.4em] text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
          >
            Home is closer than you think
          </motion.p>
        </div>
      </div>
    </section>
  );
}
