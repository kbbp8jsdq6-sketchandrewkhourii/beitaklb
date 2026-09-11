import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapListing {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
}

function truncate(title: string, max = 18): string {
  return title.length > max ? `${title.slice(0, max).trimEnd()}…` : title;
}

function createPinWithLabelIcon(title: string) {
  const label = truncate(title);
  const html = `
  <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
    <span style="background:#fff;color:#0f172a;font-size:11px;font-weight:600;line-height:1;padding:3px 8px;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.25);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(0,0,0,0.08);">${label}</span>
    <span style="display:inline-flex;color:rgb(59 130 246);">
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

export function ListingsMapInner({
  listings,
  onSelect,
}: {
  listings: MapListing[];
  onSelect: (id: string) => void;
}) {
  return (
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
              click: () => onSelect(listing.id),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default ListingsMapInner;
