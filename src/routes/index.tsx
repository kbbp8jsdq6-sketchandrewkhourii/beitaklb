import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MessageCircle, Sparkles, ChevronDown, Heart } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogoTransparent } from "@/components/LogoTransparent";
import { FindYourUnit } from "@/components/FindYourUnit";
import { HeroSlideshow } from "@/components/HeroSlideshow";

import { PatternBackground } from "@/components/PatternBackground";
import { Reveal } from "@/components/Reveal";
import { SectionDivider } from "@/components/SectionDivider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";

const DesktopHero = lazy(() => import("@/components/home/DesktopHero"));

async function fetchFeaturedListings(): Promise<ListingCardData[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, location, price_per_night, price_weekday, price_weekend, amenities, max_guests, listing_photos(photo_url, display_order)")
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
      max_guests: l.max_guests ?? null,
      cover: photos[0]?.photo_url ?? null,
      photos: photos.map((p) => p.photo_url),
    };
  });
}

async function fetchHeroImages(): Promise<string[]> {
  const { data, error } = await supabase
    .from("hero_images")
    .select("url")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => r.url as string);
}

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => ({
    meta: [
      { title: "Beitak - Find Your Perfect Stay" },
      {
        name: "description",
        content:
          "Browse unique listings from trusted local hosts across Lebanon. Reserve via WhatsApp and discover stays in Beirut, Byblos, Bcharre and beyond.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Beitak - Find Your Perfect Stay in Lebanon" },
      {
        property: "og:description",
        content: "Browse unique listings from trusted local hosts across Lebanon.",
      },
      { property: "og:url", content: "https://beitaklb.com/" },
      { property: "og:image", content: "https://beitaklb.com/og-image.jpg" },
      { name: "twitter:image", content: "https://beitaklb.com/og-image.jpg" },
    ],
    links:
      loaderData?.heroImages?.[0]
        ? [
            {
              rel: "preload",
              as: "image",
              href: loaderData.heroImages[0],
              fetchpriority: "high",
            } as unknown as { rel: string; href: string },
          ]
        : [],
  }),
  loader: async () => {
    const [featuredListings, heroImages] = await Promise.all([
      fetchFeaturedListings(),
      fetchHeroImages(),
    ]);
    return { featuredListings, heroImages };
  },
  component: HomePage,
});

