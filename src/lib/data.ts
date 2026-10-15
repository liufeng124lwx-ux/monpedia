import abilityModifiersJson from "../../data/abilities.json";
import abilityNamesJson from "../../data/ability-names.json";
import naturesJson from "../../data/natures.json";
import pokemonJson from "../../data/pokemon.json";
import type { AbilityModifier, Nature, Pokemon, TypeName } from "./model";

const POKEMON = pokemonJson as unknown as Pokemon[];
const BY_SLUG = new Map(POKEMON.map((p) => [p.slug, p]));
const ABILITY_NAMES = abilityNamesJson as Record<string, string>;

export type PokemonSummary = Pick<Pokemon, "slug" | "name" | "dex" | "generation" | "types" | "sprite">;

export function getAllPokemon(): Pokemon[] {
  return POKEMON;
}

export function getPokemon(slug: string): Pokemon | undefined {
  return BY_SLUG.get(slug);
}

export function getNatures(): Nature[] {
  return naturesJson as unknown as Nature[];
}

export function getAbilityModifiers(): AbilityModifier[] {
  return abilityModifiersJson as unknown as AbilityModifier[];
}

export function getAbilityName(slug: string): string {
  return ABILITY_NAMES[slug] ?? slug;
}

export function pokemonOfType(t: TypeName): Pokemon[] {
  return POKEMON.filter((p) => p.types.includes(t));
}

const comboKey = (types: readonly TypeName[]) => [...types].sort().join("/");

export function sameTypeCombo(p: Pokemon): Pokemon[] {
  const key = comboKey(p.types);
  return POKEMON.filter((o) => o.slug !== p.slug && comboKey(o.types) === key);
}

export function getEvolutionStages(p: Pokemon): Pokemon[][] {
  return p.evolution.map((stage) => stage.map((s) => BY_SLUG.get(s)).filter((x): x is Pokemon => x !== undefined));
}

export function hasEvolution(p: Pick<Pokemon, "evolution">): boolean {
  return p.evolution.flat().length > 1;
}

export function toSummary(p: Pokemon): PokemonSummary {
  const { slug, name, dex, generation, types, sprite } = p;
  return { slug, name, dex, generation, types, sprite };
}
