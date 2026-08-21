import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PatternBackground } from "@/components/PatternBackground";
import { STATIC_REVIEWS, HOME_REVIEW_SLUGS } from "@/lib/static-reviews";

const HOME_REVIEWS = HOME_REVIEW_SLUGS
  .map((slug) => STATIC_REVIEWS.find((r) => r.slug === slug)!)
  .filter(Boolean);

export default function ReviewsSection() {
  return (
    <section className="relative border-y border-border bg-background">
      <PatternBackground />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Reviews</p>
          <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
            Loved by guests
          </h2>
        </Reveal>
        <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 hide-scrollbar">
          {HOME_REVIEWS.map((r, i) => (
            <Reveal
              key={r.slug}
              delay={i * 130}
              as="figure"
              className="w-[85%] shrink-0 snap-center rounded-2xl border border-border bg-card p-7 sm:w-auto sm:shrink"
            >
              <div className="flex gap-1 text-[#F5B400]">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-4 w-4 ${idx < r.rating ? "fill-[#F5B400] text-[#F5B400]" : "fill-none text-muted-foreground/40"}`}
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-lg text-foreground">"{r.message}"</blockquote>
              <figcaption className="mt-5 text-sm font-semibold text-foreground">
                -{" "}
                <Link
                  to="/profile/$slug"
                  params={{ slug: r.slug }}
                  className="underline decoration-transparent underline-offset-4 transition hover:text-primary hover:decoration-primary"
                >
                  {r.name}
                </Link>
              </figcaption>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            to="/feedback"
            className="inline-flex items-center justify-center rounded-full bg-[#E63030] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#cc2626] hover:shadow-lg"
          >
            See all reviews
          </Link>
        </div>
      </div>
    </section>
  );
}
