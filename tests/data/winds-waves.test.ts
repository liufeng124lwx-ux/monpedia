import { describe, expect, it } from "vitest";
import raw from "../../data/winds-waves.json";
import { getWindsWaves, validateWindsWaves } from "@/lib/winds-waves";

describe("winds-waves data", () => {
  it("is valid", () => {
    expect(validateWindsWaves(raw)).toEqual([]);
  });

  it("rejects unsourced facts, bad dates and invalid types", () => {
    const errors = validateWindsWaves({
      updated: "yesterday",
      release: "",
      starters: [{ name: "X", type: "banana" }],
      facts: [{ text: "t", source: "http://leaks.example", date: "Feb 2026" }],
    });
    expect(errors).toEqual(expect.arrayContaining([
      "updated: not an ISO date",
      "release: empty",
      "starter X: invalid type banana",
      "fact 0: source must be an https URL on an official domain",
      "fact 0: date must be YYYY-MM-DD",
    ]));
  });

  it("exposes typed data", () => {
    expect(getWindsWaves().starters.map((s) => s.type)).toEqual(["grass", "fire", "water"]);
  });
});
