import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Instagram, MessageCircle, Mail, Phone, Send } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FieldError } from "@/components/FieldError";
import { contactSchema, fieldErrors, sanitizeLine, stripHtml, friendlyError } from "@/lib/validation";

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

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMsg = message.trim();

    if (!trimmedName || trimmedName.length > 100) {
      toast.error("Please enter your name (max 100 characters)");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 255) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!trimmedMsg || trimmedMsg.length > 2000) {
      toast.error("Message is required (max 2000 characters)");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: trimmedName,
      email: trimmedEmail,
      phone: phone.trim() || null,
      subject: subject.trim() || null,
      message: trimmedMsg,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Message sent — we'll get back to you soon.");
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="font-display text-2xl text-foreground">Send us a message</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill out the form and our team will get back to you.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Phone (optional)
          </label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subject (optional)
          </label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className="mt-1" />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Message
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          required
          className="mt-1 min-h-32"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/2000</p>
      </div>

      <Button type="submit" className="mt-4" disabled={submitting}>
        <Send className="mr-1 h-4 w-4" />
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

function ContactPage() {
  const settingsQ = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("business_email, business_phone, business_whatsapp, business_instagram")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const s = settingsQ.data;
  const email = s?.business_email || "beitaklb@gmail.com";
  const whatsapp = s?.business_whatsapp || "+961 81 160 435";
  const instagram = s?.business_instagram || "@beitak.lb";
  const waDigits = whatsapp.replace(/\D/g, "");
  const igHandle = instagram.replace(/^@/, "");

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
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <MessageCircle className="h-8 w-8 text-primary" />
            <p className="font-semibold">WhatsApp</p>
            <p className="text-xs text-muted-foreground">{whatsapp}</p>
          </a>
          <a
            href={`https://instagram.com/${igHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <Instagram className="h-8 w-8 text-primary" />
            <p className="font-semibold">Instagram</p>
            <p className="text-xs text-muted-foreground">{instagram}</p>
          </a>
          <a
            href={`mailto:${email}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <Mail className="h-8 w-8 text-primary" />
            <p className="font-semibold">Email</p>
            <p className="text-xs font-semibold text-[#E63030]">{email}</p>
          </a>
        </div>

        <ContactForm />

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
