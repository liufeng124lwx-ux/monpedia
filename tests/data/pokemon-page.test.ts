import { describe, expect, it } from "vitest";
import { recommendCounters } from "@/lib/counters";
import { getAbilityModifiers, getAllPokemon, getPokemon } from "@/lib/data";
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

describe("abilities every form of the Pokémon has", () => {
  const modifiers = getAbilityModifiers();

  it("Eelektross (always Levitate) has no Ground weakness and no Ground counters", () => {
    const eel = getPokemon("eelektross")!;
    expect(weaknessSummary(eel).weak).toEqual([]);
    expect(weaknessSummary(eel).immune).toContain("Ground");
    expect(pokemonDescription(eel)).toContain("has no weaknesses");
    const counters = recommendCounters(eel, getAllPokemon(), 6, modifiers);
    expect(counters.every((c) => !(c.types.length === 1 && c.types[0] === "ground"))).toBe(true);
    expect(pokemonFaq(eel, counters)[0].a).toBe("Eelektross has no type weaknesses.");
  });

  it("Heat Rotom is not 4× weak to Ground", () => {
    const s = weaknessSummary(getPokemon("rotom-heat")!);
    expect(s.weak.some((w) => w.startsWith("Ground"))).toBe(false);
    expect(s.immune).toContain("Ground");
  });

  it("Primal Groudon is immune to Water", () => {
    expect(weaknessSummary(getPokemon("groudon-primal")!).immune).toContain("Water");
  });
});

describe("grammar", () => {
  it("uses 'an' before vowels", () => {
    const pikachu = getPokemon("pikachu")!;
    expect(pokemonDescription(pikachu).startsWith("Pikachu is an Electric-type Pokémon.")).toBe(true);
    expect(pokemonFaq(pikachu, [])[0].a.startsWith("As an Electric type")).toBe(true);
    expect(pokemonDescription(charizard).startsWith("Charizard is a Fire/Flying-type")).toBe(true);
  });
});
