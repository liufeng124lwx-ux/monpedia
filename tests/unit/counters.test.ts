import { describe, expect, it } from "vitest";
import { baseStatTotal, isMega, offenseVs, recommendCounters, threatFrom } from "@/lib/counters";
import type { Pokemon, TypeName } from "@/lib/model";

function mk(slug: string, types: TypeName[], bst: number, over: Partial<Pokemon> = {}): Pokemon {
  return {
    slug, name: slug, speciesSlug: slug, dex: 1, generation: 1, form: null, types, abilities: [],
    stats: { hp: bst, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, evolution: [[slug]], sprite: "", ...over,
  };
}

const charizard = mk("charizard", ["fire", "flying"], 534);
const pool = [
  charizard,
  mk("charizard-mega-y", ["fire", "flying"], 634, { speciesSlug: "charizard", form: "mega-y" }),
  mk("pikachu", ["electric"], 320),
  mk("blastoise", ["water"], 530),
  mk("golem", ["rock", "ground"], 495),
  mk("tyranitar", ["rock", "dark"], 600),
  mk("tyranitar-mega", ["rock", "dark"], 700, { speciesSlug: "tyranitar", form: "mega" }),
  mk("bulbasaur", ["grass", "poison"], 318),
];

describe("counter scoring", () => {
  it("scores offense and threat by type only", () => {
    expect(offenseVs(pool[5], charizard)).toBe(4);
    expect(threatFrom(charizard, pool[5])).toBe(0.5);
    expect(threatFrom(charizard, pool[3])).toBe(1);
    expect(baseStatTotal(charizard)).toBe(534);
  });

  it("detects mega forms", () => {
    expect(isMega({ form: "mega-x" })).toBe(true);
    expect(isMega({ form: "mega" })).toBe(true);
    expect(isMega({ form: "alola" })).toBe(false);
    expect(isMega({ form: null })).toBe(false);
  });
});

describe("recommendCounters", () => {
  it("ranks by offense, then threat, then base stat total; excludes same species, megas and non-SE", () => {
    expect(recommendCounters(charizard, pool).map((p) => p.slug)).toEqual(["tyranitar", "golem", "blastoise", "pikachu"]);
  });

  it("respects n", () => {
    expect(recommendCounters(charizard, pool, 2)).toHaveLength(2);
  });
});
