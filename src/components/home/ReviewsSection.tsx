import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Star } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Reveal } from "@/components/Reveal";
import { PatternBackground } from "@/components/PatternBackground";
import { Button } from "@/components/ui/button";
import { GOOGLE_REVIEW_URL, googleReviewsOptions, type GoogleReview, type GoogleReviewsData } from "@/lib/google-reviews";

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return <div role="img" aria-label={`Rated ${rating} out of 5`} className={`flex gap-1 ${className}`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < Math.round(rating) ? "fill-current" : "fill-none"}`} strokeWidth={1.5} />)}
  </div>;
}

function Attribution({ review, featured = false }: { review: GoogleReview; featured?: boolean }) {
  const initials = review.guest_name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <figcaption className="flex items-center gap-3">
    {featured && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden="true">{initials}</span>}
    <div className="min-w-0"><p className="break-words text-sm font-semibold">{review.guest_name}</p>
      <p className={`mt-1 text-xs leading-relaxed ${featured ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
        {review.property_name?.trim() ? `Stayed at ${review.property_name} · Google review` : "Google review"}
      </p>
    </div>
  </figcaption>;
}

export default function ReviewsSection({ initialData }: { initialData: GoogleReviewsData }) {
  const { data } = useSuspenseQuery({ ...googleReviewsOptions, initialData });
  const featured = data.reviews.find(review => review.featured) ?? data.reviews[0];
  const rest = data.reviews.filter(review => review.id !== featured?.id).slice(0, 2);
  return <section id="google-reviews" className="relative border-y border-border bg-background">
    <PatternBackground />
    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-6 py-[72px] md:gap-10 md:px-12 md:py-24 lg:px-16">
      <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
        <div className="min-w-0"><p className="text-sm font-semibold text-primary">Reviews</p>
          <h2 className="mt-4 font-display text-5xl leading-none tracking-normal md:text-7xl">Loved by our guests</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">Real stays, real words. Every review here comes straight from our Google profile.</p>
        </div>
        {data.rating != null && data.count != null && <div className="w-full shrink-0 rounded-lg border border-border bg-card px-6 py-5 shadow-sm sm:w-fit lg:min-w-60" aria-label="Google review rating">
          <div className="flex items-baseline gap-2"><span className="font-display text-6xl leading-none">{Number(data.rating).toFixed(1)}</span><span className="text-sm text-muted-foreground">out of 5</span></div>
          <Stars rating={5} className="mt-3 text-primary" />
          <p className="mt-3 text-xs text-muted-foreground">Based on {data.count.toLocaleString()} Google reviews</p>
        </div>}
      </Reveal>
      {featured && <div className={`grid gap-5 ${rest.length ? "lg:grid-cols-[3fr_2fr]" : ""}`}>
        <Reveal as="figure" className="relative flex h-full min-w-0 flex-col justify-between gap-8 overflow-hidden rounded-lg bg-secondary p-7 text-secondary-foreground md:p-9">
          <span className="pointer-events-none absolute right-6 top-2 font-display text-9xl leading-none text-primary" aria-hidden="true">“</span>
          <Stars rating={featured.rating} className="relative" />
          <blockquote className="relative whitespace-pre-wrap break-words text-xl font-medium leading-relaxed md:text-2xl">{featured.review_text}</blockquote>
          <Attribution review={featured} featured />
        </Reveal>
        {rest.length > 0 && <div className="flex min-w-0 flex-col gap-5">{rest.map((review, index) => <Reveal key={review.id} as="figure" delay={(index + 1) * 100} className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
          <Stars rating={review.rating} />
          <blockquote className="whitespace-pre-wrap break-words text-sm leading-relaxed md:text-base">{review.review_text}</blockquote>
          <div className="mt-auto"><Attribution review={review} /></div>
        </Reveal>)}</div>}
      </div>}
      <Reveal className="flex flex-col justify-between gap-8 rounded-lg bg-primary p-7 text-primary-foreground md:flex-row md:items-center md:p-9">
        <div className="min-w-0 flex-1"><h3 className="font-display text-4xl leading-none tracking-normal md:text-5xl">Stayed with us?</h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/90 md:text-base">Tell other guests how it went. It takes less than a minute and helps us bring you even better places.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-lg border-primary-foreground bg-background px-5 font-semibold text-foreground hover:bg-background/90 hover:text-foreground sm:w-auto"><a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">Write a Google review<ArrowUpRight aria-hidden="true" /></a></Button>
            {data.reviewsPageLink && <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-lg border-primary-foreground bg-transparent px-5 font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"><a href={data.reviewsPageLink} target="_blank" rel="noopener noreferrer">See all reviews</a></Button>}
          </div>
        </div>
        <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" aria-label="Scan to review on Google (opens in a new tab)" className="hidden w-44 shrink-0 flex-col items-center rounded-lg bg-background p-4 text-center text-foreground md:flex">
          <QRCodeSVG value={GOOGLE_REVIEW_URL} size={116} level="M" marginSize={2} className="google-review-qr" />
          <span className="mt-2 text-sm font-semibold">Scan to review</span><span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Point your phone camera at the code.</span>
        </a>
      </Reveal>
    </div>
  </section>;
}