const DISTRICTS = [
  { name: "Batroun", search: { district: "Batroun" }, bg: "linear-gradient(135deg, #0c2340 0%, #1a4a6e 50%, #2d8a9e 100%)", image: "/batroun.webp" },
  { name: "Chouf", search: { district: "Chouf" }, bg: "linear-gradient(135deg, #1a3c2a 0%, #2d5a3d 50%, #5a8a5c 100%)", image: "/chouf.webp" },
  { name: "Keserwan", search: { district: "Keserwan" }, bg: "linear-gradient(135deg, #3a2a1a 0%, #6b4423 50%, #a0522d 100%)", image: "/keserwan.webp" },
  { name: "North Lebanon", search: { district: "North Lebanon" }, bg: "linear-gradient(135deg, #1a1a3a 0%, #3a3a6a 50%, #5a5a9a 100%)", image: "/north-lebanon.webp" },
  { name: "Byblos", search: { district: "Byblos" }, bg: "linear-gradient(135deg, #5a4a2a 0%, #8b7355 50%, #c9a84c 100%)", image: "/byblos.webp" },
  { name: "Aley", search: { district: "Aley" }, bg: "linear-gradient(135deg, #2a3c3a 0%, #4a6a5a 50%, #7a9a8a 100%)", image: "/aley.webp" },
  { name: "Maten", search: { district: "Maten" }, bg: "linear-gradient(135deg, #3a4a2a 0%, #5a7a4a 50%, #8aaa6a 100%)", image: "/__l5e/assets-v1/16670cbd-70d9-4c38-941d-55f0dd918a2f/maten.jpg" },
  { name: "Baabda", search: { district: "Baabda" }, bg: "linear-gradient(135deg, #3a2a2a 0%, #5a3a3a 50%, #8b6f5e 100%)", image: "/baabda.webp" },
  { name: "Couples", search: { bedrooms: 1 }, bg: "linear-gradient(135deg, #4a1520 0%, #7a2535 50%, #c0392b 100%)", image: "/couples.webp", icon: true },
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

const ReviewsSection = lazy(() => import("@/components/home/ReviewsSection"));
const ListingsMapSection = lazy(() => import("@/components/home/ListingsMapSection"));

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
  const { featuredListings: initialFeatured, heroImages } = Route.useLoaderData();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { data: featuredListings = [] } = useQuery({
    queryKey: ["home-featured-listings"],
    staleTime: 2 * 60_000,
    initialData: initialFeatured,
    queryFn: fetchFeaturedListings,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* 1. HERO — mobile-first: mobile block always mounted; desktop hero only mounted after JS confirms desktop breakpoint */}
      <div className="block md:hidden">
        <section className="relative">
          <div className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-foreground">
            <HeroSlideshow initialImages={heroImages} />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pb-20 text-center">
              <LogoTransparent size="hero" />
              <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] text-white drop-shadow-lg">
                Find your perfect stay in Lebanon
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/90">
                Browse unique listings from trusted local hosts.
              </p>
              <p className="mt-8 text-xs uppercase tracking-[0.4em] text-primary">
                Home is closer than you think
              </p>
            </div>
          </div>
        </section>
      </div>
      {isDesktop && (
        <div className="hidden md:block">
          <Suspense fallback={null}>
            <DesktopHero initialImages={heroImages} />
          </Suspense>
        </div>
      )}

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
                  {/* Photo layer */}
                  {d.image ? (
                    <img
                      src={d.image}
                      alt={d.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                      style={{ background: d.bg }}
                    />
                  )}
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

      <SectionDivider fill="var(--color-background)" flip />
      <Suspense fallback={null}>
        <ListingsMapSection />
      </Suspense>
      <SectionDivider fill="var(--color-background)" flip />



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
                {featuredListings.map((l: ListingCardData, i: number) => (
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
      <Suspense fallback={<div className="h-64" />}>
        <ReviewsSection />
      </Suspense>

      <SectionDivider fill="var(--color-background)" flip />

      {/* 5. ABOUT */}
      <section id="about" className="relative bg-background scroll-mt-20">
        <PatternBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-14 pt-[72px] md:px-12 md:pb-20 md:pt-28 lg:px-16">
          <Reveal>
            <p className="text-sm font-semibold text-[#CC0000] md:text-[15px]">About us</p>
            <h2 className="mt-5 font-display text-[88px] leading-[0.88] tracking-[0.01em] text-foreground md:text-[112px] lg:text-[136px]">
              We're BEITAK
            </h2>
          </Reveal>
        </div>
      </section>

      {/* 5.5 MISSION & VISION */}
      <section aria-label="Our mission and vision" className="grid grid-cols-1 md:grid-cols-2">
        <article
          id="mission"
          className="flex scroll-mt-24 flex-col justify-center bg-background px-6 py-16 md:min-h-[560px] md:px-12 md:py-24 lg:px-16"
        >
          <Reveal className="w-full md:ml-auto md:max-w-[36rem]">
            <p className="text-sm font-semibold text-[#CC0000] md:text-[15px]">Our mission</p>
            <h3 className="mt-4 max-w-[9.5em] font-display text-[52px] leading-[0.95] tracking-[0.01em] text-foreground md:mt-6 md:text-[64px] lg:text-[76px]">
              Make every Lebanese stay effortless.
            </h3>
            <p className="mt-4 max-w-[30em] text-base leading-relaxed text-[#4A4444] md:mt-6 md:text-lg">
              We connect travelers directly with curated hosts, with no middlemen and no surprises.
            </p>
          </Reveal>
        </article>
        <article
          id="vision"
          className="relative flex scroll-mt-24 flex-col justify-center overflow-hidden bg-[#161212] px-6 pb-[88px] pt-16 md:min-h-[560px] md:px-12 md:py-24 lg:px-16"
        >
          <span
            aria-hidden="true"
            lang="ar"
            dir="rtl"
            className="pointer-events-none absolute -bottom-11 -right-4 select-none font-['Noto_Kufi_Arabic',sans-serif] text-[160px] font-bold leading-none text-[#2A1818] md:-bottom-[72px] md:-right-6 md:text-[280px]"
          >
            بيتك
          </span>
          <Reveal delay={120} className="relative w-full md:mr-auto md:max-w-[36rem]">
            <p className="text-sm font-semibold text-[#FF7A70] md:text-[15px]">Our vision</p>
            <h3 className="mt-4 max-w-[9.5em] font-display text-[52px] leading-[0.95] tracking-[0.01em] text-white md:mt-6 md:text-[64px] lg:text-[76px]">
              To become Lebanon's most loved stays platform.
            </h3>
            <p className="mt-4 max-w-[30em] text-base leading-relaxed text-[#C9C2C2] md:mt-6 md:text-lg">
              Where hosts thrive and travelers fall in love with the country, one home at a time.
            </p>
          </Reveal>
        </article>
      </section>

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
