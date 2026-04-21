import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { POPULAR_DESTINATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-lebanon.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BEITAK — Home Is Closer Than You Think" },
      {
        name: "description",
        content: "Book unique stays across Lebanon. From Beirut rooftops to Bcharre's cedars.",
      },
    ],
  }),
  component: HomePage,
});

async function fetchFeatured() {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, location, price_per_night, listing_photos(photo_url, display_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []).map((l) => {
    const photos = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
    return {
      id: l.id,
      title: l.title,
      location: l.location,
      price_per_night: Number(l.price_per_night),
      cover: photos[0]?.photo_url ?? null,
    };
  });
}

function HomePage() {
  const { data: featured = [], isLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: fetchFeatured,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
          <img
            src={heroImage}
            alt="Lebanese village at sunset"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <h1 className="font-display text-5xl text-white drop-shadow-lg sm:text-7xl md:text-8xl">
              BEITAK
            </h1>
            <p className="mt-3 max-w-xl font-display text-xl uppercase tracking-[0.3em] text-white/95 drop-shadow sm:text-2xl">
              Home Is Closer Than You Think
            </p>
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
              Stay in Lebanon's most beautiful villages and cities — from the
              cedars of Bcharre to the souks of Tripoli.
            </p>
          </div>
          <div className="absolute -bottom-10 left-1/2 w-full max-w-5xl -translate-x-1/2 px-4">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          Discover Lebanon
        </h2>
        <p className="mt-1 text-muted-foreground">Popular destinations to explore</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {POPULAR_DESTINATIONS.map((d) => (
            <Link
              key={d.name}
              to="/search"
              search={{ q: d.name }}
              className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-md"
            >
              <p className="font-display text-xl tracking-wide text-foreground transition group-hover:text-primary">
                {d.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">Latest stays</h2>
            <p className="mt-1 text-muted-foreground">Fresh listings across the country</p>
          </div>
          <Link to="/search" className="text-sm font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
            <p className="font-display text-2xl text-foreground">No listings yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to host on BEITAK.
            </p>
            <Link
              to="/host/new"
              className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              List your place
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-display text-2xl tracking-wider">BEITAK</p>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary-foreground/70">
              Home Is Closer Than You Think
            </p>
            <p className="mt-3 text-xs text-secondary-foreground/60">
              © {new Date().getFullYear()} BEITAK Lebanon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
