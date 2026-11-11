import { describe, it, expect } from "vitest";
import { parseHolidayRates, activeHolidayRates, formatHolidayDates } from "./holiday-rates";

describe("holiday rates", () => {
  it("drops entries missing name/dates or with price <= 0", () => {
    const r = parseHolidayRates([
      { name: "Christmas", start: "2026-12-23", end: "2026-12-27", price: 300, min_nights: 2, max_guests: null },
      { name: "", start: "2026-12-23", end: "2026-12-27", price: 300 },
      { name: "X", start: "2026-12-23", end: "2026-12-27", price: 0 },
      { name: "Y", end: "2026-12-27", price: 100 },
    ]);
    expect(r.map((x) => x.name)).toEqual(["Christmas"]);
  });
  it("keeps rates ending today or later in Beirut, sorted by start", () => {
    const now = new Date("2026-12-27T21:30:00Z"); // Dec 27 23:30 Beirut
    const r = activeHolidayRates([
      { name: "New Year", start: "2026-12-30", end: "2027-01-02", price: 400 },
      { name: "Christmas", start: "2026-12-23", end: "2026-12-27", price: 300 },
      { name: "Old", start: "2026-12-01", end: "2026-12-26", price: 300 },
    ], now);
    expect(r.map((x) => x.name)).toEqual(["Christmas", "New Year"]);
  });
  it("formats dates without year", () => {
    expect(formatHolidayDates({ start: "2026-12-23", end: "2026-12-27" })).toBe("Dec 23 – Dec 27");
  });
});
