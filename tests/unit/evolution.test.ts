import { describe, expect, it } from "vitest";
import { regionalizeEvolution } from "../../scripts/lib/evolution";
import type { Pokemon } from "../../src/lib/model";

function mon(slug: string, speciesSlug: string, form: string | null, evolution: string[][]): Pokemon {
  return {
    slug, name: slug, speciesSlug, dex: 1, generation: 1, form, types: ["normal"], abilities: ["x"],
    stats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }, evolution, sprite: "",
  };
}

const MEOWTH_LINE = [["meowth"], ["persian", "perrserker"]];
const list = [
  mon("meowth", "meowth", null, MEOWTH_LINE),
  mon("meowth-alola", "meowth", "alola", MEOWTH_LINE),
  mon("meowth-galar", "meowth", "galar", MEOWTH_LINE),
  mon("persian", "persian", null, MEOWTH_LINE),
  mon("persian-alola", "persian", "alola", MEOWTH_LINE),
  mon("perrserker", "perrserker", null, MEOWTH_LINE),
  mon("farfetchd", "farfetchd", null, [["farfetchd"], ["sirfetchd"]]),
  mon("farfetchd-galar", "farfetchd", "galar", [["farfetchd"], ["sirfetchd"]]),
  mon("sirfetchd", "sirfetchd", null, [["farfetchd"], ["sirfetchd"]]),
  mon("darumaka", "darumaka", null, [["darumaka"], ["darmanitan"]]),
  mon("darumaka-galar", "darumaka", "galar", [["darumaka"], ["darmanitan"]]),
  mon("darmanitan", "darmanitan", null, [["darumaka"], ["darmanitan"]]),
  mon("darmanitan-galar-standard", "darmanitan", "galar-standard", [["darumaka"], ["darmanitan"]]),
  mon("charizard-mega-x", "charizard", "mega-x", [["charmander"], ["charmeleon"], ["charizard"]]),
];
const out = new Map(regionalizeEvolution(list).map((p) => [p.slug, p.evolution]));

describe("regionalizeEvolution", () => {
  it("drops regional-only evolutions from the original form", () => {
    expect(out.get("meowth")).toEqual([["meowth"], ["persian"]]);
    expect(out.get("farfetchd")).toEqual([["farfetchd"]]);
  });

  it("swaps in regional forms and keeps only that region's branch", () => {
    expect(out.get("meowth-alola")).toEqual([["meowth-alola"], ["persian-alola"]]);
    expect(out.get("meowth-galar")).toEqual([["meowth-galar"], ["perrserker"]]);
    expect(out.get("farfetchd-galar")).toEqual([["farfetchd-galar"], ["sirfetchd"]]);
  });

  it("treats regional-only evolutions as part of their region", () => {
    expect(out.get("perrserker")).toEqual([["meowth-galar"], ["perrserker"]]);
    expect(out.get("sirfetchd")).toEqual([["farfetchd-galar"], ["sirfetchd"]]);
  });

  it("matches regional forms whose slug has an extra suffix", () => {
    expect(out.get("darumaka-galar")).toEqual([["darumaka-galar"], ["darmanitan-galar-standard"]]);
  });

  it("leaves non-regional forms alone", () => {
    expect(out.get("charizard-mega-x")).toEqual([["charmander"], ["charmeleon"], ["charizard"]]);
  });
});
