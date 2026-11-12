export type HolidayRate = {
  name: string;
  option: string | null;
  start: string;
  end: string;
  price: number | null;
  price_2n: number | null;
  min_nights: number | null;
  max_guests: number | null;
  note: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const numOrNull = (v: unknown) => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const strOrNull = (v: unknown) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
};
const positiveOrNull = (v: unknown) => {
  const n = numOrNull(v);
  return n != null && n > 0 ? n : null;
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
    const name = strOrNull(r.name);
    const start = typeof r.start === "string" ? r.start.trim() : "";
    const end = typeof r.end === "string" ? r.end.trim() : "";
    const price = positiveOrNull(r.price);
    const price_2n = positiveOrNull(r.price_2n);
    if (!name || !DATE_RE.test(start) || !DATE_RE.test(end)) continue;
    if (price == null && price_2n == null) continue;
    out.push({
      name,
      option: strOrNull(r.option),
      start,
      end,
      price,
      price_2n,
      min_nights: numOrNull(r.min_nights),
      max_guests: numOrNull(r.max_guests),
      note: strOrNull(r.note),
    });
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
const fmtDay = (d: string) => {
  const [, m, day] = d.split("-").map(Number);
  return `${MONTHS[m - 1]} ${day}`;
};

export function formatHolidayDates(r: Pick<HolidayRate, "start" | "end">): string {
  return `${fmtDay(r.start)} – ${fmtDay(r.end)}`;
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function cardLine(group: HolidayRate[]): string {
  const first = group[0];
  if (!first) return "";
  const min = first.min_nights;
  const prefix = min != null && min >= 2 ? `min ${min} nights · ` : "";
  if (first.price_2n != null) return `${prefix}${fmt(first.price_2n)} / 2 nights`;
  if (first.price != null) return `${prefix}${fmt(first.price)} / night`;
  return "";
}
