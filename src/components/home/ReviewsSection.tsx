import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PatternBackground } from "@/components/PatternBackground";
import { STATIC_REVIEWS, HOME_REVIEW_SLUGS, type StaticReview } from "@/lib/static-reviews";

const HOME_REVIEWS = HOME_REVIEW_SLUGS
  .map((slug) => STATIC_REVIEWS.find((r) => r.slug === slug)!)
  .filter(Boolean);

function Stars({ rating, size }: { rating: number; size: "lg" | "sm" }) {
  const cls = size === "lg" ? "h-[18px] w-[18px]" : "h-[15px] w-[15px]";
  return (
    <div
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className={`flex ${size === "lg" ? "gap-1" : "gap-[3px]"}`}
    >
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          aria-hidden="true"
          strokeWidth={1.5}
          className={`${cls} text-foreground ${idx < rating ? "fill-foreground" : "fill-none"}`}
        />
      ))}
    </div>
  );
}

function Attribution({ r, size }: { r: StaticReview; size: "lg" | "sm" }) {
  return (
    <figcaption className="flex flex-col gap-0.5">
      <Link
        to="/profile/$slug"
        params={{ slug: r.slug }}
        className={`w-fit font-semibold text-foreground underline decoration-transparent underline-offset-4 transition hover:text-[#CC0000] hover:decoration-[#CC0000] ${
          size === "lg" ? "text-base" : "text-[15px]"
        }`}
      >
        {r.name}
      </Link>
      <span className={`text-[#6B6363] ${size === "lg" ? "text-sm" : "text-[13px]"}`}>
        Member since {r.memberSince}
      </span>
    </figcaption>
  );
}

export default function ReviewsSection() {
  const [featured, ...rest] = HOME_REVIEWS;
  if (!featured) return null;

  return (
    <section className="relative border-y border-border bg-background">
      <PatternBackground />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-6 pb-16 pt-[72px] md:gap-14 md:px-12 md:pb-24 md:pt-28 lg:px-16">
        <Reveal className="flex items-end justify-between gap-8">
          <div className="flex flex-col gap-3.5 md:gap-4">
            <p className="text-sm font-semibold text-[#CC0000] md:text-[15px]">Reviews</p>
            <h2 className="font-display text-[56px] leading-[0.95] tracking-[0.01em] text-foreground md:text-[64px] lg:text-[76px]">
              Loved by guests
            </h2>
          </div>
          <Link
            to="/feedback"
            className="hidden min-h-12 shrink-0 items-center justify-center rounded-md border-2 border-foreground px-7 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-background md:inline-flex"
          >
            See all reviews
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-y-8 md:grid-cols-12 md:gap-x-8">
          <Reveal as="figure" className="flex flex-col gap-[18px] md:col-span-7 md:gap-6">
            <Stars rating={featured.rating} size="lg" />
            <blockquote className="max-w-[22em] text-[22px] font-medium leading-[1.42] tracking-[-0.01em] text-foreground md:text-[26px] lg:text-[30px] lg:leading-[1.4]">
              “{featured.message}”
            </blockquote>
            <Attribution r={featured} size="lg" />
          </Reveal>

          <div className="flex flex-col md:col-span-4 md:col-start-9">
            {rest.map((r, i) => (
              <Reveal
                key={r.slug}
                as="figure"
                delay={(i + 1) * 120}
                className={`flex flex-col gap-3.5 md:gap-4 ${
                  i === 0
                    ? "border-t border-[#E8E4E4] pt-8 md:border-t-0 md:pb-8 md:pt-0"
                    : "border-t border-[#E8E4E4] pt-8"
                }`}
              >
                <Stars rating={r.rating} size="sm" />
                <blockquote className="text-base leading-relaxed text-[#2E2828] md:text-[17px]">
                  “{r.message}”
                </blockquote>
                <Attribution r={r} size="sm" />
              </Reveal>
            ))}
          </div>
        </div>

        <Link
          to="/feedback"
          className="flex min-h-12 items-center justify-center rounded-md border-2 border-foreground text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-background md:hidden"
        >
          See all reviews
        </Link>
      </div>
    </section>
  );
}
