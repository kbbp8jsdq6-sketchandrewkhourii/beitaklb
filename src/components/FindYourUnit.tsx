import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bed, Bath, Search, MapPin, ChevronDown, SlidersHorizontal, X, Users, Minus, Plus, MessageCircle } from "lucide-react";
import { openChat } from "@/lib/chat-events";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    const bedrooms = bed === "Any" ? undefined : bed === "5+" ? 5 : Number(bed);
    const bathrooms = bath === "Any" ? undefined : bath === "5+" ? 5 : Number(bath);
    navigate({
      to: "/search",
      search: {
        q: keyword.trim() || undefined,
        location: city !== "All Cities" ? city : undefined,
        bedrooms,
        bathrooms,
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
      className="search-section relative border-b border-border"
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
        <div className="search-card mt-10 rounded-[22px] border border-border bg-card p-4 sm:p-7 lg:p-8">
          <h2 className="font-display text-[36px] leading-tight tracking-normal text-card-foreground md:text-[44px]">Find your perfect guesthouse.</h2>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-[2fr_2fr_1fr] md:gap-4">
            <div className="col-span-2 min-w-0 rounded-[14px] border border-border bg-card md:col-span-3 md:mr-[176px] md:flex">
            {/* Keyword search w/ live suggestions */}
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, city, location, description or amenity…"
                aria-label="Search guesthouses"
                className="h-[60px] w-full min-w-0 rounded-[14px] bg-transparent pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
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
            <div className="relative border-t border-border md:w-[220px] md:shrink-0 md:border-l md:border-t-0">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="City"
                className="h-[60px] w-full appearance-none rounded-[14px] bg-transparent pl-12 pr-10 text-base text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
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

            <div className="min-w-0 rounded-[14px] border border-border bg-card p-3 md:p-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground"><Users className="h-4 w-4 text-primary" />Guests</p>
              <div className="mt-3 grid h-10 grid-cols-[36px_1fr_36px] items-center rounded-lg bg-muted p-1">
                <Button variant="outline" size="icon" type="button" aria-label="Decrease guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} className="h-8 w-8 rounded-md border-border bg-card shadow-none"><Minus /></Button>
                <span className="text-center text-sm font-bold tabular-nums">{guests}</span>
                <Button variant="outline" size="icon" type="button" aria-label="Increase guests" onClick={() => setGuests((g) => Math.min(20, g + 1))} className="h-8 w-8 rounded-md border-border bg-card shadow-none"><Plus /></Button>
              </div>
            </div>

            <div className="min-w-0 rounded-[14px] border border-border bg-card p-3 md:col-span-1 md:p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground"><SlidersHorizontal className="h-4 w-4 text-primary" />Amenities</p>
            <Popover open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" type="button" aria-label="Choose amenities" className="mt-2 flex h-auto w-full flex-wrap justify-between gap-2 rounded-md p-0 text-left hover:bg-transparent">
                  <span className="min-w-0 whitespace-normal text-sm font-normal text-foreground">{amenities.length ? `${amenities.length} selected` : "Any amenities"}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Choose<ChevronDown className="h-4 w-4" /></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,380px)] p-4" align="start">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Select amenities
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AMENITIES.map((a) => {
                    const active = amenities.includes(a);
                    return (
                      <Button
                        key={a}
                        variant="ghost"
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={cn(
                          "h-auto rounded-full border px-3 py-1.5 text-xs font-semibold shadow-none transition",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary hover:text-primary",
                        )}
                      >
                        {a}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-between">
                  <Button
                    type="button"
                    onClick={() => setAmenities([])}
                    variant="ghost" className="h-auto p-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAmenitiesOpen(false)}
                    className="rounded-md bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
                  >
                    Done
                  </Button>
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
                    <Button
                      type="button"
                      onClick={() => removeAmenity(a)}
                      variant="ghost" className="h-auto rounded-full p-0.5 hover:bg-primary/20"
                      aria-label={`Remove ${a}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            )}

            </div>

            <div className="col-span-2 min-w-0 rounded-[14px] border border-border bg-card p-4 md:col-span-2">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground"><SlidersHorizontal className="h-4 w-4 text-primary" />Budget per night</p>
                <span className="mt-2 block font-display text-[30px] leading-tight tracking-normal text-foreground">
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
              <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-start gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold">$0</span>
                <span className="text-center">Drag both handles to set your price range.</span>
                <span className="font-semibold">${maxPrice.toLocaleString()}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSearch}
              className="col-span-2 h-[60px] w-full rounded-[14px] text-base font-bold uppercase md:col-span-3 md:row-start-1 md:ml-auto md:w-[160px]"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Not sure where to start?{" "}
            <Button type="button" onClick={() => openChat()} variant="link" className="inline-flex h-auto items-center gap-1.5 whitespace-normal p-0 font-semibold text-primary">
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="underline underline-offset-[3px]">Ask our AI assistant</span>
            </Button>
          </p>
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
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
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
        className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-card shadow active:cursor-grabbing"
        style={{ left: `${minPct}%` }}
      />
      <div
        onPointerDown={dragMax}
        className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-card shadow active:cursor-grabbing"
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
    <div role="group" aria-label={label} className="col-span-2 min-w-0 rounded-[14px] border border-border bg-card p-3 md:col-span-1 md:p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground">{icon}{label}</p>
      <div className="mt-3 grid h-10 grid-cols-7 items-center rounded-lg bg-muted p-1">
        {options.map((opt) => (
          <Button key={opt} variant="ghost" type="button" aria-pressed={value === opt} onClick={() => onChange(opt)} className={cn(
            "h-8 min-w-0 rounded-md px-0 text-xs font-semibold shadow-none",
            value === opt ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-foreground hover:bg-card",
          )}>{opt}</Button>
        ))}
      </div>
    </div>
  );
}
