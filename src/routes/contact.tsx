import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Instagram, MessageCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — BEITAK" },
      { name: "description", content: "Get in touch with BEITAK. We're here to help." },
      { property: "og:title", content: "Contact BEITAK" },
      { property: "og:description", content: "Get in touch with the BEITAK team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">Say hello</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Detailed contact options are coming soon. For now, reach us through any of the channels
          below — we typically reply within a few hours.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="https://wa.me/96181160435"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <MessageCircle className="h-8 w-8 text-primary" />
            <p className="font-semibold">WhatsApp</p>
            <p className="text-xs text-muted-foreground">+961 81 160 435</p>
          </a>
          <a
            href="https://instagram.com/beitak.lb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <Instagram className="h-8 w-8 text-primary" />
            <p className="font-semibold">Instagram</p>
            <p className="text-xs text-muted-foreground">@beitak.lb</p>
          </a>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-6">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Email</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
