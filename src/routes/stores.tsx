import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Nearby Stores — HealthyHat" },
      { name: "description", content: "Find grocery stores near your current location on the map." },
    ],
  }),
  component: StoresPage,
});

const storeIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#4CAF50;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:grid;place-items:center;"><span style="transform:rotate(45deg);font-size:14px">🛒</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const DEFAULT: [number, number] = [40.7128, -74.006]; // NYC fallback

function StoresPage() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      setPos(DEFAULT);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => { setDenied(true); setPos(DEFAULT); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const stores = useMemo(() => {
    if (!pos) return [];
    const [lat, lng] = pos;
    return [
      { name: "Green Garden Market", type: "Organic grocer", lat: lat + 0.004, lng: lng + 0.003 },
      { name: "Fresh & Co.", type: "Supermarket", lat: lat - 0.003, lng: lng + 0.005 },
      { name: "Nature's Basket", type: "Health foods", lat: lat + 0.002, lng: lng - 0.004 },
      { name: "Daily Harvest", type: "Produce shop", lat: lat - 0.005, lng: lng - 0.002 },
    ];
  }, [pos]);

  return (
    <MobileShell title="Nearby Stores">
      {denied && (
        <p className="mb-3 rounded-2xl bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
          Location unavailable — showing a demo area.
        </p>
      )}
      <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
        {pos ? (
          <MapContainer
            center={pos}
            zoom={15}
            style={{ height: "70vh", width: "100%" }}
            scrollWheelZoom
          >
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
        ) : (
          <div className="grid h-[70vh] place-items-center text-sm text-muted-foreground">Locating you…</div>
        )}
      </div>
    </MobileShell>
  );
}
