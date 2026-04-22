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
          "Our mission and vision — connecting travelers with the most unique homes across Lebanon.",
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
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">About us</p>
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
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[auto_1fr] lg:px-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Target className="h-10 w-10" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Our Mission</p>
            <h2 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
              Make every Lebanese stay effortless
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/80">
              We exist to remove the friction between travelers and the most beautiful homes in
              Lebanon. From mountain cabins in Bcharre to seaside villas in Tyre, every BEITAK
              listing is curated, every host is real, and every booking happens directly — no
              middlemen, no surprises.
            </p>
          </div>
        </div>
      </section>

      <section id="vision" className="scroll-mt-20 bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[auto_1fr] lg:px-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary bg-background text-primary shadow-lg">
            <Eye className="h-10 w-10" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Our Vision</p>
            <h2 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
              Lebanon's most loved stays platform
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/80">
              We see a future where Lebanese hospitality reaches every corner of the world — where
              hosts thrive and travelers fall in love with the country one home at a time. BEITAK
              is building the platform that makes that future inevitable.
            </p>
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
