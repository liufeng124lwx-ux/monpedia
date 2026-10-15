import { describe, expect, it } from "vitest";
import type { Row } from "../../scripts/lib/csv";
import { buildEvolutionStages, buildPokemon, type PokemonTables } from "../../scripts/lib/transform";
import type { TypeName } from "../../src/lib/model";

const TYPE_IDS = new Map<string, TypeName>([
  ["1", "normal"], ["3", "flying"], ["10", "fire"], ["14", "psychic"], ["16", "dragon"], ["17", "dark"],
]);

function sp(id: number, identifier: string, chain: number, from: number | null): Row {
  return {
    id: String(id), identifier, generation_id: "1", order: String(id),
    evolution_chain_id: String(chain), evolves_from_species_id: from === null ? "" : String(from),
  };
}

function makeTables(): PokemonTables {
  const t: PokemonTables = {
    pokemon: [], species: [], speciesNames: [], pokemonTypes: [], pokemonStats: [],
    pokemonAbilities: [], forms: [], formNames: [],
    abilities: [
      { id: "66", identifier: "blaze" }, { id: "94", identifier: "solar-power" },
      { id: "181", identifier: "tough-claws" }, { id: "70", identifier: "drought" },
      { id: "50", identifier: "run-away" }, { id: "82", identifier: "gluttony" },
      { id: "46", identifier: "pressure" },
    ],
  };
  t.species.push(
    sp(4, "charmander", 2, null), sp(5, "charmeleon", 2, 4), sp(6, "charizard", 2, 5),
    sp(19, "rattata", 10, null), sp(20, "raticate", 10, 19),
    sp(386, "deoxys", 200, null),
  );
  t.speciesNames.push(
    { pokemon_species_id: "6", local_language_id: "9", name: "Charizard" },
    { pokemon_species_id: "20", local_language_id: "9", name: "Raticate" },
    { pokemon_species_id: "386", local_language_id: "9", name: "Deoxys" },
  );
  const mon = (id: number, identifier: string, species: number, isDefault: boolean, types: number[], abilities: number[], formName?: string) => {
    t.pokemon.push({ id: String(id), identifier, species_id: String(species), is_default: isDefault ? "1" : "0" });
    types.forEach((ty, i) => t.pokemonTypes.push({ pokemon_id: String(id), type_id: String(ty), slot: String(i + 1) }));
    abilities.forEach((ab, i) => t.pokemonAbilities.push({ pokemon_id: String(id), ability_id: String(ab), slot: String(i + 1) }));
    [1, 2, 3, 4, 5, 6].forEach((s) => t.pokemonStats.push({ pokemon_id: String(id), stat_id: String(s), base_stat: String(50 + s) }));
    t.forms.push({ id: String(id), pokemon_id: String(id), is_default: "1" });
    if (formName) t.formNames.push({ pokemon_form_id: String(id), local_language_id: "9", pokemon_name: formName });
  };
  mon(6, "charizard", 6, true, [10, 3], [66, 94]);
  mon(10034, "charizard-mega-x", 6, false, [10, 16], [181], "Mega Charizard X");
  mon(10035, "charizard-mega-y", 6, false, [10, 3], [70], "Mega Charizard Y");
  mon(10196, "charizard-gmax", 6, false, [10, 3], [94, 66], "Gigantamax Charizard");
  mon(20, "raticate", 20, true, [1], [50]);
  mon(10091, "raticate-alola", 20, false, [17, 1], [82], "Alolan Raticate");
  mon(10093, "raticate-totem-alola", 20, false, [17, 1], [82], "Alolan Raticate");
  mon(386, "deoxys-normal", 386, true, [14], [46]);
  mon(10001, "deoxys-attack", 386, false, [14], [46], "Deoxys");
  return t;
}

const SPRITES = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@abc/sprites/pokemon";

describe("buildPokemon", () => {
  const list = buildPokemon(makeTables(), TYPE_IDS, SPRITES);
  const slugs = list.map((p) => p.slug);

  it("keeps defaults and forms whose types or abilities differ", () => {
    expect(slugs).toEqual(["charizard", "charizard-mega-x", "charizard-mega-y", "raticate", "raticate-alola", "deoxys"]);
  });

  it("drops cosmetic, G-Max, totem and stat-only forms", () => {
    expect(slugs).not.toContain("charizard-gmax");
    expect(slugs).not.toContain("raticate-totem-alola");
    expect(slugs).not.toContain("deoxys-attack");
  });

  it("uses the species identifier as the slug of default forms", () => {
    const deoxys = list.find((p) => p.dex === 386)!;
    expect(deoxys.slug).toBe("deoxys");
    expect(deoxys.form).toBeNull();
    expect(deoxys.name).toBe("Deoxys");
  });

  it("builds a full record for a form", () => {
    expect(list.find((p) => p.slug === "charizard-mega-x")).toEqual({
      slug: "charizard-mega-x",
      name: "Mega Charizard X",
      speciesSlug: "charizard",
      dex: 6,
      generation: 1,
      form: "mega-x",
      types: ["fire", "dragon"],
      abilities: ["tough-claws"],
      stats: { hp: 51, atk: 52, def: 53, spa: 54, spd: 55, spe: 56 },
      evolution: [["charmander"], ["charmeleon"], ["charizard"]],
      sprite: `${SPRITES}/10034.png`,
    });
  });

  it("disambiguates duplicate display names", () => {
    const t = makeTables();
    t.formNames.find((r) => r.pokemon_form_id === "10035")!.pokemon_name = "Mega Charizard X";
    const names = buildPokemon(t, TYPE_IDS, SPRITES).map((p) => p.name);
    expect(names).toContain("Mega Charizard X (Mega Y)");
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("buildEvolutionStages", () => {
  it("groups branching chains by stage", () => {
    const stages = buildEvolutionStages([
      sp(265, "wurmple", 100, null), sp(266, "silcoon", 100, 265), sp(267, "beautifly", 100, 266),
      sp(268, "cascoon", 100, 265), sp(269, "dustox", 100, 268),
    ]);
    expect(stages.get("265")).toEqual([["wurmple"], ["silcoon", "cascoon"], ["beautifly", "dustox"]]);
    expect(stages.get("269")).toEqual(stages.get("265"));
  });

  it("gives single-stage species a one-element chain", () => {
    expect(buildEvolutionStages([sp(128, "tauros", 50, null)]).get("128")).toEqual([["tauros"]]);
  });
});
