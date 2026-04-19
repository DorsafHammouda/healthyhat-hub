import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#4CAF50;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:grid;place-items:center;font-size:18px;">🧑</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const storeIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:white;border:2px solid #4CAF50;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:grid;place-items:center;"><span style="transform:rotate(45deg);font-size:14px">🧺</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

type Store = { id: string; name: string; type: string; lat: number; lng: number };

const TYPE_LABELS: Record<string, string> = {
  supermarket: "Supermarket",
  convenience: "Convenience store",
  greengrocer: "Greengrocer",
  grocery: "Grocery",
  health_food: "Health foods",
  farm: "Farm shop",
};

function StoreLoader({ onStores, onLoading }: { onStores: (s: Store[]) => void; onLoading: (b: boolean) => void }) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchStores = async () => {
      const b = map.getBounds();
      const s = b.getSouth().toFixed(5);
      const w = b.getWest().toFixed(5);
      const n = b.getNorth().toFixed(5);
      const e = b.getEast().toFixed(5);
      const query = `[out:json][timeout:15];(node["shop"~"supermarket|convenience|greengrocer|grocery|health_food|farm"](${s},${w},${n},${e});way["shop"~"supermarket|convenience|greengrocer|grocery|health_food|farm"](${s},${w},${n},${e}););out center 60;`;
      onLoading(true);
      try {
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
        });
        if (!res.ok) throw new Error("overpass");
        const json: { elements: Array<{ id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> } = await res.json();
        const seen = new Set<string>();
        const stores: Store[] = [];
        for (const el of json.elements) {
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (lat == null || lng == null) continue;
          const id = `${el.type}/${el.id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const shop = el.tags?.shop ?? "grocery";
          stores.push({
            id,
            name: el.tags?.name ?? "Unnamed grocery",
            type: TYPE_LABELS[shop] ?? shop,
            lat,
            lng,
          });
          if (stores.length >= 60) break;
        }
        if (!cancelled) onStores(stores);
      } catch {
        // ignore
      } finally {
        if (!cancelled) onLoading(false);
      }
    };

    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fetchStores, 500);
    };

    fetchStores();
    map.on("moveend", debounced);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      map.off("moveend", debounced);
    };
  }, [map, onStores, onLoading]);

  return null;
}

export default function StoresMap({ pos }: { pos: [number, number] }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer center={pos} zoom={15} style={{ height: "70vh", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pos} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {stores.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={storeIcon}>
            <Popup>
              <strong>{s.name}</strong>
              <br />
              <span style={{ color: "#666" }}>{s.type}</span>
            </Popup>
          </Marker>
        ))}
        <StoreLoader onStores={setStores} onLoading={setLoading} />
      </MapContainer>
      {loading && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", padding: "6px 12px", borderRadius: 999, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 12, color: "#4CAF50", fontWeight: 600 }}>
          Loading stores…
        </div>
      )}
    </div>
  );
}
