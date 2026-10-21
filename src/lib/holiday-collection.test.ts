// @ts-nocheck -- run with `bun test`
import { describe, expect, it } from "bun:test";
import { distinctLocations, matchesHolidayLocation, shuffleHolidayListings } from "./holiday-collection";

describe("holiday collection", () => {
  it("gives all six permutations equal weight for three listings", () => {
    const outcomes = new Set<string>();
    for (let first = 0; first < 3; first++) {
      for (let second = 0; second < 2; second++) {
        const choices = [(first + 0.5) / 3, (second + 0.5) / 2];
        outcomes.add(shuffleHolidayListings(["a", "b", "c"], () => choices.shift()).join(""));
      }
    }
    expect([...outcomes].sort()).toEqual(["abc", "acb", "bac", "bca", "cab", "cba"]);
  });
  it("preserves every listing and leaves the source order unchanged", () => {
    const listings = [1, 2, 3, 4];
    expect(shuffleHolidayListings(listings, () => 0)).toEqual([2, 3, 4, 1]);
    expect(listings).toEqual([1, 2, 3, 4]);
    expect(shuffleHolidayListings([], () => 0)).toEqual([]);
  });
  it("matches exactly ignoring case and spaces", () => expect(matchesHolidayLocation("  faraya ", ["Faraya"])).toBe(true));
  it("does not match partial names", () => expect(matchesHolidayLocation("Kfar Debian", ["Kfardebian"])).toBe(false));
  it("matches nothing when none ticked", () => expect(matchesHolidayLocation("Faraya", [])).toBe(false));
  it("dedupes case-insensitively with counts, A-Z", () =>
    expect(distinctLocations(["Faraya", " faraya", "Arez", ""])).toEqual([{ name: "Arez", count: 1 }, { name: "Faraya", count: 2 }]));
});
