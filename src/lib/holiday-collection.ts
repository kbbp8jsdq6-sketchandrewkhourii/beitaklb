export const DEFAULT_HOLIDAY_LOCATIONS = "Kfardebian, Faraya, Arez, Ehden, Mzaar, Zaarour, Faqra";

const ALIASES: Record<string, string[]> = {
  kfardebian: ["kfardebian", "kfardibian", "kfardebiane"],
  faraya: ["faraya", "farayya"],
  arez: ["arez", "arz", "cedars", "cedar"],
  ehden: ["ehden", "ehdin"],
  mzaar: ["mzaar", "mzar"],
  zaarour: ["zaarour", "zaarur", "zarour"],
  faqra: ["faqra", "fakra", "faqraa"],
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");

export function parseHolidayLocations(raw: string | null | undefined): string[] {
  return (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export function matchesHolidayLocation(location: string | null | undefined, places: string[]): boolean {
  const loc = norm(location ?? "");
  if (!loc) return false;
  return places.some((p) => {
    const key = norm(p);
    if (!key) return false;
    const variants = ALIASES[key] ?? Object.values(ALIASES).find((v) => v.includes(key)) ?? [key];
    return [key, ...variants].some((v) => loc.includes(v));
  });
}
