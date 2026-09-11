import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PatternBackground } from "@/components/PatternBackground";
import { Reveal } from "@/components/Reveal";

const ListingsMapInner = lazy(() => import("./ListingsMapInner"));

interface MapListing {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
}

async function fetchMapListings(): Promise<MapListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, latitude, longitude")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  if (error) throw error;
  return (data ?? []) as MapListing[];
}

export function ListingsMapSection() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["home-listings-map"],
    staleTime: 5 * 60_000,
    queryFn: fetchMapListings,
  });

  if (isLoading || listings.length === 0) return null;

  return (
    <section className="relative bg-background">
      <PatternBackground />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Discover</p>
          <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
            Explore on the Map
          </h2>
          <p className="mt-2 text-muted-foreground">Every stay, mapped across Lebanon</p>
        </Reveal>

        <Reveal className="mt-10">
          {mounted && (
            <Suspense fallback={null}>
              <ListingsMapInner
                listings={listings}
                onSelect={(id) => navigate({ to: "/listing/$id", params: { id } })}
              />
            </Suspense>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default ListingsMapSection;
