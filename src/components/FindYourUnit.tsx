import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bed, Bath, Search, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type BedOption = "Studio" | "1" | "2" | "3+";
type BathOption = "1" | "2" | "3+";

const BED_OPTIONS: BedOption[] = ["Studio", "1", "2", "3+"];
const BATH_OPTIONS: BathOption[] = ["1", "2", "3+"];
const AMENITIES = [
  "Pool",
  "Gym",
  "Parking",
  "Pet Friendly",
  "Washer/Dryer",
  "Balcony",
  "AC",
] as const;

interface Unit {
  id: string;
  name: string;
  location: string;
  price: number;
  beds: number; // 0 = studio
  baths: number;
  amenities: string[];
  image: string;
}

const UNITS: Unit[] = [
  {
    id: "u1",
    name: "Cedar Loft",
    location: "Beirut, Mar Mikhael",
    price: 850,
    beds: 0,
    baths: 1,
    amenities: ["AC", "Balcony", "Washer/Dryer"],
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u2",
    name: "Mountain Retreat",
    location: "Bcharre",
    price: 1400,
    beds: 2,
    baths: 2,
    amenities: ["Parking", "Balcony", "AC", "Pet Friendly"],
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u3",
    name: "Marina View Suite",
    location: "Byblos",
    price: 2300,
    beds: 3,
    baths: 2,
    amenities: ["Pool", "Gym", "Parking", "AC"],
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u4",
    name: "Olive Garden Studio",
    location: "Batroun",
    price: 650,
    beds: 0,
    baths: 1,
    amenities: ["AC", "Washer/Dryer"],
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u5",
    name: "Cornish Penthouse",
    location: "Beirut, Manara",
    price: 4200,
    beds: 3,
    baths: 3,
    amenities: ["Pool", "Gym", "Parking", "Balcony", "AC", "Washer/Dryer"],
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u6",
    name: "Cozy Family Flat",
    location: "Jounieh",
    price: 1100,
    beds: 2,
    baths: 1,
    amenities: ["Parking", "AC", "Pet Friendly", "Balcony"],
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "u7",
    name: "Designer One-Bed",
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
    location: "Broummana",
    price: 3400,
    beds: 3,
    baths: 3,
    amenities: ["Pool", "Parking", "Pet Friendly", "Balcony", "AC"],
    image:
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
  },
];

function bedsMatch(unitBeds: number, selected: BedOption | null): boolean {
  if (!selected) return true;
  if (selected === "Studio") return unitBeds === 0;
  if (selected === "3+") return unitBeds >= 3;
  return unitBeds === Number(selected);
}

function bathsMatch(unitBaths: number, selected: BathOption | null): boolean {
  if (!selected) return true;
  if (selected === "3+") return unitBaths >= 3;
  return unitBaths === Number(selected);
}

export function FindYourUnit() {
  const [bed, setBed] = useState<BedOption | null>(null);
  const [bath, setBath] = useState<BathOption | null>(null);
  const [price, setPrice] = useState<[number, number]>([500, 5000]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [applied, setApplied] = useState({
    bed: null as BedOption | null,
    bath: null as BathOption | null,
    price: [500, 5000] as [number, number],
    amenities: [] as string[],
  });

  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const reset = () => {
    setBed(null);
    setBath(null);
    setPrice([500, 5000]);
    setAmenities([]);
    setApplied({ bed: null, bath: null, price: [500, 5000], amenities: [] });
  };

  const apply = () => setApplied({ bed, bath, price, amenities });

  const results = useMemo(
    () =>
      UNITS.filter(
        (u) =>
          bedsMatch(u.beds, applied.bed) &&
          bathsMatch(u.baths, applied.bath) &&
          u.price >= applied.price[0] &&
          u.price <= applied.price[1] &&
          applied.amenities.every((a) => u.amenities.includes(a)),
      ),
    [applied],
  );

  return (
    <section id="find-your-unit" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Search
          </p>
          <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
            Find your unit
          </h2>
          <p className="mt-3 text-muted-foreground">
            Filter by bedrooms, bathrooms, monthly budget and the amenities you love.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mt-10 rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Bedrooms */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bedrooms
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BED_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBed(bed === opt ? null : opt)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      bed === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bathrooms
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BATH_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBath(bath === opt ? null : opt)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      bath === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Monthly price
                </p>
                <p className="text-sm font-semibold text-foreground">
                  ${price[0].toLocaleString()} – ${price[1].toLocaleString()}
                </p>
              </div>
              <div className="mt-4 px-1">
                <Slider
                  value={price}
                  min={500}
                  max={5000}
                  step={50}
                  onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Amenities
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
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
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
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground transition hover:border-foreground"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={apply}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-10 flex items-end justify-between">
          <h3 className="font-display text-2xl text-foreground">
            {results.length} {results.length === 1 ? "unit" : "units"} available
          </h3>
        </div>

        {results.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-12 text-center">
            <p className="font-display text-2xl">No matching units</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try widening your price range or removing a filter.
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
                      {u.beds === 0 ? "Studio" : `${u.beds} bed${u.beds > 1 ? "s" : ""}`}
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
    </section>
  );
}
