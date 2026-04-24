import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MessageCircle, Sparkles, Star, Instagram, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogoTransparent } from "@/components/LogoTransparent";
import { FindYourUnit } from "@/components/FindYourUnit";
import { ListingCard } from "@/components/ListingCard";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { supabase } from "@/integrations/supabase/client";
import aboutImage from "@/assets/about-guesthouse.jpg";
import { PatternBackground } from "@/components/PatternBackground";
import { Reveal } from "@/components/Reveal";
import { SectionDivider } from "@/components/SectionDivider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BEITAK — Find your perfect stay in Lebanon" },
      {
        name: "description",
        content:
          "Browse unique listings from trusted local hosts across Lebanon. Reserve via WhatsApp and discover stays in Beirut, Byblos, Bcharre and beyond.",
      },
      { property: "og:title", content: "BEITAK — Find your perfect stay in Lebanon" },
      {
        property: "og:description",
        content: "Unique stays across Lebanon. Home is closer than you think.",
      },
    ],
  }),
  component: HomePage,
});

async function fetchFeatured() {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, location, price_per_night, price_weekday, price_weekend, amenities, listing_photos(photo_url, display_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);
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
    };
  });
}

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

const REVIEWS = [
  { quote: "Amazing place, super clean and the host was incredible!", name: "Sarah", city: "Beirut" },
  { quote: "Best mountain view in Lebanon. We're already planning to come back.", name: "Karim", city: "Bcharre" },
  { quote: "Booking via WhatsApp made it so easy. Highly recommend!", name: "Nour", city: "Byblos" },
];

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
  const { data: featured = [], isLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: fetchFeatured,
  });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Magnetic cursor effect for hero logo — gently pulls toward cursor when within 150px.
  const magneticRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = magneticRef.current;
    if (!el) return;
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

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* 1. HERO */}
      <section className="relative">
        <div className="relative h-[88vh] min-h-[640px] w-full overflow-hidden">
          <HeroSlideshow />

          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <div ref={magneticRef} style={{ willChange: "transform" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -8, y: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                  scale: { type: "spring", stiffness: 120, damping: 12 },
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -12, 0],
                  }}
                  transition={{
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="hero-logo-stage"
                >
                  <div className="hero-logo-spin">
                    {/* Solid extruded thickness layers — sharp duplicates with darker tint */}
                    {Array.from({ length: 30 }).map((_, i) => {
                      // Center the stack so the front face sits at the highest Z
                      const z = (i - 29) * 1.2; // -34.8 → 0
                      // Darker shade for back layers, full color near the front
                      const darkness = 0.55 + (i / 29) * 0.45; // 0.55 → 1
                      return (
                        <div
                          key={i}
                          className="hero-logo-layer"
                          style={{
                            transform: `translateZ(${z}px)`,
                            filter: `brightness(${darkness}) saturate(${0.7 + (i / 29) * 0.3})`,
                          }}
                          aria-hidden={i !== 29}
                        >
                          <LogoTransparent size="hero" />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
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
            <motion.div
              className="mt-8 flex w-full max-w-md flex-row flex-wrap items-center justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-nowrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              <Link
                to="/search"
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-lg transition hover:bg-primary/90 sm:px-7 sm:py-3.5 sm:text-base"
              >
                Browse listings
              </Link>
              <a
                href={`https://wa.me/96181160435?text=${encodeURIComponent("Hi Beitak! I'm interested in listing my unit on your website. Could you help me get started?")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border-2 border-white bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur transition hover:bg-white hover:text-foreground sm:px-7 sm:py-3.5 sm:text-base"
              >
                Become a host
              </a>
            </motion.div>
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

      {/* 1.5 FIND YOUR UNIT */}
      <FindYourUnit />

      {/* 2. HOW IT WORKS */}
      <section className="relative border-b border-border bg-background">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">How it works</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Three steps to your stay
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                className="group relative rounded-2xl border border-border bg-card p-8 text-center transition hover:border-primary text-red-600"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-2xl text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED LISTINGS */}
      <section className="relative bg-muted/30">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Featured</p>
              <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
                Featured listings
              </h2>
              <p className="mt-2 text-muted-foreground">Handpicked stays from across Lebanon</p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-background p-12 text-center">
              <p className="font-display text-2xl">No listings yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Check back soon — new stays are added regularly.</p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-md border-2 border-foreground bg-transparent px-7 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background"
            >
              View all listings →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. REVIEWS */}
      <section className="relative border-y border-border bg-background">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Reviews</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Loved by guests
            </h2>
          </div>
          <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 hide-scrollbar">
            {REVIEWS.map((r) => (
              <figure
                key={r.name}
                className="w-[85%] shrink-0 snap-center rounded-2xl border border-border bg-card p-7 sm:w-auto sm:shrink"
              >
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary" />
                  ))}
                </div>
                <blockquote className="mt-4 text-lg text-foreground">“{r.quote}”</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-foreground">
                  — {r.name}, <span className="text-muted-foreground">{r.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ABOUT */}
      <section id="about" className="relative bg-background scroll-mt-20">
        <PatternBackground />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">About us</p>
            <h2 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">
              We're <span className="text-primary">BEITAK</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/80">
              BEITAK connects travelers with unique local stays across Lebanon. Whether you're hosting
              or exploring, we make the experience simple, personal, and memorable.
            </p>

            <div id="mission" className="mt-8 scroll-mt-24 rounded-2xl border-l-4 border-primary bg-primary/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Our Mission</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/80">
                Make every Lebanese stay effortless — connecting travelers directly with curated
                hosts, with no middlemen and no surprises.
              </p>
            </div>

            <div id="vision" className="mt-4 scroll-mt-24 rounded-2xl border-l-4 border-foreground bg-muted/40 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-foreground">Our Vision</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/80">
                To become Lebanon's most loved stays platform — where hosts thrive and travelers
                fall in love with the country, one home at a time.
              </p>
            </div>

            <p className="mt-6 font-display text-3xl uppercase tracking-wider text-primary">
              Home is closer than you think
            </p>
          </div>
          <div className="relative lg:scale-110 lg:-mx-6">
            <div className="relative overflow-hidden rounded-3xl">
              <img
                src={aboutImage}
                alt="Lebanese guesthouse with pool surrounded by palms"
                width={1024}
                height={896}
                loading="lazy"
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
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="relative border-t border-border bg-muted/30">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">FAQ</p>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Frequently asked
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
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
                </div>
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
