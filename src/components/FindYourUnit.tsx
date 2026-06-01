import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import { Bed, Bath, Search, MapPin, ChevronDown, SlidersHorizontal, X, Users } from "lucide-react";
import { CardPhotoSlider } from "@/components/CardPhotoSlider";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PatternBackground } from "@/components/PatternBackground";

import { saveFindYourUnitState, loadFindYourUnitState } from "@/lib/listing-return";
type AnyOption = "Any" | "1" | "2" | "3" | "4" | "5" | "5+";

const BED_OPTIONS: AnyOption[] = ["Any", "1", "2", "3", "4", "5", "5+"];
const BATH_OPTIONS: AnyOption[] = ["Any", "1", "2", "3", "4", "5", "5+"];
const GUEST_OPTIONS: AnyOption[] = ["Any", "1", "2", "3", "4", "5", "5+"];
const AMENITIES = [
  "Pool",
  "Gym",
  "Parking",
  "Pet Friendly",
  "Washer/Dryer",
  "Balcony",
  "AC",
  "BBQ Area",
  "Beach Access",
  "Chimney",
  "Jacuzzi",
  "Wheelchair Accessibility",
  "Breakfast included",
  "Electricity 24/7",
  "High speed WiFi",
  "Smart TV & streaming services",
  "Hot water",
] as const;

interface Unit {
  id: string;
  name: string;
  city: string;
  location: string;
  description: string;
  price: number;
  priceWeekday: number;
  priceWeekend: number;
  beds: number;
  baths: number;
  maxGuests: number;
  amenities: string[];
  image: string | null;
  photos: string[];
}

/** Page size — load fewer cards on mobile to stay snappy on slower connections. */
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

interface AppliedFilters {
  keyword: string;
  city: string;
  bed: AnyOption;
  bath: AnyOption;
  maxBudget: number;
  amenities: string[];
  submitted: boolean;
}

interface PageResult {
  units: Unit[];
  nextOffset: number | null;
}

/**
 * Server-side paginated fetch. Pushes every filter into the SQL query so we
 * never load all rows in memory. Returns `nextOffset = null` when there are
 * no more rows.
 */
