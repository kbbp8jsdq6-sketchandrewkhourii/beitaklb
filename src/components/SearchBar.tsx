import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin, CalendarDays, Users } from "lucide-react";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initial?: { location?: string; checkIn?: string; checkOut?: string; guests?: number };
  variant?: "hero" | "compact";
}

export function SearchBar({ initial, variant = "hero" }: SearchBarProps) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initial?.location ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? "");
  const [guests, setGuests] = useState<number>(initial?.guests ?? 1);
  const [openSuggest, setOpenSuggest] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!location.trim()) return [];
    const q = location.toLowerCase();
    return LEBANESE_LOCATIONS.filter((l) => l.toLowerCase().includes(q)).slice(0, 8);
  }, [location]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpenSuggest(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = () => {
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
        {/* Location */}
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
              placeholder="Search Lebanese villages…"
              className="bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {openSuggest && suggestions.length > 0 && (
            <ul className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-xl">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(s);
                      setOpenSuggest(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
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
