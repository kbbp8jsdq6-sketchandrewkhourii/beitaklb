export const normalizeLocation = (s: string | null | undefined) => (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** Fisher–Yates: choose uniformly from the remaining positions, without mutating input. */
export function shuffleHolidayListings<T>(listings: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...listings];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function matchesHolidayLocation(location: string | null | undefined, selected: string[]): boolean {
  const loc = normalizeLocation(location);
  return !!loc && selected.some((s) => normalizeLocation(s) === loc);
}

/** Distinct locations (trimmed, case-insensitive) with listing counts, sorted A–Z. */
export function distinctLocations(locations: (string | null | undefined)[]): { name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const raw of locations) {
    const name = (raw ?? "").trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = name.toLowerCase();
    const e = map.get(key);
    if (e) e.count++; else map.set(key, { name, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}
