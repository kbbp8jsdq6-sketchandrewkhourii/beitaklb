// @ts-nocheck -- run with `bun test`
import { describe, expect, it } from "bun:test";
import { distinctLocations, matchesHolidayLocation } from "./holiday-collection";

describe("holiday collection", () => {
  it("matches exactly ignoring case and spaces", () => expect(matchesHolidayLocation("  faraya ", ["Faraya"])).toBe(true));
  it("does not match partial names", () => expect(matchesHolidayLocation("Kfar Debian", ["Kfardebian"])).toBe(false));
  it("matches nothing when none ticked", () => expect(matchesHolidayLocation("Faraya", [])).toBe(false));
  it("dedupes case-insensitively with counts, A-Z", () =>
    expect(distinctLocations(["Faraya", " faraya", "Arez", ""])).toEqual([{ name: "Arez", count: 1 }, { name: "Faraya", count: 2 }]));
});
