import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bed, Bath, Search, MapPin, ChevronDown, SlidersHorizontal, X, Users, Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PatternBackground } from "@/components/PatternBackground";

type AnyOption = "Any" | "1" | "2" | "3" | "4" | "5" | "5+";

const BED_OPTIONS: AnyOption[] = ["Any", "1", "2", "3", "4", "5", "5+"];
const BATH_OPTIONS: AnyOption[] = ["Any", "1", "2", "3", "4", "5", "5+"];

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

interface SuggestionUnit {
  id: string;
  name: string;
  location: string;
  city: string;
  image: string | null;
  amenities: string[];
}

/** Lightweight query — pulls only city + amenities for typeahead suggestions.
 *  Limited to 200 rows so it never explodes for 100+ listings. */
async function fetchSuggestionPool(): Promise<SuggestionUnit[]> {
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
  const navigate = useNavigate();
  const maxPrice = 2000;
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState<string>("All Cities");
  const [bed, setBed] = useState<AnyOption>("Any");
  const [bath, setBath] = useState<AnyOption>("Any");
  const [guests, setGuests] = useState<number>(1);
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(maxPrice);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

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

  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const removeAmenity = (a: string) =>
    setAmenities((prev) => prev.filter((x) => x !== a));

  const handleSearch = () => {
    navigate({
      to: "/search",
      search: {
        q: keyword.trim() || undefined,
        location: city !== "All Cities" ? city : undefined,
        guests: guests > 1 ? guests : undefined,
        minBudget: minBudget > 0 ? minBudget : undefined,
        maxBudget: maxBudget < 2000 ? maxBudget : undefined,
        amenities: amenities.length > 0 ? amenities : [],
      },
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
            Search by keyword, city, size, amenities and budget - all in one place.
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

            <div className="flex h-12 w-full items-center justify-between rounded-full border border-border bg-background px-4">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Guests
              </span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary disabled:opacity-40">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-4 text-center text-sm font-bold">{guests}</span>
                <button type="button" onClick={() => setGuests((g) => Math.min(20, g + 1))} className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted transition hover:border-primary hover:text-primary">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>


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
                <p className="text-sm font-bold text-foreground">Budget per night</p>
                <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                  ${minBudget.toLocaleString()} - ${maxBudget.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 px-1">
                <DualSlider
                  min={0}
                  max={maxPrice}
                  step={50}
                  valueMin={minBudget}
                  valueMax={maxBudget}
                  onChangeMin={setMinBudget}
                  onChangeMax={setMaxBudget}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>$0</span>
                <span>${maxPrice.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Drag both handles to set your price range.
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
      </div>
    </section>
  );
}

function DualSlider({
  min, max, step, valueMin, valueMax, onChangeMin, onChangeMax,
}: {
  min: number; max: number; step: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const toPercent = (v: number) => ((v - min) / (max - min)) * 100;

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  };

  const dragMin = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const val = Math.min(fromPointer(ev.clientX), valueMax - step);
      onChangeMin(Math.max(min, val));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const dragMax = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const val = Math.max(fromPointer(ev.clientX), valueMin + step);
      onChangeMax(Math.min(max, val));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const minPct = toPercent(valueMin);
  const maxPct = toPercent(valueMax);

  return (
    <div className="relative h-6 select-none" ref={trackRef}>
      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/20" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
      />
      <div
        onPointerDown={dragMin}
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-primary/50 bg-background shadow active:cursor-grabbing"
        style={{ left: `${minPct}%` }}
      />
      <div
        onPointerDown={dragMax}
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-primary/50 bg-background shadow active:cursor-grabbing"
        style={{ left: `${maxPct}%` }}
      />
    </div>
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
