import { describe, expect, it } from "vitest";
import { recommendCounters } from "@/lib/counters";
import { getAbilityModifiers, getAllPokemon, getPokemon } from "@/lib/data";
import { guaranteedProfile } from "@/lib/matchups";
import { abilitySummary, evolutionSummary, howToBeat, percentile, roleSummary, typingSummary } from "@/lib/pokemon-insights";

const mods = getAbilityModifiers();
const get = (slug: string) => getPokemon(slug)!;
const beat = (slug: string) => {
  const p = get(slug);
  return howToBeat(p, guaranteedProfile(p, mods), recommendCounters(p, getAllPokemon(), 6, mods));
};

describe("pokemon insights", () => {
  it("percentile is the share of Pokémon strictly below", () => {
    expect(percentile("bst", 0)).toBe(0);
    expect(percentile("bst", 10_000)).toBe(100);
  });

  it("tells you to use 4× types first and explains counters", () => {
    const t = beat("garchomp");
    expect(t[0]).toBe("The best way to beat Garchomp is with Ice moves, which deal 4× damage. Dragon and Fairy moves are also super effective (2×).");
    expect(t.join(" ")).toContain("Electric moves have no effect on it");
    expect(t.join(" ")).toContain("Articuno hits for 4× with Ice-type STAB and is immune to Garchomp's Ground moves.");
  });

  it("handles Pokémon with no weaknesses", () => {
    expect(beat("eelektross")[0]).toContain("Eelektross has no type weaknesses");
  });

  it("classifies attackers by Attack vs Sp. Atk", () => {
    expect(roleSummary(get("garchomp"))).toContain("physical attacker");
    expect(roleSummary(get("alakazam"))).toContain("special attacker");
  });

  it("describes evolution position and forms", () => {
    expect(evolutionSummary(get("gabite"))).toContain("middle stage");
    expect(evolutionSummary(get("garchomp"))).toContain("final stage of a 3-stage line (Gible → Gabite → Garchomp)");
    expect(evolutionSummary(get("charizard-mega-x"))).toBe("Mega Charizard X is a Mega Evolution of Charizard, so it shares Charizard's evolution line.");
    expect(evolutionSummary(get("tauros"))).toBe("Tauros does not evolve.");
  });

  it("uses correct plurals and articles", () => {
    expect(abilitySummary(get("eelektross"))).toBe("Eelektross's only ability is Levitate.");
    const p = get("pikachu");
    expect(typingSummary(p, guaranteedProfile(p, mods))).toMatch(/^As an Electric type, Pikachu has 1 weakness, 3 resistances and 0 immunities/);
  });

  it("gives every Pokémon page distinct prose", () => {
    const all = getAllPokemon();
    const texts = all.map((p) => roleSummary(p) + evolutionSummary(p));
    expect(new Set(texts).size).toBeGreaterThan(all.length * 0.98);
  });
});
