// @ts-nocheck -- run with `bun test`
import { describe, expect, it } from "bun:test";
import { DEFAULT_HOLIDAY_LOCATIONS, matchesHolidayLocation, parseHolidayLocations } from "./holiday-collection";

const places = parseHolidayLocations(DEFAULT_HOLIDAY_LOCATIONS);

describe("holiday collection matching", () => {
  it("matches Kfar Debian spelling", () => expect(matchesHolidayLocation("Kfar Debian, Keserwan", places)).toBe(true));
  it("matches Fakra spelling", () => expect(matchesHolidayLocation("FAKRA", places)).toBe(true));
  it("matches Cedars for Arez", () => expect(matchesHolidayLocation("The Cedars", places)).toBe(true));
  it("does not match Batroun", () => expect(matchesHolidayLocation("Batroun", places)).toBe(false));
  it("matches nothing when list empty", () => expect(matchesHolidayLocation("Faraya", [])).toBe(false));
});
