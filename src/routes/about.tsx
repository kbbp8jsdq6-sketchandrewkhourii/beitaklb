import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Home, Eye, Instagram } from "lucide-react";

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

      {/* Premium split cards — Mission & Vision */}
      <section
        id="mission-vision"
        className="scroll-mt-20 border-b border-border bg-gradient-to-b from-primary/5 via-background to-muted/30"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Mission card */}
            <article
              id="mission"
              className="group relative scroll-mt-20 overflow-hidden rounded-2xl border-l-[5px] border-primary bg-white/15 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-[12px] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.18),0_0_24px_rgba(204,0,0,0.35)] sm:p-10"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
            >
              {/* Faded watermark icon */}
              <Home
                aria-hidden="true"
                strokeWidth={1.25}
                className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 text-[#CC0000] opacity-20 sm:h-72 sm:w-72"
              />
              <div className="relative">
                <p className="font-serif text-sm font-extrabold uppercase tracking-[0.35em] text-[#CC0000]">
                  Our MissioN
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                  Make every Lebanese stay effortless
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-900 sm:text-lg">
                  We exist to remove the friction between travelers and the most beautiful homes in
                  Lebanon. From mountain cabins in Bcharre to seaside villas in Tyre, every BEITAK
                  listing is curated, every host is real, and every booking happens directly — no
                  middlemen, no surprises.
                </p>
              </div>
            </article>

            {/* Vision card */}
            <article
              id="vision"
              className="group relative scroll-mt-20 overflow-hidden rounded-2xl border-l-[5px] border-primary bg-white/15 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-[12px] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.18),0_0_24px_rgba(204,0,0,0.35)] sm:p-10"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
            >
              {/* Faded watermark icon */}
              <Eye
                aria-hidden="true"
                strokeWidth={1.25}
                className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 text-[#CC0000] opacity-20 sm:h-72 sm:w-72"
              />
              <div className="relative">
                <p className="font-serif text-sm font-extrabold uppercase tracking-[0.35em] text-[#CC0000]">
                  Our Vision
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                  Lebanon's most loved stays platform
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-900 sm:text-lg">
                  We see a future where Lebanese hospitality reaches every corner of the world — where
                  hosts thrive and travelers fall in love with the country one home at a time. BEITAK
                  is building the platform that makes that future inevitable.
                </p>
              </div>
            </article>
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
