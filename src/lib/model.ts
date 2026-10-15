export const TYPE_NAMES = [
  "normal", "fighting", "flying", "poison", "ground", "rock",
  "bug", "ghost", "steel", "fire", "water", "grass",
  "electric", "psychic", "ice", "dragon", "dark", "fairy",
] as const;
export type TypeName = (typeof TYPE_NAMES)[number];

export function isTypeName(x: string): x is TypeName {
  return (TYPE_NAMES as readonly string[]).includes(x);
}

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Pokemon = {
  slug: string;
  name: string;
  speciesSlug: string;
  dex: number;
  generation: number;
  form: string | null;
  types: TypeName[];
  abilities: string[];
  stats: Stats;
  evolution: string[][];
  sprite: string;
};

export type Nature = { name: string; up: StatKey | null; down: StatKey | null };

export type AbilityModifier = {
  slug: string;
  name: string;
  multipliers?: Partial<Record<TypeName, number>>;
  wonderGuard?: true;
  /** Apply `multipliers` only where the move is already super effective (Delta Stream). */
  superEffectiveOnly?: true;
  note?: string;
};

export type TypeData = {
  names: Record<TypeName, string>;
  /** chart[attacking][defending] ∈ {0, 0.5, 1, 2} */
  chart: Record<TypeName, Record<TypeName, number>>;
};
