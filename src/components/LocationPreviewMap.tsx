import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

const PIN_HTML = `
<span class="text-primary" style="display:inline-flex;transform:translate(-50%,-100%);">
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
       fill="currentColor" stroke="white" stroke-width="1" aria-hidden="true">
    <path d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/>
  </svg>
</span>`;

function createPinIcon() {
  return L.divIcon({
    html: PIN_HTML,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [0, 0],
  });
}

export function LocationPreviewMap({ latitude, longitude, className }: LocationPreviewMapProps) {
  return (
    <div
      className={`h-[280px] w-full overflow-hidden rounded-2xl border border-border ${className ?? ""}`}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        maxZoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={15}
        />
        <Marker position={[latitude, longitude]} icon={createPinIcon()} />
      </MapContainer>
    </div>
  );
}

export default LocationPreviewMap;
