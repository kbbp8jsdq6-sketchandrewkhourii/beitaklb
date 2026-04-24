import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Target, Eye, Instagram } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — BEITAK" },
      {
        name: "description",
        content:
          "Learn about BEITAK's mission and vision: making it effortless to discover unique stays across Lebanon.",
      },
      { property: "og:title", content: "About BEITAK" },
      {
        property: "og:description",
        content:
          "Our MissioN and vision — connecting travelers with the most unique homes across Lebanon.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.3em] text-primary text-base font-serif px-0 mx-0 text-left font-extrabold">About us</p>
          <h1 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">
            We're <span className="text-primary">BEITAK</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-foreground/80">
            BEITAK connects travelers with unique local stays across Lebanon. Whether you're hosting
            or exploring, we make the experience simple, personal, and memorable.
          </p>
          <a
            href="https://instagram.com/beitak.lb"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition hover:text-[#E1306C]"
          >
            <Instagram className="h-5 w-5" /> instagram.com/beitak.lb
          </a>
        </div>
      </section>

      <section
        id="mission"
        className="scroll-mt-20 border-b border-border bg-background"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-12 items-center gap-6 md:gap-10">
            {/* Text block — left aligned, ~60% width */}
            <div className="col-span-12 md:col-span-7 md:col-start-1 border-l-4 border-primary pl-6 md:pl-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <Target className="h-7 w-7" strokeWidth={1.6} />
                </div>
                <p className="uppercase tracking-[0.3em] text-primary text-base font-serif px-0 mx-0 text-left font-extrabold">Our MissioN</p>
              </div>
              <h2 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
                Our<br />MissioN
              </h2>
              <p className="mt-6 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                Make every Lebanese stay effortless
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">
                We exist to remove the friction between travelers and the most beautiful homes in
                Lebanon. From mountain cabins in Bcharre to seaside villas in Tyre, every BEITAK
                listing is curated, every host is real, and every booking happens directly — no
                middlemen, no surprises.
              </p>
            </div>

            {/* Oversized decorative numeral */}
            <div className="col-span-12 md:col-span-5 md:col-start-8 flex justify-center md:justify-end">
              <span
                aria-hidden="true"
                className="select-none font-display text-[10rem] font-black leading-none tracking-tighter text-primary/10 sm:text-[14rem] md:text-[18rem] lg:text-[22rem]"
              >
                01
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial divider */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <hr className="border-t border-foreground/15" />
      </div>

      <section id="vision" className="scroll-mt-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-12 items-center gap-6 md:gap-10">
            {/* Oversized decorative numeral on left (desktop) */}
            <div className="order-2 col-span-12 md:order-1 md:col-span-5 md:col-start-1 flex justify-center md:justify-start">
              <span
                aria-hidden="true"
                className="select-none font-display text-[10rem] font-black leading-none tracking-tighter text-primary/10 sm:text-[14rem] md:text-[18rem] lg:text-[22rem]"
              >
                02
              </span>
            </div>

            {/* Text block — right aligned, ~60% width */}
            <div className="order-1 col-span-12 md:order-2 md:col-span-7 md:col-start-6 border-l-4 border-primary pl-6 md:pl-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-background text-primary shadow-lg">
                  <Eye className="h-7 w-7" strokeWidth={1.6} />
                </div>
                <p className="uppercase tracking-[0.3em] text-primary text-base font-serif px-0 mx-0 text-left font-extrabold">Our Vision</p>
              </div>
              <h2 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
                Our<br />Vision
              </h2>
              <p className="mt-6 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                Lebanon's most loved stays platform
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">
                We see a future where Lebanese hospitality reaches every corner of the world — where
                hosts thrive and travelers fall in love with the country one home at a time. BEITAK
                is building the platform that makes that future inevitable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="font-display text-3xl uppercase tracking-wider text-primary">
            Home is closer than you think
          </p>
          <Link
            to="/search"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-7 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            Explore listings
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
