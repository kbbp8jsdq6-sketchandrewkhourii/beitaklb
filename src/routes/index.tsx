import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MessageCircle, Sparkles, Star, Instagram, ChevronDown, Heart } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogoTransparent } from "@/components/LogoTransparent";
import { FindYourUnit } from "@/components/FindYourUnit";
import { HeroSlideshow } from "@/components/HeroSlideshow";

import aboutImage from "@/assets/about-guesthouse.jpg";
import { PatternBackground } from "@/components/PatternBackground";
import { Reveal } from "@/components/Reveal";
import { SectionDivider } from "@/components/SectionDivider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beitak - Find Your Perfect Stay" },
      {
        name: "description",
        content:
          "Browse unique listings from trusted local hosts across Lebanon. Reserve via WhatsApp and discover stays in Beirut, Byblos, Bcharre and beyond.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Beitak — Find Your Perfect Stay in Lebanon" },
      {
        property: "og:description",
        content: "Browse unique listings from trusted local hosts across Lebanon.",
      },
      { property: "og:url", content: "https://beitaklb.com/" },
      { property: "og:image", content: "https://beitaklb.com/og-image.jpg" },
      { name: "twitter:image", content: "https://beitaklb.com/og-image.jpg" },
    ],
  }),
  component: HomePage,
});

const DISTRICTS = [
  { name: "Batroun", search: { district: "Batroun" }, bg: "linear-gradient(135deg, #0c2340 0%, #1a4a6e 50%, #2d8a9e 100%)", image: "/batroun.jpg" },
  { name: "Chouf", search: { district: "Chouf" }, bg: "linear-gradient(135deg, #1a3c2a 0%, #2d5a3d 50%, #5a8a5c 100%)", image: "/chouf.jpg" },
  { name: "Keserwan", search: { district: "Keserwan" }, bg: "linear-gradient(135deg, #3a2a1a 0%, #6b4423 50%, #a0522d 100%)", image: "/keserwan.jpg" },
  { name: "North Lebanon", search: { district: "North Lebanon" }, bg: "linear-gradient(135deg, #1a1a3a 0%, #3a3a6a 50%, #5a5a9a 100%)", image: "/north-lebanon.jpg" },
  { name: "Byblos", search: { district: "Byblos" }, bg: "linear-gradient(135deg, #5a4a2a 0%, #8b7355 50%, #c9a84c 100%)", image: "/byblos.jpg" },
  { name: "Aley", search: { district: "Aley" }, bg: "linear-gradient(135deg, #2a3c3a 0%, #4a6a5a 50%, #7a9a8a 100%)", image: "/aley.jpg" },
  { name: "Maten", search: { district: "Maten" }, bg: "linear-gradient(135deg, #3a4a2a 0%, #5a7a4a 50%, #8aaa6a 100%)", image: "/__l5e/assets-v1/16670cbd-70d9-4c38-941d-55f0dd918a2f/maten.jpg" },
  { name: "Baabda", search: { district: "Baabda" }, bg: "linear-gradient(135deg, #3a2a2a 0%, #5a3a3a 50%, #8b6f5e 100%)", image: "/baabda.jpg" },
  { name: "Couples", search: { bedrooms: 1 }, bg: "linear-gradient(135deg, #4a1520 0%, #7a2535 50%, #c0392b 100%)", image: "/couples.jpg", icon: true },
];

const STEPS = [
  {
    icon: Search,
    title: "Browse listings",
    desc: "Explore unique stays across Lebanon's most beautiful regions.",
  },
  {
    icon: MessageCircle,
    title: "Reserve via WhatsApp",
    desc: "Contact the host instantly to confirm dates and details.",
  },
  {
    icon: Sparkles,
    title: "Enjoy your stay",
    desc: "Check in, unwind, and make memories that last.",
  },
];

import { STATIC_REVIEWS, HOME_REVIEW_SLUGS } from "@/lib/static-reviews";

const HOME_REVIEWS = HOME_REVIEW_SLUGS
  .map((slug) => STATIC_REVIEWS.find((r) => r.slug === slug)!)
  .filter(Boolean);

const FAQS = [
  {
    q: "How do I book a listing?",
    a: "Open any listing, then tap “Reserve via WhatsApp” to chat directly with the host about dates, guests and pricing.",
  },
  {
    q: "How do I become a host?",
    a: "Reach out to us on WhatsApp and we'll guide you through listing your place. Listings are added by the BEITAK team to keep the experience curated.",
  },
  {
    q: "Is my payment secure?",
    a: "Payment is arranged directly with your host. We recommend confirming all details over WhatsApp before transferring.",
  },
  {
    q: "How do I contact the host?",
    a: "Every listing has a “Reserve via WhatsApp” button that opens a pre-filled message to the host with the listing link.",
  },
];

