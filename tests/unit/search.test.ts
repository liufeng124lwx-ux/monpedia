import { describe, expect, it } from "vitest";
import { filterPokemon, matchesQuery, normalize } from "@/lib/search";

const flabebe = { slug: "flabebe", name: "Flabébé", dex: 669, generation: 6, types: ["fairy" as const], sprite: "" };
const mime = { slug: "mr-mime", name: "Mr. Mime", dex: 122, generation: 1, types: ["psychic" as const, "fairy" as const], sprite: "" };
const farfetchd = { slug: "farfetchd", name: "Farfetch’d", dex: 83, generation: 1, types: ["normal" as const, "flying" as const], sprite: "" };
const charizard = { slug: "charizard", name: "Charizard", dex: 6, generation: 1, types: ["fire" as const, "flying" as const], sprite: "" };
const all = [charizard, farfetchd, mime, flabebe];

describe("normalize", () => {
  it("strips accents, punctuation, spaces and case", () => {
    expect(normalize("Flabébé")).toBe("flabebe");
    expect(normalize("Mr. Mime")).toBe("mrmime");
    expect(normalize("Farfetch’d")).toBe("farfetchd");
  });
});

describe("matchesQuery", () => {
  it("matches accent-free and punctuation-free input", () => {
    expect(matchesQuery(flabebe, "flabebe")).toBe(true);
    expect(matchesQuery(mime, "mr mime")).toBe(true);
    expect(matchesQuery(farfetchd, "farfetchd")).toBe(true);
  });

  it("matches dex numbers exactly, with or without #", () => {
    expect(matchesQuery(charizard, "6")).toBe(true);
    expect(matchesQuery(charizard, "#6")).toBe(true);
    expect(matchesQuery(farfetchd, "6")).toBe(false);
  });

  it("treats blank queries as match-all", () => {
    expect(matchesQuery(charizard, "   ")).toBe(true);
  });
});

describe("filterPokemon", () => {
  it("combines query, type and generation", () => {
    expect(filterPokemon(all, { q: "", type: "flying", gen: 1 }).map((p) => p.slug)).toEqual(["charizard", "farfetchd"]);
    expect(filterPokemon(all, { q: "mime", type: "fairy", gen: null }).map((p) => p.slug)).toEqual(["mr-mime"]);
  });
});
