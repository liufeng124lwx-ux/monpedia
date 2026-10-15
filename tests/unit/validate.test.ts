import { describe, expect, it } from "vitest";
import { mergeOverrides, validateDataset, type Dataset } from "../../scripts/lib/validate";
import { TYPE_NAMES, type Pokemon, type TypeData } from "../../src/lib/model";

function chart(): TypeData {
  const names = Object.fromEntries(TYPE_NAMES.map((t) => [t, t.toUpperCase()])) as TypeData["names"];
  const c = Object.fromEntries(
    TYPE_NAMES.map((a) => [a, Object.fromEntries(TYPE_NAMES.map((d) => [d, 1]))]),
  ) as TypeData["chart"];
  return { names, chart: c };
}

function mon(slug: string, over: Partial<Pokemon> = {}): Pokemon {
  return {
    slug, name: slug, speciesSlug: slug, dex: 1, generation: 1, form: null,
    types: ["fire"], abilities: ["blaze"],
    stats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
    evolution: [[slug]], sprite: "x", ...over,
  };
}

const natures = Array.from({ length: 25 }, (_, i) => ({ name: `N${i}`, up: null, down: null }));

function dataset(over: Partial<Dataset> = {}): Dataset {
  return {
    types: chart(), pokemon: [mon("a")], natures,
    abilityNames: { blaze: "Blaze", levitate: "Levitate" },
    abilityModifiers: [{ slug: "levitate", name: "Levitate", multipliers: { ground: 0 } }],
    ...over,
  };
}

describe("validateDataset", () => {
  it("accepts a valid dataset", () => {
    expect(validateDataset(dataset())).toEqual([]);
  });

  it("rejects bad chart values and missing cells", () => {
    const d = dataset();
    d.types.chart.fire.water = 3;
    delete (d.types.chart.ice as Partial<Record<string, number>>).fire;
    const errors = validateDataset(d);
    expect(errors).toContain("chart fire->water: invalid 3");
    expect(errors).toContain("chart ice->fire: invalid undefined");
  });

  it("rejects duplicate slugs, bad types, unknown abilities and evolution refs", () => {
    const errors = validateDataset(dataset({
      pokemon: [
        mon("a"),
        mon("a"),
        mon("b", { types: [] }),
        mon("c", { types: ["fire", "water", "grass"] }),
        mon("d", { abilities: ["nope"] }),
        mon("e", { evolution: [["e"], ["ghost-mon"]] }),
      ],
    }));
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate slug a",
      "b: invalid types ",
      "c: invalid types fire,water,grass",
      "d: unknown ability nope",
      "e: evolution references unknown ghost-mon",
    ]));
  });

  it("rejects ability modifiers for unknown abilities and wrong nature count", () => {
    const errors = validateDataset(dataset({
      abilityModifiers: [{ slug: "made-up", name: "Made Up" }],
      natures: natures.slice(0, 24),
    }));
    expect(errors).toContain("ability modifier made-up: unknown ability");
    expect(errors).toContain("expected 25 natures, got 24");
  });
});

describe("mergeOverrides", () => {
  it("replaces by slug and appends new entries in dex order", () => {
    const merged = mergeOverrides(
      [mon("a", { dex: 1 }), mon("c", { dex: 3 })],
      [mon("a", { dex: 1, name: "A2" }), mon("b", { dex: 2 })],
    );
    expect(merged.map((p) => [p.slug, p.name])).toEqual([["a", "A2"], ["b", "b"], ["c", "c"]]);
  });
});
