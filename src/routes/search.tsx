import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { ListingQuickPreview, type QuickPreviewListing } from "@/components/ListingQuickPreview";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Stays in Lebanon — BEITAK" },
      { name: "description", content: "Browse and search unique guesthouses, villas and apartments across Lebanon. Filter by city to find your perfect Lebanese stay." },
      { property: "og:title", content: "Search Stays in Lebanon — BEITAK" },
      { property: "og:description", content: "Browse unique stays across Lebanon — from Beirut to Bcharre." },
    ],
    links: [{ rel: "canonical", href: "https://beitaklb.lovable.app/search" }],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  component: SearchPage,
});

type SearchListing = ListingCardData & { description?: string | null };

function SearchPage() {
  const { q } = Route.useSearch();
  const [preview, setPreview] = useState<QuickPreviewListing | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: results = [], isLoading } = useQuery<SearchListing[]>({
    queryKey: ["search-listings", q],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, title, description, location, price_per_night, max_guests, listing_photos(photo_url, display_order)")
        .eq("is_active", true);
      if (q) {
        const term = q.replace(/[%,]/g, " ");
        query = query.or(
          `title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%,amenities.cs.{${term}}`
        );
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []).map((l) => {
        const photos = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
        return {
          id: l.id,
          title: l.title,
          description: l.description,
          location: l.location,
          price_per_night: Number(l.price_per_night),
          cover: photos[0]?.photo_url ?? null,
        };
      });
    },
  });

  const openPreview = (listing: ListingCardData) => {
    const full = results.find((r) => r.id === listing.id);
    setPreview(full ?? listing);
    setPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-6 sm:px-6 lg:px-8">
          <SearchBar variant="compact" initial={{ location: q }} />
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
              Try a different village, city, or keyword.
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
            {results.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} onQuickPreview={openPreview} />
            ))}
          </div>
        )}
      </section>

      <ListingQuickPreview
        listing={preview}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
