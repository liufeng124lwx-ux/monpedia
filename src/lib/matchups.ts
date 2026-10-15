import { TYPE_NAMES, type AbilityModifier, type Pokemon, type TypeName } from "./model";
import { defenseProfile, groupByMultiplier, type MatchupGroup, type Profile } from "./typechart";

export function applyAbility(profile: Profile, ability?: AbilityModifier): Profile {
  if (!ability) return profile;
  const out = { ...profile };
  for (const t of TYPE_NAMES) {
    if (ability.wonderGuard && out[t] < 2) out[t] = 0;
    const mult = ability.multipliers?.[t];
    if (mult !== undefined) out[t] = out[t] * mult;
  }
  return out;
}

export function defensiveMatchups(pokemon: Pick<Pokemon, "types">, ability?: AbilityModifier): MatchupGroup[] {
  return groupByMultiplier(applyAbility(defenseProfile(pokemon.types), ability));
}

export type AbilityChange = {
  ability: AbilityModifier;
  changes: { type: TypeName; from: number; to: number }[];
};

export function abilityChanges(
  pokemon: Pick<Pokemon, "types" | "abilities">,
  modifiers: readonly AbilityModifier[],
): AbilityChange[] {
  const base = defenseProfile(pokemon.types);
  return pokemon.abilities.flatMap((slug) => {
    const ability = modifiers.find((m) => m.slug === slug);
    if (!ability) return [];
    const after = applyAbility(base, ability);
    const changes = TYPE_NAMES.filter((t) => after[t] !== base[t]).map((t) => ({ type: t, from: base[t], to: after[t] }));
    return changes.length ? [{ ability, changes }] : [];
  });
}
