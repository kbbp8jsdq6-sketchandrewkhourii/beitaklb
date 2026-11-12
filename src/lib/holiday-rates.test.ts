// @ts-nocheck -- run with `bun test`
import { describe, it, expect } from "bun:test";
import { parseHolidayRates, activeHolidayRates, formatHolidayDates, cardLine, fmt } from "./holiday-rates";

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
  it("keeps an item valid when only price_2n is set and drops one with no price", () => {
    const r = parseHolidayRates([
      { name: "Christmas", start: "2026-12-23", end: "2026-12-27", price: null, price_2n: 1500, min_nights: 3, max_guests: 6, note: null },
      { name: "Both", start: "2026-12-23", end: "2026-12-27", price: 600, price_2n: 1100, option: "Option A", note: "$500 each extra night" },
      { name: "Free", start: "2026-12-23", end: "2026-12-27", price: 0, price_2n: 0 },
      { name: "Nulls", start: "2026-12-23", end: "2026-12-27", price: null, price_2n: null },
    ]);
    expect(r.map((x) => x.name)).toEqual(["Christmas", "Both"]);
    expect(r[0].option).toBe(null);
    expect(r[1].option).toBe("Option A");
    expect(r[1].note).toBe("$500 each extra night");
    expect(r[0].min_nights).toBe(3);
  });
  it("cardLine uses the first rate of the group and only mentions a minimum from 2 nights", () => {
    const twoN = { name: "Christmas", option: null, start: "2026-12-23", end: "2026-12-27", price: null, price_2n: 1500, min_nights: 3, max_guests: 6, note: null };
    expect(cardLine([twoN, { ...twoN, min_nights: 1 }])).toBe("min 3 nights · $1,500 / 2 nights");
    expect(cardLine([{ ...twoN, min_nights: 1 }])).toBe("$1,500 / 2 nights");
    expect(cardLine([{ ...twoN, min_nights: null }])).toBe("$1,500 / 2 nights");
    const oneN = { name: "New Year", option: null, start: "2026-12-30", end: "2027-01-02", price: 500, price_2n: null, min_nights: 2, max_guests: null, note: null };
    expect(cardLine([oneN])).toBe("min 2 nights · $500 / night");
    expect(cardLine([{ ...oneN, min_nights: null }])).toBe("$500 / night");
    expect(cardLine([])).toBe("");
    expect(cardLine([twoN])).not.toContain("no minimum");
  });
  it("fmt writes whole-dollar US prices with thousands separators", () => {
    expect(fmt(1500)).toBe("$1,500");
    expect(fmt(500)).toBe("$500");
    expect(fmt(1100)).toBe("$1,100");
  });
});
