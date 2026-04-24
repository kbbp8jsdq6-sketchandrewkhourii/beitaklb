import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Pin, Send } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STATIC_REVIEWS } from "@/lib/static-reviews";

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

interface ApprovedReview {
  id: string;
  author_name: string;
  rating: number;
  message: string;
  is_pinned: boolean;
  slug?: string; // when set, the name links to /profile/$slug
}

function ReviewCard({
  review,
  variant,
}: {
  review: ApprovedReview;
  variant: "light" | "dark" | "outline";
}) {
  const styles = {
    light: "bg-card border border-border",
    dark: "bg-foreground text-background border border-foreground",
    outline: "bg-background border-2 border-primary/20",
  } as const;

  const isDark = variant === "dark";

  return (
    <article
      className={`relative rounded-2xl p-6 shadow-sm transition hover:shadow-md ${styles[variant]} ${
        review.is_pinned ? "ring-2 ring-primary/40" : ""
      }`}
    >
      {review.is_pinned && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          <Pin className="h-3 w-3" /> Featured
        </span>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
            isDark ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {initials(review.author_name)}
        </div>
        <div>
          <p className={`font-semibold ${isDark ? "text-background" : "text-foreground"}`}>
            {review.author_name}
          </p>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p
        className={`mt-4 text-sm leading-relaxed ${
          isDark ? "text-background/85" : "text-foreground/80"
        }`}
      >
        "{review.message}"
      </p>
    </article>
  );
}

function FeedbackForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMsg = message.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast.error("Please enter your name (max 100 characters)");
      return;
    }
    if (!trimmedMsg || trimmedMsg.length > 1000) {
      toast.error("Message is required (max 1000 characters)");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Pick a rating between 1 and 5");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      author_name: trimmedName,
      rating,
      message: trimmedMsg,
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks for your feedback! It will appear after review.");
    setName("");
    setMessage("");
    setRating(5);
    onSubmitted();
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="font-display text-2xl text-foreground">Share your experience</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Reviews are moderated before appearing on the site.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Lara Haddad"
            className="mt-1"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rating
          </label>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
              >
                <Star
                  className={`h-6 w-6 transition ${
                    n <= rating
                      ? "fill-[#F5B400] text-[#F5B400]"
                      : "fill-none text-muted-foreground/40 hover:text-[#F5B400]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your feedback
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          placeholder="Tell us about your stay…"
          className="mt-1 min-h-28"
          required
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {message.length}/1000
        </p>
      </div>

      <Button type="submit" className="mt-4" disabled={submitting}>
        <Send className="mr-1 h-4 w-4" />
        {submitting ? "Submitting…" : "Submit feedback"}
      </Button>
    </form>
  );
}

function FeedbackPage() {
  const reviewsQ = useQuery({
    queryKey: ["public-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, author_name, rating, message, is_pinned")
        .eq("status", "approved")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as ApprovedReview[];
    },
  });

  const reviews = reviewsQ.data ?? [];
  const variants: Array<"light" | "dark" | "outline"> = [
    "light", "outline", "light", "dark", "light", "outline",
    "dark", "light", "outline", "light", "dark", "outline",
  ];

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

        {reviews.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                variant={variants[i % variants.length]}
              />
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-14 max-w-md text-center text-sm text-muted-foreground">
            Be the first to share your experience.
          </p>
        )}

        <FeedbackForm onSubmitted={() => reviewsQ.refetch()} />
      </section>
      <Footer />
    </div>
  );
}
