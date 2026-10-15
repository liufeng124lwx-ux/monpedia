import { describe, expect, it } from "vitest";
import abilityModifiers from "../../data/abilities.json";
import abilityNames from "../../data/ability-names.json";
import meta from "../../data/meta.json";
import natures from "../../data/natures.json";
import pokemon from "../../data/pokemon.json";
import types from "../../data/types.json";
import { validateDataset } from "../../scripts/lib/validate";
import type { AbilityModifier, Nature, Pokemon, TypeData } from "../../src/lib/model";

const list = pokemon as unknown as Pokemon[];
const bySlug = new Map(list.map((p) => [p.slug, p]));

describe("generated dataset", () => {
  it("passes validation", () => {
    expect(
      validateDataset({
        types: types as unknown as TypeData,
        pokemon: list,
        natures: natures as unknown as Nature[],
        abilityNames: abilityNames as Record<string, string>,
        abilityModifiers: abilityModifiers as unknown as AbilityModifier[],
      }),
    ).toEqual([]);
  });

  it("covers every species exactly once as a default form", () => {
    const defaults = list.filter((p) => p.form === null);
    expect(new Set(defaults.map((p) => p.dex)).size).toBe(meta.speciesCount);
    expect(defaults.length).toBe(meta.speciesCount);
  });

  it("has roughly 1300 page-level entries", () => {
    expect(list.length).toBeGreaterThan(1100);
    expect(list.length).toBeLessThan(1500);
    expect(meta.pokemonCount).toBe(list.length);
  });

  it("includes megas and regional forms but not G-Max forms", () => {
    expect(bySlug.get("charizard")?.types).toEqual(["fire", "flying"]);
    expect(bySlug.get("charizard-mega-x")?.types).toEqual(["fire", "dragon"]);
    expect(bySlug.has("raticate-alola")).toBe(true);
    expect(list.some((p) => p.slug.endsWith("-gmax"))).toBe(false);
  });

  it("models Eevee's branching evolutions", () => {
    const evo = bySlug.get("eevee")!.evolution;
    expect(evo).toHaveLength(2);
    expect(evo[1]).toHaveLength(8);
    expect(evo[1]).toEqual(expect.arrayContaining(["vaporeon", "sylveon", "umbreon"]));
  });

  it("never points sprites at raw.githubusercontent.com", () => {
    expect(list.every((p) => p.sprite.startsWith("https://cdn.jsdelivr.net/gh/PokeAPI/sprites@"))).toBe(true);
  });

  it("has 25 natures with 5 neutral ones", () => {
    expect(natures).toHaveLength(25);
    expect((natures as Nature[]).filter((n) => n.up === null)).toHaveLength(5);
  });
});
