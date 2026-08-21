import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions - Beitak" },
      {
        name: "description",
        content:
          "Beitak Terms and Conditions: platform role, accounts, listings, intellectual property and liability.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Terms & Conditions - Beitak" },
      { property: "og:description", content: "Beitak terms and conditions." },
      { property: "og:url", content: "https://beitaklb.com/terms" },
    ],
  }),
  component: TermsPage,
});

const FALLBACK_TERMS = `Welcome to Beitak. By accessing or using our platform, you agree to the following terms:

1. Platform role
Beitak acts solely as a listing platform connecting guests with property hosts.

7. Contact
For any questions regarding these terms, contact us at beitaklb@gmail.com.`;

interface Section {
  title: string | null;
  body: string;
}

/**
 * Parse the admin-editable terms text into sections.
 * A line that matches "<number>. <title>" starts a new section; following
 * lines (until the next title or blank-line gap) are the body.
 */
function parseTerms(text: string): { intro: string; sections: Section[] } {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let intro = "";
  let current: Section | null = null;
  let collectingIntro = true;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const match = /^(\d+\.\s+.+)$/.test(line.trim());
    if (match) {
      collectingIntro = false;
      if (current) sections.push(current);
      current = { title: line.trim(), body: "" };
    } else if (collectingIntro) {
      intro += (intro ? "\n" : "") + line;
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  return { intro: intro.trim(), sections };
}

function TermsPage() {
  const q = useQuery({
    queryKey: ["public-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("terms_text")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data?.terms_text ?? FALLBACK_TERMS;
    },
  });

  const parsed = useMemo(() => parseTerms(q.data ?? FALLBACK_TERMS), [q.data]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Legal</p>
        <h1 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 2025</p>

        {parsed.intro && (
          <p className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">
            {parsed.intro}
          </p>
        )}

        <div className="mt-10 space-y-8">
          {parsed.sections.map((s, i) => (
            <div key={`${i}-${s.title}`}>
              {s.title && (
                <h2 className="font-display text-2xl text-foreground">{s.title}</h2>
              )}
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-foreground/80">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
