import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: fallback(z.string().optional(), undefined),
  checkIn: fallback(z.string().optional(), undefined),
  checkOut: fallback(z.string().optional(), undefined),
  guests: fallback(z.number().optional(), undefined),
});

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search stays — BEITAK" },
      { name: "description", content: "Find stays across Lebanon's villages and cities." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: SearchPage,
});

function SearchPage() {
  const { q, checkIn, checkOut, guests } = Route.useSearch();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search-listings", q, checkIn, checkOut, guests],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, title, location, price_per_night, max_guests, listing_photos(photo_url, display_order)")
        .eq("is_active", true);
      if (q) query = query.ilike("location", `%${q}%`);
      if (guests) query = query.gte("max_guests", guests);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(60);
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
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-6 sm:px-6 lg:px-8">
          <SearchBar
            variant="compact"
            initial={{ location: q, checkIn, checkOut, guests }}
          />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {q ? `Stays in ${q}` : "All stays in Lebanon"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
            <p className="font-display text-2xl text-foreground">No stays found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different village, city, or date range.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              ← Back home
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
