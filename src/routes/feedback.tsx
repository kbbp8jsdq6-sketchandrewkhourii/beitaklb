import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Star } from "lucide-react";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — BEITAK" },
      {
        name: "description",
        content: "Real feedback from BEITAK guests across Lebanon.",
      },
      { property: "og:title", content: "Feedback — BEITAK" },
      { property: "og:description", content: "What our guests say about BEITAK." },
    ],
  }),
  component: FeedbackPage,
});

interface Review {
  name: string;
  rating: 4 | 5;
  text: string;
}

const REVIEWS: Review[] = [
  { name: "Lara Haddad", rating: 5, text: "Honestly one of the best experiences I've had booking a stay in Lebanon. The listing was exactly as described and the host was super welcoming. Will definitely be using Beitak again this summer!" },
  { name: "Charbel Gemayel", rating: 5, text: "Found an amazing cabin in the mountains for our family trip and the whole process was smooth from start to finish. Highly recommend." },
  { name: "Maya Nassar", rating: 4, text: "Kenet khayfe ma ykon metl ma bil soura bas wallah surprise! The place was even better in person. Roy was very helpful and responsive throughout the whole process, top guys!" },
  { name: "Elie Khoury", rating: 5, text: "We booked a villa for my sister's birthday and it was perfect. The host had everything ready and the communication through WhatsApp was fast and easy. Beitak is the future of local travel." },
  { name: "Nadine Frem", rating: 5, text: "Super easy to use and the listings are beautiful. Found exactly what I was looking for in under 5 minutes." },
  { name: "Georges Abou Zeid", rating: 4, text: "3ajabne ktir el fikra. Lebnen 3ando kell shi w hala2 fi platform tojme3 kell hal amakin l helwe. Bas yaret yzido aktar listings la zouk mikael w jbeil." },
  { name: "Tania Sleiman", rating: 5, text: "Booked a cozy apartment in Broummana for the weekend and it was everything we needed. Clean, well equipped, and the host was lovely. Thank you!" },
  { name: "Joe Moussa", rating: 5, text: "Yiii shu helwe hal website! Sahel ktir w el listings 3melinhon professional. El WhatsApp button is genius, direct w ma fi wasta. 10/10 would recommend." },
  { name: "Rima Antoun", rating: 4, text: "Had a small issue with the booking details but the team sorted it out immediately. Great customer care and a really lovely platform overall. Keep it up guys!" },
  { name: "Karim Hamdan", rating: 5, text: "Finally a Lebanese platform that actually works and looks good. We used Beitak for our company retreat and found an amazing property in Ehden. Will 100% use again." },
  { name: "Celine Abi Khalil", rating: 5, text: "Ma kenet 3arfe shu taw2a3 bas el villa ken amazing. El host kan responsive w Andrew w Roy helped us sort everything out quickly." },
  { name: "Fadi Raad", rating: 4, text: "Good selection of properties and the interface is clean and easy to navigate. Would love to see more listings added in the south and Bekaa. Overall great experience!" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-[#F5B400] text-[#F5B400]" : "fill-none text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function ReviewCard({ review, variant }: { review: Review; variant: "light" | "dark" | "outline" }) {
  const styles = {
    light: "bg-card border border-border",
    dark: "bg-foreground text-background border border-foreground",
    outline: "bg-background border-2 border-primary/20",
  } as const;

  const isDark = variant === "dark";

  return (
    <article className={`rounded-2xl p-6 shadow-sm transition hover:shadow-md ${styles[variant]}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
            isDark ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {initials(review.name)}
        </div>
        <div>
          <p className={`font-semibold ${isDark ? "text-background" : "text-foreground"}`}>
            {review.name}
          </p>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p
        className={`mt-4 text-sm leading-relaxed ${
          isDark ? "text-background/85" : "text-foreground/80"
        }`}
      >
        "{review.text}"
      </p>
    </article>
  );
}

function FeedbackPage() {
  const variants: Array<"light" | "dark" | "outline"> = ["light", "outline", "light", "dark", "light", "outline", "dark", "light", "outline", "light", "dark", "outline"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Feedback</p>
          <h1 className="mt-2 font-display text-5xl text-foreground sm:text-6xl">
            What our guests say
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Real reviews from real people who found their perfect stay through BEITAK.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review, i) => (
            <ReviewCard key={review.name} review={review} variant={variants[i]} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
