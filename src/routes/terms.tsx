import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — BEITAK" },
      {
        name: "description",
        content: "BEITAK's terms and conditions. Full version coming soon.",
      },
      { property: "og:title", content: "Terms & Conditions — BEITAK" },
      { property: "og:description", content: "BEITAK terms and conditions." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Legal</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">Terms & Conditions</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-muted-foreground">
            The full terms and conditions document is being prepared by our legal team. This page
            will be updated soon with the complete agreement covering bookings, host
            responsibilities, cancellations, privacy, and dispute resolution.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            For any urgent questions, reach us on WhatsApp.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
