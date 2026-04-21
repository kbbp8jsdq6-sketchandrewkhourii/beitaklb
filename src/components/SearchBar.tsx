import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, CalendarDays, Users, Home } from "lucide-react";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initial?: { location?: string; checkIn?: string; checkOut?: string; guests?: number };
  variant?: "hero" | "compact";
}

type ListingSuggestion = {
  id: string;
  title: string;
  location: string;
};

export function SearchBar({ initial, variant = "hero" }: SearchBarProps) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initial?.location ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? "");
  const [guests, setGuests] = useState<number>(initial?.guests ?? 1);
  const [openSuggest, setOpenSuggest] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const trimmed = location.trim();

  // Live listing suggestions — search across title, location, description, amenities
  const { data: listingMatches = [] } = useQuery<ListingSuggestion[]>({
    queryKey: ["search-suggest", trimmed.toLowerCase()],
    enabled: trimmed.length >= 1,
    staleTime: 15_000,
    queryFn: async () => {
      const term = trimmed.replace(/[%,]/g, " ");
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, location, description, amenities")
        .eq("is_active", true)
        .or(
          `title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%,amenities.cs.{${term}}`
        )
        .limit(8);
      if (error) {
        // Fallback: simpler query if amenities array literal causes issue
        const { data: d2 } = await supabase
          .from("listings")
          .select("id, title, location")
          .eq("is_active", true)
          .or(`title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%`)
          .limit(8);
        return (d2 ?? []).map((l) => ({ id: l.id, title: l.title, location: l.location }));
      }
      return (data ?? []).map((l) => ({ id: l.id, title: l.title, location: l.location }));
    },
  });

  const cityMatches = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return LEBANESE_LOCATIONS.filter((l) => l.toLowerCase().includes(q)).slice(0, 5);
  }, [trimmed]);

  const showDropdown = openSuggest && trimmed.length >= 1;
  const hasResults = listingMatches.length > 0 || cityMatches.length > 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpenSuggest(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = () => {
    setOpenSuggest(false);
    navigate({
      to: "/search",
      search: {
        q: location || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: guests > 1 ? guests : undefined,
      },
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full",
        variant === "hero" ? "max-w-4xl" : "max-w-3xl"
      )}
    >
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-card shadow-lg sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        {/* Location / keyword */}
        <div className="relative flex items-center gap-3 px-5 py-3">
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex flex-1 flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Where</label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setOpenSuggest(true);
              }}
              onFocus={() => setOpenSuggest(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search by name, city, amenity…"
              className="bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {showDropdown && (
            <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-xl">
              {!hasResults && (
                <p className="px-4 py-3 text-sm text-muted-foreground">No matches yet…</p>
              )}
              {listingMatches.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Listings
                  </p>
                  <ul>
                    {listingMatches.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setOpenSuggest(false);
                            navigate({ to: "/listing/$id", params: { id: l.id } });
                          }}
                          className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-accent"
                        >
                          <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{l.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{l.location}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {cityMatches.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Cities & villages
                  </p>
                  <ul>
                    {cityMatches.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setLocation(s);
                            setOpenSuggest(false);
                            navigate({ to: "/search", search: { q: s } });
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent"
                        >
                          <MapPin className="h-4 w-4 text-primary" />
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* Check-in */}
        <div className="flex items-center gap-3 border-t border-border px-5 py-3 sm:border-l sm:border-t-0">
          <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Check in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-center gap-3 border-t border-border px-5 py-3 sm:border-l sm:border-t-0">
          <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Check out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(e) => setCheckOut(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-3 border-t border-border px-5 py-3 sm:border-l sm:border-t-0">
          <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Guests</label>
            <input
              type="number"
              min={1}
              max={32}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              className="bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center justify-center border-t border-border bg-card p-2 sm:border-l sm:border-t-0">
          <Button
            onClick={handleSearch}
            size="lg"
            className="h-12 w-full gap-2 rounded-2xl px-6 sm:w-auto"
          >
            <Search className="h-5 w-5" />
            <span className="font-semibold">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
