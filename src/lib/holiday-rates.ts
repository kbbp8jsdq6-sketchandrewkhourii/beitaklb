export type HolidayRate = {
  name: string;
  start: string;
  end: string;
  price: number;
  min_nights: number | null;
  max_guests: number | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const numOrNull = (v: unknown) => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

export function parseHolidayRates(v: unknown): HolidayRate[] {
  let arr: unknown = v;
  if (typeof v === "string") {
    try { arr = JSON.parse(v); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  const out: HolidayRate[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const start = typeof r.start === "string" ? r.start.trim() : "";
    const end = typeof r.end === "string" ? r.end.trim() : "";
    const price = numOrNull(r.price);
    if (!name || !DATE_RE.test(start) || !DATE_RE.test(end) || price == null || price <= 0) continue;
    out.push({ name, start, end, price, min_nights: numOrNull(r.min_nights), max_guests: numOrNull(r.max_guests) });
  }
  return out;
}

export function beirutToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function activeHolidayRates(v: unknown, now: Date = new Date()): HolidayRate[] {
  const today = beirutToday(now);
  return parseHolidayRates(v)
    .filter((r) => r.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d: string) => {
  const [, m, day] = d.split("-").map(Number);
  return `${MONTHS[m - 1]} ${day}`;
};

export function formatHolidayDates(r: Pick<HolidayRate, "start" | "end">): string {
  return `${fmt(r.start)} – ${fmt(r.end)}`;
}
