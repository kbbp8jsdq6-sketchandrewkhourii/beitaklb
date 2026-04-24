import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getStaticReviewBySlug, getInitials } from "@/lib/static-reviews";

export const Route = createFileRoute("/profile/$slug")({
  head: ({ params }) => {
    const review = getStaticReviewBySlug(params.slug);
    const title = review ? `${review.name} — BEITAK` : "Profile — BEITAK";
    return {
      meta: [
        { title },
        { name: "description", content: review ? `${review.name}'s public profile on BEITAK.` : "BEITAK profile" },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  loader: ({ params }) => {
    const review = getStaticReviewBySlug(params.slug);
    if (!review) throw notFound();
    return { review };
  },
  component: PublicProfilePage,
});

function StarRow({ rating }: { rating: number }) {
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

function PublicProfilePage() {
  const { review } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Profile card */}
        <section className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF1F1] text-3xl font-extrabold text-[#E63030] ring-4 ring-[#E63030]/10">
            {getInitials(review.name)}
          </div>
          <h1 className="mt-5 font-display text-4xl text-foreground">{review.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Member since <span className="font-semibold text-foreground">{review.memberSince}</span>
          </p>
        </section>

        {/* Reviews section */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-foreground">Reviews</h2>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63030]">1 review</span>
          </div>

          <article className="mt-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1F1] text-sm font-bold text-[#E63030]">
                {getInitials(review.name)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{review.name}</p>
                <StarRow rating={review.rating} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/85">"{review.message}"</p>
          </article>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            This user has no other public activity.
          </p>
        </section>

        <div className="mt-10 text-center">
          <Link
            to="/feedback"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Back to all reviews
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
