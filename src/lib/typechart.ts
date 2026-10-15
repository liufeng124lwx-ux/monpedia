import typesJson from "../../data/types.json";
import { TYPE_NAMES, type TypeData, type TypeName } from "./model";

const data = typesJson as unknown as TypeData;

export type Profile = Record<TypeName, number>;
export type MatchupGroup = { multiplier: number; types: TypeName[] };

export function typeLabel(t: TypeName): string {
  return data.names[t];
}

export function effectiveness(attack: TypeName, defenders: readonly TypeName[]): number {
  return defenders.reduce((m, d) => m * data.chart[attack][d], 1);
}

export function defenseProfile(defenders: readonly TypeName[]): Profile {
  return Object.fromEntries(TYPE_NAMES.map((a) => [a, effectiveness(a, defenders)])) as Profile;
}

export function offenseProfile(attack: TypeName): Profile {
  return Object.fromEntries(TYPE_NAMES.map((d) => [d, effectiveness(attack, [d])])) as Profile;
}

export function groupByMultiplier(profile: Profile, includeNeutral = false): MatchupGroup[] {
  const groups = new Map<number, TypeName[]>();
  for (const t of TYPE_NAMES) {
    const m = profile[t];
    if (m === 1 && !includeNeutral) continue;
    groups.set(m, [...(groups.get(m) ?? []), t]);
  }
  return [...groups]
    .map(([multiplier, types]) => ({ multiplier, types }))
    .sort((a, b) => b.multiplier - a.multiplier);
}

const FRACTIONS: Record<string, string> = { "0.5": "½", "0.25": "¼", "0.125": "⅛" };

export function formatMultiplier(m: number): string {
  return `${FRACTIONS[String(m)] ?? String(m)}×`;
}

export function countWeaknesses(t: TypeName): number {
  return TYPE_NAMES.filter((a) => effectiveness(a, [t]) > 1).length;
}

export function countSuperEffective(t: TypeName): number {
  return TYPE_NAMES.filter((d) => effectiveness(t, [d]) > 1).length;
}
