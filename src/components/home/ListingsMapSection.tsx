import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PatternBackground } from "@/components/PatternBackground";
import { Reveal } from "@/components/Reveal";

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

function truncate(title: string, max = 18): string {
  return title.length > max ? `${title.slice(0, max).trimEnd()}…` : title;
}

function createPinWithLabelIcon(title: string) {
  const label = truncate(title);
  const html = `
  <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
    <span style="background:#fff;color:#0f172a;font-size:11px;font-weight:600;line-height:1;padding:3px 8px;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.25);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;font-family:inherit;border:1px solid rgba(0,0,0,0.08);">${label}</span>
    <span style="display:inline-flex;color:rgb(var(--color-primary-rgb, 59 130 246));margin-top:1px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
           fill="currentColor" stroke="white" stroke-width="1" aria-hidden="true">
        <path d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/>
      </svg>
    </span>
  </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [0, 0],
  });
}

export function ListingsMapSection() {
  const navigate = useNavigate();

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
          <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-border">
            <MapContainer
              center={[33.95, 35.75]}
              zoom={8.3}
              maxZoom={16}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {listings.map((listing) => (
                <Marker
                  key={listing.id}
                  position={[listing.latitude, listing.longitude]}
                  icon={createPinWithLabelIcon(listing.title)}
                  eventHandlers={{
                    click: () => navigate({ to: "/listing/$id", params: { id: listing.id } }),
                  }}
                />
              ))}
            </MapContainer>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default ListingsMapSection;
