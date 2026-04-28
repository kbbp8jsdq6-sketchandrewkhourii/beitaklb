import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { ListingQuickPreview, type QuickPreviewListing } from "@/components/ListingQuickPreview";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, X } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.enum(["villa", "cabin", "apartment"]).optional().catch(undefined),
});

type ListingCategory = "villa" | "cabin" | "apartment";

const CATEGORY_LABEL: Record<ListingCategory, string> = {
  villa: "Villas",
  cabin: "Cabins",
  apartment: "Apartments",
};

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Browse Listings in Lebanon | Villas, Cabins & Apartments | Beitak" },
      { name: "description", content: "Browse unique guesthouses, villas, cabins and apartments across Lebanon. Filter by city to find your perfect Lebanese stay." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Browse Listings in Lebanon | Beitak" },
      { property: "og:description", content: "Browse unique stays across Lebanon — from Beirut to Bcharre." },
      { property: "og:url", content: "https://beitaklb.lovable.app/search" },
    ],
    links: [{ rel: "canonical", href: "https://beitaklb.lovable.app/search" }],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  component: SearchPage,
});

type SearchListing = ListingCardData & {
  description?: string | null;
  category?: ListingCategory;
};

interface PageResult {
  results: SearchListing[];
  nextOffset: number | null;
}

function usePageSize(): number {
  const [size, setSize] = useState(8);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setSize(mq.matches ? 4 : 8);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return size;
}

async function fetchSearchPage(
  q: string | undefined,
  category: ListingCategory | undefined,
  selectedAmenities: string[],
  offset: number,
  pageSize: number,
): Promise<PageResult> {
  let query = supabase
    .from("listings")
    .select(
      "id, title, description, location, price_per_night, price_weekday, price_weekend, amenities, max_guests, category, listing_photos(photo_url, display_order)",
    )
    .eq("is_active", true);

  if (category) query = query.eq("category", category);
  if (q) {
    const term = q.replace(/[%,]/g, " ");
    query = query.or(
      `title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%,amenities.cs.{${term}}`,
    );
  }
  if (selectedAmenities.length > 0) {
    query = query.contains("amenities", selectedAmenities);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);
  if (error) throw error;

  const rows = data ?? [];
  const results: SearchListing[] = rows.map((l) => {
    const photos = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      location: l.location,
      price_per_night: Number(l.price_per_night),
      price_weekday: Number(l.price_weekday),
      price_weekend: Number(l.price_weekend),
      amenities: l.amenities ?? [],
      category: l.category as ListingCategory,
      cover: photos[0]?.photo_url ?? null,
      photos: photos.map((p) => p.photo_url),
    };
  });

  return {
    results,
    nextOffset: rows.length < pageSize ? null : offset + pageSize,
  };
}

function SearchPage() {
  const { q, category } = Route.useSearch();
  const pageSize = usePageSize();

  const [preview, setPreview] = useState<QuickPreviewListing | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Paginated, server-side filtered query.
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["search-listings", q, category, selectedAmenities, pageSize],
    queryFn: ({ pageParam = 0 }) =>
      fetchSearchPage(q, category, selectedAmenities, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const filteredResults = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.results),
    [data],
  );

  // Aggregate every unique amenity across active listings — capped to 200
  // listings so we never download 100+ rows for the filter chips.
  const { data: allAmenities = [] } = useQuery<string[]>({
    queryKey: ["all-amenities"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("amenities")
        .eq("is_active", true)
        .limit(200);
      if (error) throw error;
      const set = new Map<string, string>();
      (data ?? []).forEach((row) => {
        (row.amenities ?? []).forEach((a) => {
          const key = a.trim().toLowerCase();
          if (!key) return;
          if (!set.has(key)) set.set(key, a.trim());
        });
      });
      return [...set.values()].sort((a, b) => a.localeCompare(b));
    },
  });

  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const visibleAmenities = showAllAmenities ? allAmenities : allAmenities.slice(0, 14);

  const openPreview = (listing: ListingCardData) => {
    const full = filteredResults.find((r) => r.id === listing.id);
    setPreview(full ?? listing);
    setPreviewOpen(true);
  };

  const totalLoaded = filteredResults.length;

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
            {category
              ? CATEGORY_LABEL[category as ListingCategory]
              : q
                ? `Stays in ${q}`
                : "All stays in Lebanon"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Searching…"
              : `${totalLoaded}${hasNextPage ? "+" : ""} result${totalLoaded === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Amenities filter — capped pool, server-side filtered when toggled */}
        {allAmenities.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Filter by amenities</h2>
              </div>
              {selectedAmenities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAmenities([])}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Clear ({selectedAmenities.length})
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleAmenities.map((a) => {
                const active = selectedAmenities.some(
                  (s) => s.toLowerCase() === a.toLowerCase(),
                );
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {a}
                    {active && <X className="h-3 w-3" />}
                  </button>
                );
              })}
              {allAmenities.length > 14 && (
                <button
                  type="button"
                  onClick={() => setShowAllAmenities((v) => !v)}
                  className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {showAllAmenities ? "Show less" : `+${allAmenities.length - 14} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
            <p className="font-display text-2xl text-foreground">No stays found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedAmenities.length > 0
                ? "Try removing some amenity filters."
                : "Try a different village, city, or keyword."}
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              ← Back home
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredResults.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={Math.min(i, 8)} onQuickPreview={openPreview} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="inline-flex items-center justify-center rounded-full border-2 border-foreground bg-transparent px-8 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground hover:text-background disabled:opacity-60"
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
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
