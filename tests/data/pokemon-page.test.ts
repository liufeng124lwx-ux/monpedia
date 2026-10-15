import { describe, expect, it } from "vitest";
import { recommendCounters } from "@/lib/counters";
import { getAllPokemon, getPokemon } from "@/lib/data";
import { pokemonDescription, pokemonFaq, weaknessSummary } from "@/lib/pokemon-page";

const charizard = getPokemon("charizard")!;

describe("weaknessSummary", () => {
  it("annotates 4× and ¼× and leaves 2× / ½× plain", () => {
    const s = weaknessSummary(charizard);
    expect(s.weak).toEqual(["Rock (4×)", "Water", "Electric"]);
    expect(s.resist).toContain("Grass (¼×)");
    expect(s.resist).toContain("Fire");
    expect(s.immune).toEqual(["Ground"]);
  });
});

describe("pokemonDescription", () => {
  it("summarises types and matchups", () => {
    const d = pokemonDescription(charizard);
    expect(d.startsWith("Charizard is a Fire/Flying-type Pokémon. It is weak to Rock (4×), Water and Electric")).toBe(true);
    expect(d).toContain("immune to Ground");
  });

  it("is unique for every page", () => {
    const all = getAllPokemon().map(pokemonDescription);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("pokemonFaq", () => {
  it("answers weakness, resistance and counter questions from data", () => {
    const faq = pokemonFaq(charizard, recommendCounters(charizard, getAllPokemon()));
    expect(faq.map((x) => x.q)).toEqual([
      "What is Charizard weak to?",
      "What is Charizard resistant to?",
      "What are the best counters to Charizard?",
    ]);
    expect(faq[0].a).toContain("Rock (4×)");
    expect(faq[1].a).toContain("immune to Ground");
  });

  it("skips the counters question when there are none", () => {
    expect(pokemonFaq(charizard, []).map((x) => x.q)).not.toContain("What are the best counters to Charizard?");
  });
});
