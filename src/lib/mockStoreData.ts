// Shared mock store data used by Grocery List, Stores map, and "next nearest store" logic.
// Real chain names with fictional price multipliers for cost estimation.

export type MockStore = {
  name: string;
  multiplier: number;
  // Offset from the user's current location (degrees lat/lng)
  // Stable demo positions so each chain has a consistent location near the user.
  offsetLat: number;
  offsetLng: number;
};

export const MOCK_STORES: MockStore[] = [
  { name: "Aldi", multiplier: 0.8, offsetLat: 0.004, offsetLng: -0.006 },
  { name: "Walmart", multiplier: 0.9, offsetLat: -0.007, offsetLng: 0.005 },
  { name: "Target", multiplier: 1.0, offsetLat: 0.009, offsetLng: 0.008 },
  { name: "Trader Joe's", multiplier: 1.1, offsetLat: -0.005, offsetLng: -0.009 },
  { name: "Sprouts", multiplier: 1.2, offsetLat: 0.012, offsetLng: -0.004 },
  { name: "Whole Foods", multiplier: 1.3, offsetLat: -0.011, offsetLng: 0.011 },
];

const EARTH_R = 6371; // km
function haversine(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

export type RankedStore = MockStore & {
  lat: number;
  lng: number;
  distanceKm: number;
};

export function rankStores(userPos: [number, number] | null): RankedStore[] {
  const base: [number, number] = userPos ?? [37.7749, -122.4194];
  return MOCK_STORES.map((s) => {
    const lat = base[0] + s.offsetLat;
    const lng = base[1] + s.offsetLng;
    return { ...s, lat, lng, distanceKm: haversine(base, [lat, lng]) };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getNearestStore(userPos: [number, number] | null): RankedStore {
  return rankStores(userPos)[0];
}

export function getNextStoreAfter(
  currentStoreName: string | null,
  userPos: [number, number] | null,
): RankedStore | null {
  const ranked = rankStores(userPos);
  if (!currentStoreName) return ranked[0] ?? null;
  const idx = ranked.findIndex((s) => s.name === currentStoreName);
  if (idx === -1) return ranked[0] ?? null;
  return ranked[idx + 1] ?? null;
}

export function getStoreByName(name: string | null): MockStore | null {
  if (!name) return null;
  return MOCK_STORES.find((s) => s.name === name) ?? null;
}

// Deterministic base price for an item, $1.00–$8.00.
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function basePriceFor(itemName: string): number {
  return 1 + (hash(itemName.toLowerCase()) % 700) / 100; // 1.00 - 7.99
}

export function estimateItemPrice(itemName: string, multiplier: number): number {
  return Math.round(basePriceFor(itemName) * multiplier * 100) / 100;
}

export function directionsUrl(lat: number, lng: number, label?: string) {
  const dest = label
    ? `${encodeURIComponent(label)}+near+${lat},${lng}`
    : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
}
