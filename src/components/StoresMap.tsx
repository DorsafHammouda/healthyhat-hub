import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";

const storeIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#4CAF50;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:grid;place-items:center;"><span style="transform:rotate(45deg);font-size:14px">🛒</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

type Store = { name: string; type: string; lat: number; lng: number };

export default function StoresMap({ pos, stores }: { pos: [number, number]; stores: Store[] }) {
  return (
    <MapContainer center={pos} zoom={15} style={{ height: "70vh", width: "100%" }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={pos} radius={9} pathOptions={{ color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.9 }}>
        <Popup>You are here</Popup>
      </CircleMarker>
      {stores.map((s) => (
        <Marker key={s.name} position={[s.lat, s.lng]} icon={storeIcon}>
          <Popup>
            <strong>{s.name}</strong>
            <br />
            <span style={{ color: "#666" }}>{s.type}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
