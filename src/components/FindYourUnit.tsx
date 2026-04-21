import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bed, Bath, Search, MapPin, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
] as const;

interface Unit {
  id: string;
  name: string;
  city: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  amenities: string[];
  image: string;
}

const UNITS: Unit[] = [
  {
    id: "u1",
    name: "Cedar Loft",
    city: "Beirut",
    location: "Beirut, Mar Mikhael",
    price: 850,
    beds: 1,
    baths: 1,
    amenities: ["AC", "Balcony", "Washer/Dryer"],
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u2",
    name: "Mountain Retreat",
    city: "Bcharre",
    location: "Bcharre",
    price: 1400,
    beds: 2,
    baths: 2,
    amenities: ["Parking", "Balcony", "AC", "Pet Friendly", "Chimney"],
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u3",
    name: "Marina View Suite",
    city: "Byblos",
    location: "Byblos",
    price: 2300,
    beds: 3,
    baths: 2,
    amenities: ["Pool", "Gym", "Parking", "AC", "Beach Access", "Jacuzzi"],
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u4",
    name: "Olive Garden Studio",
    city: "Batroun",
    location: "Batroun",
    price: 650,
    beds: 1,
    baths: 1,
    amenities: ["AC", "Washer/Dryer", "BBQ Area"],
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u5",
    name: "Cornish Penthouse",
    city: "Beirut",
    location: "Beirut, Manara",
    price: 2950,
    beds: 3,
    baths: 3,
    amenities: ["Pool", "Gym", "Parking", "Balcony", "AC", "Washer/Dryer", "Jacuzzi"],
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u6",
    name: "Cozy Family Flat",
    city: "Jounieh",
    location: "Jounieh",
    price: 1100,
    beds: 2,
    baths: 1,
    amenities: ["Parking", "AC", "Pet Friendly", "Balcony", "Wheelchair Accessibility"],
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u7",
    name: "Designer One-Bed",
    city: "Beirut",
    location: "Beirut, Achrafieh",
    price: 1600,
    beds: 1,
    baths: 1,
    amenities: ["Gym", "AC", "Washer/Dryer", "Balcony"],
    image:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u8",
    name: "Hillside Villa",
    city: "Broummana",
    location: "Broummana",
    price: 2750,
    beds: 5,
    baths: 4,
    amenities: ["Pool", "Parking", "Pet Friendly", "Balcony", "AC", "BBQ Area", "Chimney"],
    image:
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u9",
    name: "Faraya Chalet",
    city: "Faraya",
    location: "Faraya",
    price: 1800,
    beds: 4,
    baths: 3,
    amenities: ["Parking", "AC", "Chimney", "BBQ Area", "Jacuzzi"],
    image:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=80",
  },
];

const CITIES = Array.from(new Set(UNITS.map((u) => u.city))).sort();

function countMatch(value: number, selected: AnyOption): boolean {
  if (selected === "Any") return true;
  if (selected === "5+") return value >= 5;
  return value === Number(selected);
}

export function FindYourUnit() {
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState<string>("All Cities");
  const [bed, setBed] = useState<AnyOption>("Any");
  const [bath, setBath] = useState<AnyOption>("Any");
  const [price, setPrice] = useState<[number, number]>([0, 3000]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const [applied, setApplied] = useState({
    keyword: "",
    city: "All Cities",
    bed: "Any" as AnyOption,
    bath: "Any" as AnyOption,
    price: [0, 3000] as [number, number],
    amenities: [] as string[],
    submitted: false,
  });

  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const removeAmenity = (a: string) =>
    setAmenities((prev) => prev.filter((x) => x !== a));

  const handleSearch = () => {
    setApplied({ keyword, city, bed, bath, price, amenities, submitted: true });
    // Smooth scroll to results
    requestAnimationFrame(() => {
      const el = document.getElementById("find-your-unit-results");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const results = useMemo(() => {
    const k = applied.keyword.trim().toLowerCase();
    return UNITS.filter((u) => {
      if (applied.city !== "All Cities" && u.city !== applied.city) return false;
      if (!countMatch(u.beds, applied.bed)) return false;
      if (!countMatch(u.baths, applied.bath)) return false;
      if (u.price < applied.price[0] || u.price > applied.price[1]) return false;
      if (!applied.amenities.every((a) => u.amenities.includes(a))) return false;
      if (k) {
        const haystack = `${u.name} ${u.location} ${u.city} ${u.amenities.join(" ")}`.toLowerCase();
        if (!haystack.includes(k)) return false;
      }
      return true;
    });
  }, [applied]);

  return (
    <section
      id="find-your-unit"
      className="border-b border-border"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 7%, white) 0%, color-mix(in oklab, var(--color-primary) 3%, white) 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
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
            {/* Keyword search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, location or feature…"
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
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
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Bedrooms — horizontal scroll picker */}
            <ScrollPicker
              label="Bedrooms"
              icon={<Bed className="h-4 w-4 text-primary" />}
              options={BED_OPTIONS}
              value={bed}
              onChange={(v) => setBed(v)}
            />

            {/* Bathrooms — horizontal scroll picker */}
            <ScrollPicker
              label="Bathrooms"
              icon={<Bath className="h-4 w-4 text-primary" />}
              options={BATH_OPTIONS}
              value={bath}
              onChange={(v) => setBath(v)}
            />

            {/* Amenities popover button */}
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

            {/* Selected amenity tags */}
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

            {/* Price range */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  Price Range: Min. to Max.
                </p>
              </div>
              <div className="mt-4 px-1">
                <Slider
                  value={price}
                  min={0}
                  max={3000}
                  step={50}
                  onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-md bg-foreground px-2.5 py-1 text-xs font-bold text-background">
                  ${price[0]}
                </span>
                <span className="rounded-md bg-foreground px-2.5 py-1 text-xs font-bold text-background">
                  ${price[1]}
                </span>
              </div>
            </div>

            {/* Search button */}
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
                ? `${results.length} ${results.length === 1 ? "unit" : "units"} found`
                : "Available units"}
            </h3>
          </div>

          {results.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-background p-12 text-center">
              <p className="font-display text-2xl">No units found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening your price range, picking a different city, or removing a filter.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((u, i) => (
                <motion.article
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                  className="group overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={u.image}
                      alt={u.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute right-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground shadow">
                      ${u.price.toLocaleString()}/mo
                    </div>
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
                        {u.beds} bed{u.beds > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bath className="h-4 w-4 text-primary" />
                        {u.baths} bath{u.baths > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {u.amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
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
