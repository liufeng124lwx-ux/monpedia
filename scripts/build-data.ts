import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AbilityModifier, Pokemon } from "../src/lib/model";
import { CSV_BASE, POKEAPI_REF, SPRITE_BASE, SPRITES_REF } from "./config";
import { parseCsv, type Row } from "./lib/csv";
import { buildAbilityNames, buildNatures, buildPokemon, buildTypeData } from "./lib/transform";
import { mergeOverrides, validateDataset } from "./lib/validate";

const DATA_DIR = path.resolve(__dirname, "../data");

async function fetchCsv(name: string): Promise<Row[]> {
  const res = await fetch(`${CSV_BASE}/${name}.csv`);
  if (!res.ok) throw new Error(`${name}.csv: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
}

function writeJson(file: string, value: unknown) {
  writeFileSync(path.join(DATA_DIR, file), `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const names = [
    "types", "type_names", "type_efficacy", "natures", "nature_names", "abilities", "ability_names",
    "pokemon", "pokemon_species", "pokemon_species_names", "pokemon_types", "pokemon_stats",
    "pokemon_abilities", "pokemon_forms", "pokemon_form_names",
  ] as const;
  const csv = Object.fromEntries(
    await Promise.all(names.map(async (n) => [n, await fetchCsv(n)] as const)),
  ) as Record<(typeof names)[number], Row[]>;

  const { typeIdToName, data: types } = buildTypeData(csv.types, csv.type_names, csv.type_efficacy);
  const natures = buildNatures(csv.natures, csv.nature_names);
  const abilityNames = buildAbilityNames(csv.abilities, csv.ability_names);
  const generated = buildPokemon(
    {
      pokemon: csv.pokemon,
      species: csv.pokemon_species,
      speciesNames: csv.pokemon_species_names,
      pokemonTypes: csv.pokemon_types,
      pokemonStats: csv.pokemon_stats,
      pokemonAbilities: csv.pokemon_abilities,
      forms: csv.pokemon_forms,
      formNames: csv.pokemon_form_names,
      abilities: csv.abilities,
    },
    typeIdToName,
    SPRITE_BASE,
  );
  const pokemon = mergeOverrides(generated, readJson<Pokemon[]>("overrides.json"));
  const abilityModifiers = readJson<AbilityModifier[]>("abilities.json");

  const errors = validateDataset({ types, pokemon, natures, abilityNames, abilityModifiers });
  if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n${errors.slice(0, 50).join("\n")}`);
    process.exit(1);
  }

  mkdirSync(DATA_DIR, { recursive: true });
  writeJson("types.json", types);
  writeJson("natures.json", natures);
  writeJson("ability-names.json", abilityNames);
  writeJson("pokemon.json", pokemon);
  writeJson("meta.json", {
    pokeapiRef: POKEAPI_REF,
    spritesRef: SPRITES_REF,
    speciesCount: new Set(pokemon.map((p) => p.dex)).size,
    pokemonCount: pokemon.length,
    generatedAt: new Date().toISOString().slice(0, 10),
  });
  console.log(`Wrote ${pokemon.length} Pokémon entries (${natures.length} natures).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