async function fetchUnitsPage(
  applied: AppliedFilters,
  offset: number,
  pageSize: number,
): Promise<PageResult> {
  let query = supabase
    .from("listings")
    .select(
      "id, title, description, location, price_per_night, price_weekday, price_weekend, bedrooms, bathrooms, amenities, listing_photos(photo_url, display_order)",
    )
    .eq("is_active", true);

  // City — match anything before the first comma in `location` (e.g. "Beirut, Lebanon")
  if (applied.city !== "All Cities") {
    query = query.ilike("location", `${applied.city}%`);
  }

  // Bedrooms / bathrooms
  if (applied.bed !== "Any") {
    if (applied.bed === "5+") query = query.gte("bedrooms", 5);
    else query = query.eq("bedrooms", Number(applied.bed));
  }
  if (applied.bath !== "Any") {
    if (applied.bath === "5+") query = query.gte("bathrooms", 5);
    else query = query.eq("bathrooms", Number(applied.bath));
  }

  // Budget — compare against the lower of weekday/weekend
  query = query.lte("price_weekday", applied.maxBudget);

  // Amenities — array contains all selected
  if (applied.amenities.length > 0) {
    query = query.contains("amenities", applied.amenities);
  }

  // Keyword — title / description / location
  const k = applied.keyword.trim();
  if (k) {
    const term = k.replace(/[%,]/g, " ");
    query = query.or(
      `title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  // Sort + paginate
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;
  const rows = data ?? [];
  const units: Unit[] = rows.map((l) => {
    const photos = (l.listing_photos ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order);
    const city = (l.location ?? "").split(",")[0].trim();
    const weekday = Number(l.price_weekday ?? l.price_per_night);
    const weekend = Number(l.price_weekend ?? l.price_per_night);
    return {
      id: l.id,
      name: l.title,
      city,
      location: l.location,
      description: l.description ?? "",
      price: weekday,
      priceWeekday: weekday,
      priceWeekend: weekend,
      beds: l.bedrooms ?? 0,
      baths: Number(l.bathrooms ?? 0),
      amenities: l.amenities ?? [],
      image: photos[0]?.photo_url ?? null,
      photos: photos.map((p) => p.photo_url),
    };
  });
  return {
    units,
    nextOffset: rows.length < pageSize ? null : offset + pageSize,
  };
}

/** Lightweight query — pulls only city + amenities for typeahead suggestions.
 *  Limited to 200 rows so it never explodes for 100+ listings. */
async function fetchSuggestionPool(): Promise<
  Pick<Unit, "id" | "name" | "location" | "city" | "image" | "amenities">[]
> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, location, listing_photos(photo_url, display_order), amenities")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((l) => {
    const photos = (l.listing_photos ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order);
    return {
      id: l.id,
      name: l.title,
      location: l.location,
      city: (l.location ?? "").split(",")[0].trim(),
      image: photos[0]?.photo_url ?? null,
      amenities: l.amenities ?? [],
    };
  });
}

export function FindYourUnit() {
  const pageSize = usePageSize();

  const maxPrice = 3000;
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState<string>("All Cities");
  const [bed, setBed] = useState<AnyOption>("Any");
  const [bath, setBath] = useState<AnyOption>("Any");
  const [maxBudget, setMaxBudget] = useState<number>(maxPrice);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const [applied, setApplied] = useState<AppliedFilters>({
    keyword: "",
    city: "All Cities",
    bed: "Any",
    bath: "Any",
    maxBudget,
    amenities: [],
    submitted: false,
  });
useEffect(() => {
    const saved = loadFindYourUnitState();
    if (!saved) return;
    if (saved.keyword) setKeyword(saved.keyword as string);
    if (saved.city) setCity(saved.city as string);
    if (saved.bed) setBed(saved.bed as AnyOption);
    if (saved.bath) setBath(saved.bath as AnyOption);
    if (saved.maxBudget) setMaxBudget(saved.maxBudget as number);
    if (saved.amenities) setAmenities(saved.amenities as string[]);
    if (saved.applied) setApplied(saved.applied as AppliedFilters);
  }, []);
  // Suggestion pool — small static-ish snapshot used for the typeahead and
  // the city dropdown. Cached for 5 minutes.
  const { data: suggestionPool = [] } = useQuery({
    queryKey: ["unit-suggestion-pool"],
    queryFn: fetchSuggestionPool,
    staleTime: 5 * 60_000,
  });

  const cities = useMemo(
    () => Array.from(new Set(suggestionPool.map((u) => u.city).filter(Boolean))).sort(),
    [suggestionPool],
  );

  // Paginated infinite query — every page is a fresh DB call with .range().
  // queryKey includes every applied filter so changing a filter starts a new
  // sequence (and TanStack caches each filter combo independently).
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["find-your-unit-listings", applied, pageSize],
    queryFn: ({ pageParam = 0 }) => fetchUnitsPage(applied, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const displayed = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.units),
    [data],
  );

  const totalLoaded = displayed.length;

  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const removeAmenity = (a: string) =>
    setAmenities((prev) => prev.filter((x) => x !== a));

  const handleSearch = () => {
    const newApplied = { keyword, city, bed, bath, maxBudget, amenities, submitted: true };
    setApplied(newApplied);
    saveFindYourUnitState({
      keyword, city, bed, bath, maxBudget, amenities, applied: newApplied,
    });
    requestAnimationFrame(() => {
      const el = document.getElementById("find-your-unit-results");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Live suggestions filtered from the small cached pool — never hits the DB.
  const suggestions = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return [];
    return suggestionPool
      .filter((u) => {
        const hay = `${u.name} ${u.location} ${u.city} ${u.amenities.join(" ")}`.toLowerCase();
        return hay.includes(k);
      })
      .slice(0, 6);
  }, [keyword, suggestionPool]);

  return (
    <section
      id="find-your-unit"
      className="relative border-b border-border"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 7%, white) 0%, color-mix(in oklab, var(--color-primary) 3%, white) 100%)",
      }}
    >
      <PatternBackground />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Search</p>
          <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl md:text-6xl font-serif font-medium">
            Find It. Book It. Love It
          </h2>
          <p className="mt-3 text-muted-foreground">
            Search by keyword, city, size, amenities and budget — all in one place.
          </p>
        </div>

        {/* Filter card */}
        <div className="mt-10 rounded-3xl border border-border bg-background p-5 shadow-sm sm:p-7">
          <p className="text-foreground font-serif font-extrabold text-center text-slate-950 text-xl bg-white">Find your perfect guesthouse.</p>

          <div className="mt-4 space-y-3">
            {/* Keyword search w/ live suggestions */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, city, location, description or amenity…"
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {keyword.trim().length > 0 && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover shadow-xl">
                  <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Matching listings
                  </p>
                  <ul className="pb-2">
                    {suggestions.map((u) => (
                      <li key={u.id}>
                        <Link
                          to="/listing/$id"
                          params={{ id: u.id }}
                          className="flex items-start gap-3 px-4 py-2.5 hover:bg-accent"
                        >
                          {u.image ? (
                            <img src={u.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded-md bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.location}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* City dropdown */}
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 w-full appearance-none rounded-full border border-border bg-background pl-11 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All Cities">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <ScrollPicker
              label="Bedrooms"
              icon={<Bed className="h-4 w-4 text-primary" />}
              options={BED_OPTIONS}
              value={bed}
              onChange={(v) => setBed(v)}
            />

            <ScrollPicker
              label="Bathrooms"
              icon={<Bath className="h-4 w-4 text-primary" />}
              options={BATH_OPTIONS}
              value={bath}
              onChange={(v) => setBath(v)}
            />

            <Popover open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-full border border-border bg-background px-4 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    Amenities
                    {amenities.length > 0 && (
                      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                        {amenities.length}
                      </span>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,380px)] p-4" align="start">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Select amenities
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AMENITIES.map((a) => {
                    const active = amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary hover:text-primary",
                        )}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setAmenities([])}
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmenitiesOpen(false)}
                    className="rounded-md bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
                  >
                    Done
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAmenity(a)}
                      className="rounded-full p-0.5 hover:bg-primary/20"
                      aria-label={`Remove ${a}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  Max budget per night
                </p>
                <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                  Up to ${maxBudget.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 px-1">
                <Slider
                  value={[maxBudget]}
                  min={0}
                  max={maxPrice}
                  step={50}
                  onValueChange={(v) => setMaxBudget(v[0])}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>$0</span>
                <span>${maxPrice.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Drag down from the top to lower your maximum.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div id="find-your-unit-results" className="mt-12 scroll-mt-24">
          <div className="flex items-end justify-between">
            <h3 className="font-display text-3xl text-foreground sm:text-4xl">
              {applied.submitted
                ? `${totalLoaded}${hasNextPage ? "+" : ""} ${totalLoaded === 1 ? "unit" : "units"} found`
                : "Available units"}
            </h3>
          </div>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-background p-12 text-center">
              <p className="font-display text-2xl">No units found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening your price range, picking a different city, or removing a filter.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayed.map((u, i) => (
                  <motion.article
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: "easeOut" }}
                    className="group overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                  >
                    <Link to="/listing/$id" params={{ id: u.id }} className="block" onClick={() => saveFindYourUnitState({ keyword, city, bed, bath, maxBudget, amenities, applied: { keyword, city, bed, bath, maxBudget, amenities, submitted: true } })}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <CardPhotoSlider
                          photos={u.photos}
                          alt={u.name}
                          fallback={
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              No photo
                            </div>
                          }
                        />
                        <div className="absolute right-3 top-3 z-[3] rounded-full bg-background/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground shadow">
                          From ${Math.min(u.priceWeekday, u.priceWeekend).toLocaleString()}/night
                        </div>
                        {u.amenities.some((a) => a.toLowerCase() === "breakfast included") && (
                          <div className="absolute left-3 top-3 z-[3] inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                            ☕ Breakfast
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h4 className="font-display text-xl text-foreground">{u.name}</h4>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {u.location}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-sm text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Bed className="h-4 w-4 text-primary" />
                            {u.beds} bedroom{u.beds !== 1 ? "s" : ""}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-primary" />
                            {u.baths} bath{u.baths !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {u.amenities.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {u.amenities.slice(0, 6).map((a) => (
                              <span
                                key={a}
                                className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.article>
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
        </div>
      </div>
    </section>
  );
}

interface ScrollPickerProps {
  label: string;
  icon: React.ReactNode;
  options: AnyOption[];
  value: AnyOption;
  onChange: (v: AnyOption) => void;
}

function ScrollPicker({ label, icon, options, value, onChange }: ScrollPickerProps) {
  return (
    <div className="rounded-full border border-border bg-background pl-4 pr-2">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-2 py-3 text-sm font-medium text-foreground">
          {icon}
          {label}
        </div>
        <div className="hide-scrollbar flex-1 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1.5 py-2">
            {options.map((opt) => {
              const active = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={cn(
                    "h-8 min-w-10 shrink-0 rounded-full px-3 text-xs font-semibold transition",
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-muted text-foreground hover:bg-muted/70",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
