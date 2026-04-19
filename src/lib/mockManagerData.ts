// Deterministic mock analytics for the Store Manager portal.
// Each store's numbers are stable but distinct (seeded by store name).

import { MOCK_STORES } from "./mockStoreData";

function seed(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rand(s: number, n: number): number {
  return Math.abs(((s * 9301 + 49297) % 233280) / 233280 - 0) * n;
}

export type IntentVsReality = { name: string; value: number; color: string }[];
export type NotFoundItem = { item: string; count: number };
export type AisleCell = { aisle: string; intensity: number };
export type Trip = { user: string; time: string; items: number; found: number };

const ALL_NOT_FOUND = [
  "Organic Milk",
  "Avocados",
  "Oat Milk",
  "Sourdough Bread",
  "Free-range Eggs",
  "Almond Butter",
  "Kombucha",
  "Greek Yogurt",
  "Quinoa",
  "Coconut Water",
];

const AISLES = ["Produce", "Dairy", "Bakery", "Meat", "Frozen", "Pantry", "Snacks", "Drinks", "Health", "Bulk", "Cleaning", "Deli"];

export function getIntentVsReality(storeName: string): IntentVsReality {
  const s = seed(storeName);
  const found = 55 + (s % 25); // 55-79
  const notFound = 10 + ((s >> 3) % 18); // 10-27
  const pending = Math.max(5, 100 - found - notFound);
  return [
    { name: "Found", value: found, color: "oklch(0.62 0.16 240)" },
    { name: "Not Found", value: notFound, color: "oklch(0.7 0.18 30)" },
    { name: "Pending", value: pending, color: "oklch(0.72 0.08 240)" },
  ];
}

export function getTopNotFound(storeName: string): NotFoundItem[] {
  const s = seed(storeName);
  const picks: NotFoundItem[] = [];
  const used = new Set<number>();
  for (let i = 0; i < 5; i++) {
    let idx = (s + i * 13) % ALL_NOT_FOUND.length;
    while (used.has(idx)) idx = (idx + 1) % ALL_NOT_FOUND.length;
    used.add(idx);
    picks.push({
      item: ALL_NOT_FOUND[idx],
      count: 8 + ((s >> (i + 1)) % 22),
    });
  }
  return picks.sort((a, b) => b.count - a.count);
}

export function getRetentionRate(storeName: string): { rate: number; delta: number } {
  const s = seed(storeName);
  return {
    rate: 60 + (s % 25), // 60-84%
    delta: -3 + ((s >> 2) % 9), // -3 to +5
  };
}

export function getAisleHeatmap(storeName: string): AisleCell[] {
  const s = seed(storeName);
  return AISLES.map((aisle, i) => ({
    aisle,
    intensity: ((s >> i) % 100) / 100, // 0-1
  }));
}

export function getRecentTrips(storeName: string): Trip[] {
  const s = seed(storeName);
  const trips: Trip[] = [];
  for (let i = 0; i < 12; i++) {
    const items = 3 + ((s >> i) % 8); // 3-10
    const found = Math.max(1, items - ((s >> (i + 2)) % 4));
    const minsAgo = 5 + i * 11 + (s % 7);
    const h = Math.floor(minsAgo / 60);
    const m = minsAgo % 60;
    const time = h > 0 ? `${h}h ${m}m ago` : `${m}m ago`;
    trips.push({
      user: `User #${100 + ((s + i * 17) % 900)}`,
      time,
      items,
      found,
    });
  }
  return trips;
}

export function getAllStoreNames(): string[] {
  return MOCK_STORES.map((s) => s.name);
}
