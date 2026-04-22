import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MessageCircle, Sparkles, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/become-a-host")({
  head: () => ({
    meta: [
      { title: "Become a host — BEITAK" },
      {
        name: "description",
        content:
          "List your Lebanese home on BEITAK. Reach travelers from around the world, with zero booking fees.",
      },
      { property: "og:title", content: "Become a BEITAK host" },
      {
        property: "og:description",
        content: "Open your doors. List your home on BEITAK and start hosting today.",
      },
    ],
  }),
  component: BecomeHostPage,
});

const PERKS = [
  { icon: Users, title: "Reach travelers", desc: "Get discovered by guests across Lebanon and beyond." },
  { icon: ShieldCheck, title: "No fees", desc: "Bookings happen direct via WhatsApp — no commissions." },
  { icon: Sparkles, title: "Curated platform", desc: "Each listing is personally onboarded by our team." },
];

function BecomeHostPage() {
  const message = encodeURIComponent(
    "Hi BEITAK! I'd like to list my place on your website. Can you help me get started?",
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Become a host</p>
          <h1 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">
            Open your <span className="text-primary">doors</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            List your villa, cabin, or apartment on BEITAK. Our team handles onboarding so your
            listing looks its best — you handle the welcomes.
          </p>
          <a
            href={`https://wa.me/96181160435?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-7 py-3.5 text-base font-bold uppercase tracking-wide text-primary-foreground shadow-lg transition hover:bg-primary/90"
          >
            <MessageCircle className="h-5 w-5" /> Start on WhatsApp
          </a>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          {PERKS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 text-center transition hover:border-primary"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <p.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-display text-xl">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">
            Already onboarded?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sign in to your host account to manage your listings.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center justify-center rounded-md border-2 border-foreground bg-transparent px-7 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background"
          >
            Sign in
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
