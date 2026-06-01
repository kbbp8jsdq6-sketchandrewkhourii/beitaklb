import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, X, Minus, Plus, Users, ArrowUpDown, MapPin, ChevronDown, Bed, Bath } from "lucide-react";
import { cn } from "@/lib/utils";
import { restoreListingReturnScroll } from "@/lib/listing-return";

const searchSchema = z.object({
  q: fallback(z.string().optional(), undefined),
  district: fallback(z.string().optional(), undefined),
  category: fallback(z.enum(["villa", "cabin", "apartment"]).optional(), undefined),
  bedrooms: fallback(z.coerce.number().int().min(0).max(20), 0).default(0),
  bathrooms: fallback(z.coerce.number().int().min(0).max(20), 0).default(0),
  amenities: fallback(z.array(z.string()), []).default([]),
  guests: fallback(z.coerce.number().int().min(1).max(20), 1).default(1),
  minBudget: fallback(z.coerce.number(), 0).default(0),
  maxBudget: fallback(z.coerce.number(), 3000).default(3000),
  sortPrice: fallback(z.enum(["none", "asc", "desc"]), "none").default("none"),
  location: fallback(z.string().optional(), undefined),
});

type ListingCategory = "villa" | "cabin" | "apartment";
type SearchParams = z.infer<typeof searchSchema>;
type SortPrice = "none" | "asc" | "desc";

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
      { property: "og:url", content: "https://beitaklb.com/search" },
    ],
    links: [{ rel: "canonical", href: "https://beitaklb.com/search" }],
  }),
  validateSearch: zodValidator(searchSchema),
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
  district: string | undefined,
  category: ListingCategory | undefined,
  bedrooms: number | undefined,
  bathrooms: number | undefined,
  selectedAmenities: string[],
  guests: number,
  minBudget: number,
  maxBudget: number,
  sortPrice: SortPrice,
  location: string | undefined,
  offset: number,
  pageSize: number,
): Promise<PageResult> {
  let query = supabase
    .from("listings")
    .select(
      "id, title, description, location, price_per_night, price_weekday, price_weekend, amenities, max_guests, category, bedrooms, listing_photos(photo_url, display_order)",
    )
    .eq("is_active", true);

  if (category) query = query.eq("category", category);
  if (bedrooms != null && bedrooms > 0) query = query.eq("bedrooms", bedrooms);
  if (bathrooms != null && bathrooms > 0) query = query.eq("bathrooms", bathrooms);
  if (district) query = query.eq("district", district);
  if (q) {
    const term = q.replace(/[%,]/g, " ");
    query = query.or(
      `title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%,amenities.cs.{${term}}`,
    );
  }
  if (selectedAmenities.length > 0) {
    query = query.contains("amenities", selectedAmenities);
  }
  if (guests > 1) query = query.gte("max_guests", guests);
  query = query.gte("price_weekday", minBudget).lte("price_weekday", maxBudget);
  if (location) query = query.ilike("location", `${location}%`);

  if (sortPrice === "asc") query = query.order("price_weekday", { ascending: true });
  else if (sortPrice === "desc") query = query.order("price_weekday", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.range(offset, offset + pageSize - 1);
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
  const { q, district, category, bedrooms, bathrooms, amenities, guests, minBudget, maxBudget, sortPrice, location } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const pageSize = usePageSize();

  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const selectedAmenities: string[] = amenities ?? [];

  const [localGuests, setLocalGuests] = useState<number>(guests);
  const [localBedrooms, setLocalBedrooms] = useState<number>(bedrooms ?? 0);
  const [localBathrooms, setLocalBathrooms] = useState<number>(bathrooms ?? 0);
  const [localMin, setLocalMin] = useState<number>(minBudget);
  const [localMax, setLocalMax] = useState<number>(maxBudget);
  const [localLocation, setLocalLocation] = useState<string>(location ?? "");
  const maxPrice = 3000;

  const { data: locationPool = [] } = useQuery<string[]>({
    queryKey: ["search-locations"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("location").eq("is_active", true).limit(200);
      return [...new Set((data ?? []).map((r) => (r.location ?? "").split(",")[0].trim()).filter(Boolean))].sort();
    },
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["search-listings", q, district, category, bedrooms, bathrooms, selectedAmenities, guests, minBudget, maxBudget, sortPrice, location, pageSize],
    queryFn: ({ pageParam = 0 }) =>
      fetchSearchPage(q, district, category, bedrooms, bathrooms, selectedAmenities, guests, minBudget, maxBudget, sortPrice, location, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const filteredResults = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.results),
    [data],
  );

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

  const toggleAmenity = (a: string) => {
    navigate({
      search: (prev: SearchParams) => {
        const current = prev.amenities ?? [];
        const next = current.includes(a) ? current.filter((x: string) => x !== a) : [...current, a];
        return { ...prev, amenities: next.length > 0 ? next : undefined } as SearchParams;
      },
      resetScroll: false,
    });
  };

  const applyFilters = () => {
    navigate({
      search: (prev: SearchParams) => ({
        ...prev,
        guests: localGuests,
        minBudget: localMin,
        maxBudget: localMax,
        location: localLocation || undefined,
        bedrooms: localBedrooms > 0 ? localBedrooms : undefined,
        bathrooms: localBathrooms > 0 ? localBathrooms : undefined,
      }),
      resetScroll: false,
    });
  };


  const totalLoaded = filteredResults.length;

  useEffect(() => {
    if (!isLoading) restoreListingReturnScroll();
  }, [isLoading, totalLoaded]);

  const visibleAmenities = showAllAmenities ? allAmenities : allAmenities.slice(0, 14);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {category
              ? CATEGORY_LABEL[category as ListingCategory]
              : district
                ? `Stays in ${district}`
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

        {/* Filter panel */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 space-y-4">
          {/* Row 1: Location + Guests + Sort + Apply */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location dropdown */}
            <div className="relative min-w-[200px] flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <select
                value={localLocation}
                onChange={(e) => setLocalLocation(e.target.value)}
                className="h-10 w-full appearance-none rounded-full border border-border bg-background pl-9 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Locations</option>
                {locationPool.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Guests stepper */}
            <div className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Guests</span>
              <button
                type="button"
                onClick={() => setLocalGuests((g) => Math.max(1, g - 1))}
                disabled={localGuests <= 1}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary disabled:opacity-40"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-4 text-center text-sm font-bold">{localGuests}</span>
              <button
                type="button"
                onClick={() => setLocalGuests((g) => Math.min(20, g + 1))}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Bedrooms stepper */}
            <div className="flex h-10 items-center gap-3 rounded-full border border-border bg-background px-4">
              <Bed className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Beds</span>
              <button type="button" onClick={() => setLocalBedrooms((b) => Math.max(0, b - 1))} disabled={localBedrooms <= 0} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary disabled:opacity-40">
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-4 text-center text-sm font-bold">{localBedrooms === 0 ? "Any" : localBedrooms}</span>
              <button type="button" onClick={() => setLocalBedrooms((b) => Math.min(20, b + 1))} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary">
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Bathrooms stepper */}
            <div className="flex h-10 items-center gap-3 rounded-full border border-border bg-background px-4">
              <Bath className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Baths</span>
              <button type="button" onClick={() => setLocalBathrooms((b) => Math.max(0, b - 1))} disabled={localBathrooms <= 0} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary disabled:opacity-40">
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-4 text-center text-sm font-bold">{localBathrooms === 0 ? "Any" : localBathrooms}</span>
              <button type="button" onClick={() => setLocalBathrooms((b) => Math.min(20, b + 1))} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary">
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Sort price */}
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <select
                value={sortPrice}
                onChange={(e) =>
                  navigate({
                    search: (prev: SearchParams) => ({ ...prev, sortPrice: e.target.value as SortPrice }),
                    resetScroll: false,
                  })
                }
                className="h-10 appearance-none rounded-full border border-border bg-background pl-9 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="none">Sort: Default</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Apply */}
            <button
              type="button"
              onClick={applyFilters}
              className="h-10 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              Apply
            </button>
          </div>

          {/* Row 2: Budget */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Budget per night</p>
              <span className="text-xs font-bold text-primary">
                ${localMin.toLocaleString()} — ${localMax.toLocaleString()}
              </span>
            </div>
            <DualSlider
              min={0}
              max={maxPrice}
              step={50}
              valueMin={localMin}
              valueMax={localMax}
              onChangeMin={setLocalMin}
              onChangeMax={setLocalMax}
            />
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>$0</span>
              <span>${maxPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Row 3: Amenities */}
          {allAmenities.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Amenities</h2>
                </div>
                {selectedAmenities.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        search: (prev: SearchParams) => ({ ...prev, amenities: undefined }),
                        resetScroll: false,
                      })
                    }
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear ({selectedAmenities.length})
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleAmenities.map((a) => {
                  const active = selectedAmenities.some((s) => s.toLowerCase() === a.toLowerCase());
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary",
                      )}
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
        </div>

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
                <ListingCard key={l.id} listing={l} index={Math.min(i, 8)} />
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

    </div>
  );
}
