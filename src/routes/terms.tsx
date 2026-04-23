import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — BEITAK" },
      {
        name: "description",
        content:
          "BEITAK Terms and Conditions: platform role, accounts, listings, intellectual property and liability.",
      },
      { property: "og:title", content: "Terms & Conditions — BEITAK" },
      { property: "og:description", content: "BEITAK terms and conditions." },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "1. Platform role",
    body: "Beitak acts solely as a listing platform connecting guests with property hosts. We are not responsible for the condition, accuracy, or availability of any listed property.",
  },
  {
    title: "2. User accounts",
    body: "Users are responsible for maintaining the confidentiality of their account credentials. Beitak reserves the right to suspend accounts found to be in violation of these terms.",
  },
  {
    title: "3. Listings",
    body: "Hosts are solely responsible for the accuracy of their listings including photos, descriptions, pricing, and availability. Beitak does not verify listing content.",
  },
  {
    title: "4. Intellectual property",
    body: "All content on this platform including the Beitak name, logo, and design is the property of Beitak.lb and may not be reproduced without written permission.",
  },
  {
    title: "5. Limitation of liability",
    body: "Beitak shall not be held liable for any disputes, damages, or losses arising from transactions between guests and hosts.",
  },
  {
    title: "6. Modifications",
    body: "Beitak reserves the right to update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.",
  },
];

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Legal</p>
        <h1 className="mt-3 font-display text-5xl text-foreground sm:text-6xl">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 2025</p>

        <p className="mt-8 text-base leading-relaxed text-foreground/85">
          Welcome to Beitak. By accessing or using our platform, you agree to the following terms:
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-2xl text-foreground">{s.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-foreground/80">{s.body}</p>
            </div>
          ))}

          <div>
            <h2 className="font-display text-2xl text-foreground">7. Contact</h2>
            <p className="mt-2 text-base leading-relaxed text-foreground/80">
              For any questions regarding these terms, contact us at{" "}
              <a
                href="mailto:beitaklb@gmail.com"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                beitaklb@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
