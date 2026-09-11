import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { X } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapListing {
  id: string;
  title: string;
  location: string | null;
  latitude: number;
  longitude: number;
  cover: string | null;
}

const PIN_COLOR = "oklch(0.605 0.231 27.5)";

function createPinIcon() {
  const html = `
  <span style="display:inline-flex;transform:translate(-50%,-100%);color:${PIN_COLOR};">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="currentColor" stroke="white" stroke-width="1" aria-hidden="true">
      <path d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/>
    </svg>
  </span>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [0, 0],
  });
}

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

export function ListingsMapInner({
  listings,
  onSelect,
}: {
  listings: MapListing[];
  onSelect: (id: string) => void;
}) {
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveListingId(null), 200);
  };

  const active = listings.find((l) => l.id === activeListingId) ?? null;

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[33.95, 35.75]}
        zoom={8.3}
        maxZoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapClickHandler onClick={() => setActiveListingId(null)} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            icon={createPinIcon()}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e as unknown as Event);
                cancelClose();
                setActiveListingId(listing.id);
              },
              mouseover: () => {
                cancelClose();
                setActiveListingId(listing.id);
              },
              mouseout: () => scheduleClose(),
            }}
          />
        ))}
      </MapContainer>

      {active && (
        <div
          role="button"
          tabIndex={0}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onClick={() => onSelect(active.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelect(active.id);
          }}
          className="absolute bottom-4 left-1/2 z-[1000] w-[280px] -translate-x-1/2 cursor-pointer overflow-hidden rounded-xl bg-card text-left shadow-xl"
        >
          <div className="relative">
            {active.cover ? (
              <img
                src={active.cover}
                alt={active.title}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="aspect-video w-full bg-muted" />
            )}
            <button
              type="button"
              aria-label="Close preview"
              onClick={(e) => {
                e.stopPropagation();
                setActiveListingId(null);
              }}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3">
            <p className="truncate font-semibold text-foreground">{active.title}</p>
            {active.location && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{active.location}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingsMapInner;
