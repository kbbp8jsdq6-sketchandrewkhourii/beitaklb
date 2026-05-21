import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Home } from "lucide-react";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initial?: { location?: string };
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
  const [openSuggest, setOpenSuggest] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const trimmed = location.trim();

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
      },
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full",
        variant === "hero" ? "max-w-2xl" : "max-w-xl"
      )}
    >
      <div className="glass grid grid-cols-[1fr_auto] gap-px overflow-hidden rounded-3xl">
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
            <div className="glass absolute left-0 top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl py-1">
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
                            try {
                              const here = window.location.pathname + window.location.search + window.location.hash;
                              if (!here.startsWith("/listing/")) {
                                sessionStorage.setItem("beitak:returnTo", here);
                              }
                            } catch {}
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

        <div className="flex items-center justify-center p-2">
          <Button
            onClick={handleSearch}
            size="lg"
            className="h-12 gap-2 rounded-2xl px-6"
          >
            <Search className="h-5 w-5" />
            <span className="font-semibold">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
