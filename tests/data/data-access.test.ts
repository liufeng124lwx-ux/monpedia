import { describe, expect, it } from "vitest";
import {
  getAbilityName,
  getEvolutionStages,
  getPokemon,
  hasEvolution,
  pokemonOfType,
  sameTypeCombo,
  toSummary,
} from "@/lib/data";

describe("data access", () => {
  it("looks up by slug", () => {
    expect(getPokemon("charizard")?.name).toBe("Charizard");
    expect(getPokemon("does-not-exist")).toBeUndefined();
  });

  it("resolves evolution stages to records", () => {
    const stages = getEvolutionStages(getPokemon("charizard")!);
    expect(stages.map((s) => s.map((p) => p.slug))).toEqual([["charmander"], ["charmeleon"], ["charizard"]]);
  });

  it("knows when a Pokémon does not evolve", () => {
    expect(hasEvolution(getPokemon("tauros")!)).toBe(false);
    expect(hasEvolution(getPokemon("eevee")!)).toBe(true);
    expect(hasEvolution({ evolution: [["solo"]] })).toBe(false);
  });

  it("finds others with the same type combination, order-insensitive", () => {
    const same = sameTypeCombo(getPokemon("charizard")!).map((p) => p.slug);
    expect(same).toContain("moltres");
    expect(same).not.toContain("charizard");
  });

  it("filters by type and names abilities", () => {
    expect(pokemonOfType("fire").some((p) => p.slug === "charizard")).toBe(true);
    expect(getAbilityName("levitate")).toBe("Levitate");
  });

  it("builds summaries with only list fields", () => {
    expect(Object.keys(toSummary(getPokemon("pikachu")!)).sort()).toEqual(["dex", "generation", "name", "slug", "sprite", "types"]);
  });
});
