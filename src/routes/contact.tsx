import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Instagram, MessageCircle, Mail, Phone } from "lucide-react";

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

const COFOUNDERS = [
  { name: "Andrew Khoury", title: "Co-founder of Beitak.lb", phone: "+961 78 959 606", tel: "+96178959606" },
  { name: "Roy Younes", title: "Co-founder of Beitak.lb", phone: "+961 76 134 875", tel: "+96176134875" },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Contact</p>
          <h1 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">Say hello</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We typically reply within a few hours — reach us through any of the channels below.
          </p>
        </div>

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
          <a
            href="mailto:beitaklb@gmail.com"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <Mail className="h-8 w-8 text-primary" />
            <p className="font-semibold">Email</p>
            <p className="text-xs font-semibold text-[#E63030]">beitaklb@gmail.com</p>
          </a>
        </div>

        <div className="mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
              For business and inquiries
            </p>
            <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
              Talk to the founders
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {COFOUNDERS.map((c) => (
              <div
                key={c.tel}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {c.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{c.name}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {c.title}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${c.tel}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-foreground/90"
                >
                  <Phone className="h-4 w-4" /> {c.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
