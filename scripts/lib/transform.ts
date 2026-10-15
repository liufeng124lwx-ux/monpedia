import {
  isTypeName,
  type Nature,
  type StatKey,
  type TypeData,
  type TypeName,
} from "../../src/lib/model";
import type { Row } from "./csv";

export const EN = "9";
export const STAT_BY_ID: Record<string, StatKey> = {
  "1": "hp", "2": "atk", "3": "def", "4": "spa", "5": "spd", "6": "spe",
};

export function titleCase(id: string): string {
  return id
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function groupBy<T>(rows: readonly T[], key: (r: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = out.get(k);
    if (list) list.push(r);
    else out.set(k, [r]);
  }
  return out;
}

export function buildTypeData(types: Row[], typeNames: Row[], efficacy: Row[]) {
  const typeIdToName = new Map<string, TypeName>();
  for (const r of types) if (isTypeName(r.identifier)) typeIdToName.set(r.id, r.identifier);

  const names = {} as Record<TypeName, string>;
  for (const r of typeNames) {
    const t = typeIdToName.get(r.type_id);
    if (t && r.local_language_id === EN) names[t] = r.name;
  }

  const chart = {} as TypeData["chart"];
  for (const a of typeIdToName.values()) chart[a] = {} as Record<TypeName, number>;
  for (const r of efficacy) {
    const a = typeIdToName.get(r.damage_type_id);
    const d = typeIdToName.get(r.target_type_id);
    if (a && d) chart[a][d] = Number(r.damage_factor) / 100;
  }
  return { typeIdToName, data: { names, chart } satisfies TypeData };
}

export function buildNatures(natures: Row[], natureNames: Row[]): Nature[] {
  const names = new Map(
    natureNames.filter((r) => r.local_language_id === EN).map((r) => [r.nature_id, r.name]),
  );
  return natures
    .map((r) => {
      const neutral = r.increased_stat_id === r.decreased_stat_id;
      return {
        name: names.get(r.id) ?? titleCase(r.identifier),
        up: neutral ? null : STAT_BY_ID[r.increased_stat_id],
        down: neutral ? null : STAT_BY_ID[r.decreased_stat_id],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAbilityNames(abilities: Row[], abilityNames: Row[]): Record<string, string> {
  const names = new Map(
    abilityNames.filter((r) => r.local_language_id === EN).map((r) => [r.ability_id, r.name]),
  );
  return Object.fromEntries(abilities.map((a) => [a.identifier, names.get(a.id) ?? titleCase(a.identifier)]));
}
