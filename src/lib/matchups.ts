import { TYPE_NAMES, type AbilityModifier, type Pokemon, type TypeName } from "./model";
import { defenseProfile, groupByMultiplier, type MatchupGroup, type Profile } from "./typechart";

export function applyAbility(profile: Profile, ability?: AbilityModifier): Profile {
  if (!ability) return profile;
  const out = { ...profile };
  for (const t of TYPE_NAMES) {
    if (ability.wonderGuard && out[t] < 2) out[t] = 0;
    const mult = ability.multipliers?.[t];
    if (mult !== undefined && (!ability.superEffectiveOnly || out[t] > 1)) out[t] = out[t] * mult;
  }
  return out;
}

export function defensiveMatchups(pokemon: Pick<Pokemon, "types">, ability?: AbilityModifier): MatchupGroup[] {
  return groupByMultiplier(applyAbility(defenseProfile(pokemon.types), ability));
}

type WithAbilities = Pick<Pokemon, "types" | "abilities">;

/**
 * The type profile a Pokémon always has: an ability's effect on an attacking type is applied
 * only when every ability the Pokémon can have produces the same result for that type.
 */
export function guaranteedProfile(pokemon: WithAbilities, modifiers: readonly AbilityModifier[]): Profile {
  const base = defenseProfile(pokemon.types);
  if (pokemon.abilities.length === 0) return base;
  const profiles = pokemon.abilities.map((slug) => applyAbility(base, modifiers.find((m) => m.slug === slug)));
  const out = { ...base };
  for (const t of TYPE_NAMES) {
    const first = profiles[0][t];
    if (profiles.every((p) => p[t] === first)) out[t] = first;
  }
  return out;
}

export function guaranteedMatchups(pokemon: WithAbilities, modifiers: readonly AbilityModifier[]): MatchupGroup[] {
  return groupByMultiplier(guaranteedProfile(pokemon, modifiers));
}

export type AbilityChange = {
  ability: AbilityModifier;
  changes: { type: TypeName; from: number; to: number }[];
  /** True when the Pokémon always has this effect, so it is already in the main table. */
  always: boolean;
};

export function abilityChanges(pokemon: WithAbilities, modifiers: readonly AbilityModifier[]): AbilityChange[] {
  const base = defenseProfile(pokemon.types);
  const guaranteed = guaranteedProfile(pokemon, modifiers);
  return pokemon.abilities.flatMap((slug) => {
    const ability = modifiers.find((m) => m.slug === slug);
    if (!ability) return [];
    const after = applyAbility(base, ability);
    const changes = TYPE_NAMES.filter((t) => after[t] !== base[t]).map((t) => ({ type: t, from: base[t], to: after[t] }));
    const always = changes.every((c) => guaranteed[c.type] === c.to);
    return changes.length ? [{ ability, changes, always }] : [];
  });
}
