import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — BEITAK" },
      {
        name: "description",
        content: "Share your feedback with the BEITAK team. We're listening.",
      },
      { property: "og:title", content: "Feedback — BEITAK" },
      { property: "og:description", content: "Help us improve BEITAK." },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-primary">Feedback</p>
        <h1 className="mt-2 font-display text-5xl text-foreground sm:text-6xl">
          We're listening
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A dedicated feedback form is on its way. Until then, reach out directly on WhatsApp — your
          ideas, complaints, and love letters all welcome.
        </p>
        <a
          href="https://wa.me/96181160435?text=Hi%20BEITAK%2C%20I%20have%20some%20feedback%20to%20share%21"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <MessageCircle className="h-5 w-5" /> Send on WhatsApp
        </a>
      </section>
      <Footer />
    </div>
  );
}