function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // Detect mobile to render a static single-layer logo instead of the
  // expensive 30-layer 3D extrusion. Defaults to false so SSR matches desktop.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Magnetic cursor effect for hero logo — gently pulls toward cursor when within 150px.
  // Disabled on touch / mobile devices for performance.
  const magneticRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = magneticRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    // Skip magnetic effect entirely on coarse pointer (mobile/tablet) devices.
    if (window.matchMedia("(pointer: coarse), (max-width: 768px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const RANGE = 150; // px
    const STRENGTH = 0.25; // how strongly the logo follows the cursor
    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const animate = () => {
      // Smooth easing toward target
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
        // Inside range — fall-off so closer pulls more
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

  // Hero parallax — translate the slideshow background slower than scroll
  // for a luxurious, cinematic depth effect. Updates a CSS var on the
  // element so the actual transform stays GPU-accelerated.
  // Disabled on mobile / coarse pointers and when the user prefers reduced motion.
  const heroParallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroParallaxRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Skip parallax on touch / mobile devices for performance.
    if (window.matchMedia("(pointer: coarse), (max-width: 768px)").matches) return;
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      // Move at 35% of scroll speed — subtle but noticeable.
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


  const { data: featuredListings = [] } = useQuery({
    queryKey: ["home-featured-listings"],
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, location, price_per_night, price_weekday, price_weekend, amenities, listing_photos(photo_url, display_order)")
        .eq("is_active", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []).map((l) => {
        const photos = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
        return {
          id: l.id,
          title: l.title,
          location: l.location,
          price_per_night: Number(l.price_per_night),
          price_weekday: Number(l.price_weekday),
          price_weekend: Number(l.price_weekend),
          amenities: l.amenities ?? [],
          cover: photos[0]?.photo_url ?? null,
          photos: photos.map((p) => p.photo_url),
        };
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* 1. HERO — full-screen cinematic with subtle parallax */}
      <section className="relative">
        <div className="relative h-[100vh] min-h-[640px] w-full overflow-hidden">
          <div ref={heroParallaxRef} className="hero-parallax absolute inset-0">
            <HeroSlideshow />
          </div>
          {/* Extra premium dark gradient overlay for cinematic readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />


          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
            <div ref={magneticRef} style={{ willChange: isMobile ? "auto" : "transform" }} className="relative">
              {/* Atmospheric red radial gradient behind the logo only */}
              <div className="hero-logo-aura" aria-hidden="true" />
              {/* Floating particles around the logo (4 on mobile, 10 on desktop) */}
              <div className="hero-particles" aria-hidden="true">
                {Array.from({ length: isMobile ? 0 : 6 }).map((_, i) => {
                  const isRed = i % 2 === 0;
                  const size = 4 + ((i * 3) % 5); // 4..8px
                  const left = (i * 97) % 100;
                  const delay = (i * 0.7) % 6;
                  const duration = 5 + ((i * 1.3) % 4); // 5..9s
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
                          {Array.from({ length: isMobile ? 1 : 8 }).map((_, i) => {
                            const total = isMobile ? 1 : 8;
                            const z = (i - (total - 1)) * 1.2;
                            const darkness = total === 1 ? 1 : 0.55 + (i / (total - 1)) * 0.45;
                            const sat = total === 1 ? 1 : 0.7 + (i / (total - 1)) * 0.3;
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

      {/* CTA BAR — sits below the hero so buttons are never cut off */}
      <section className="relative bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-10 sm:flex-row sm:gap-4 sm:py-12">
          <Link
            to="/search"
            className="inline-flex w-full shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-lg transition hover:bg-primary/90 sm:w-auto sm:text-base"
          >
            Browse listings
          </Link>
          <a
            href={`https://wa.me/96181160435?text=${encodeURIComponent("Hi Beitak! I'm interested in listing my unit on your website. Could you help me get started?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full shrink-0 items-center justify-center whitespace-nowrap rounded-md border-2 border-foreground bg-transparent px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background sm:w-auto sm:text-base"
          >
            Become a host
          </a>
        </div>
      </section>

      {/* 1.5 FIND YOUR UNIT */}
      <FindYourUnit />

      <SectionDivider fill="var(--color-background)" flip />


      {/* 3. EXPLORE BY DISTRICT */}
      <section className="relative bg-muted/30">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Discover</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Explore by District
            </h2>
            <p className="mt-2 text-muted-foreground">Find stays in your favorite Lebanese region</p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DISTRICTS.map((d, i) => (
              <Reveal key={d.name} delay={i * 100}>
                <Link
                  to="/search"
                  search={d.search}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
                >
                  {/* Background placeholder */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={d.image ? { backgroundImage: `url(${d.image})` } : { background: d.bg }}
                  />
                  {/* Subtle texture overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    }}
                  />
                  {/* Bottom gradient for text readability */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="flex items-center gap-2">
                      {d.icon && <Heart className="h-4 w-4 text-primary" />}
                      <h3 className="font-display text-2xl tracking-wide text-white drop-shadow-lg">
                        {d.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/80">
                      {d.icon ? "1 bedroom stays" : "Browse listings"}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 flex justify-center" delay={150}>
            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-md border-2 border-foreground bg-transparent px-7 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background"
            >
              View all listings →
            </Link>
          </Reveal>
        </div>
      </section>

      <SectionDivider fill="var(--color-muted)" />

      {/* 2. HOW IT WORKS */}
      <section className="relative border-b border-border bg-background">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">How it works</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Three steps to your stay
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal
                key={s.title}
                delay={i * 120}
                className="group relative rounded-2xl border border-border bg-card p-8 text-center transition hover:border-primary text-red-600"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-2xl text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3.5 FEATURED LISTINGS */}
      {featuredListings.length > 0 && (
        <>
          <SectionDivider fill="var(--color-background)" flip />
          <section className="relative bg-muted/30">
            <PatternBackground />
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <Reveal className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Handpicked</p>
                <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
                  Featured Stays
                </h2>
                <p className="mt-2 text-muted-foreground">Our favorite picks across Lebanon</p>
              </Reveal>
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredListings.map((l, i) => (
                  <div key={l.id}>
                    <ListingCard
                      listing={l as ListingCardData}
                      index={i}
                    />
                  </div>
                ))}
              </div>
              <Reveal className="mt-10 flex justify-center" delay={150}>
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center rounded-md border-2 border-foreground bg-transparent px-7 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background"
                >
                  View all listings →
                </Link>
              </Reveal>
            </div>
          </section>
        </>
      )}


      {/* 4. REVIEWS */}
      <section className="relative border-y border-border bg-background">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Reviews</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Loved by guests
            </h2>
          </Reveal>
          <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 hide-scrollbar">
            {HOME_REVIEWS.map((r, i) => (
              <Reveal
                key={r.slug}
                delay={i * 130}
                as="figure"
                className="w-[85%] shrink-0 snap-center rounded-2xl border border-border bg-card p-7 sm:w-auto sm:shrink"
              >
                <div className="flex gap-1 text-[#F5B400]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < r.rating ? "fill-[#F5B400] text-[#F5B400]" : "fill-none text-muted-foreground/40"}`}
                    />
                  ))}
                </div>
                <blockquote className="mt-4 text-lg text-foreground">"{r.message}"</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-foreground">
                  —{" "}
                  <Link
                    to="/profile/$slug"
                    params={{ slug: r.slug }}
                    className="underline decoration-transparent underline-offset-4 transition hover:text-primary hover:decoration-primary"
                  >
                    {r.name}
                  </Link>
                </figcaption>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              to="/feedback"
              className="inline-flex items-center justify-center rounded-full bg-[#E63030] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#cc2626] hover:shadow-lg"
            >
              See all reviews
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider fill="var(--color-background)" flip />

      {/* 5. ABOUT */}
      <section id="about" className="relative bg-background scroll-mt-20">
        <PatternBackground />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal>
            <p className="uppercase tracking-[0.3em] text-primary text-base font-serif px-0 mx-0 text-left font-extrabold">About us</p>
            <h2 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">
              We're <span className="text-primary">BEITAK</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/80">
              BEITAK connects travelers with unique local stays across Lebanon. Whether you're hosting
              or exploring, we make the experience simple, personal, and memorable.
            </p>

            <div id="mission" className="mt-8 scroll-mt-24 rounded-2xl border-l-4 border-primary bg-primary/5 p-5">
              <p className="uppercase tracking-[0.3em] text-primary text-base font-serif px-0 mx-0 text-left font-extrabold">Our Mission</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/80 text-black">
                Make every Lebanese stay effortless — connecting travelers directly with curated
                hosts, with no middlemen and no surprises.
              </p>
            </div>

            <div id="vision" className="mt-4 scroll-mt-24 rounded-2xl border-l-4 border-foreground bg-muted/40 p-5">
              <p className="uppercase tracking-[0.3em] text-foreground font-extrabold text-base font-serif">Our Vision</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/80 text-black">
                To become Lebanon's most loved stays platform — where hosts thrive and travelers
                fall in love with the country, one home at a time.
              </p>
            </div>

            <p className="mt-6 font-display text-3xl uppercase tracking-wider text-primary">
              Home is closer than you think
            </p>
          </Reveal>
          <Reveal delay={150} className="relative lg:scale-110 lg:-mx-6">
            <div className="relative overflow-hidden rounded-3xl">
              <img
                src={aboutImage}
                alt="Lebanese guesthouse with pool surrounded by palms"
                width={1024}
                height={896}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse at center, black 75%, transparent 100%)",
                  maskImage:
                    "radial-gradient(ellipse at center, black 75%, transparent 100%)",
                }}
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-primary px-6 py-4 text-primary-foreground shadow-xl sm:block opacity-0">
              <p className="font-display text-2xl tracking-wider">BEITAK</p>
              <p className="text-[10px] uppercase tracking-[0.3em]">Lebanon stays</p>
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider fill="var(--color-background)" />

      {/* 6. FAQ */}
      <section id="faq" className="relative border-t border-border bg-muted/30">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">FAQ</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Frequently asked
            </h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <Reveal
                  key={item.q}
                  delay={i * 90}
                  className="overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary/50"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-semibold text-foreground">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-primary transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <Footer />
    </div>
  );
}
