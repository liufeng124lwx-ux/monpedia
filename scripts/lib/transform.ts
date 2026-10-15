import {
  isTypeName,
  STAT_KEYS,
  type Nature,
  type Pokemon,
  type Stats,
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

export type PokemonTables = {
  pokemon: Row[];
  species: Row[];
  speciesNames: Row[];
  pokemonTypes: Row[];
  pokemonStats: Row[];
  pokemonAbilities: Row[];
  forms: Row[];
  formNames: Row[];
  abilities: Row[];
};

const bySlot = (a: Row, b: Row) => Number(a.slot) - Number(b.slot);

export function buildEvolutionStages(species: Row[]): Map<string, string[][]> {
  const byId = new Map(species.map((s) => [s.id, s]));
  const depth = (s: Row): number => {
    let d = 0;
    let cur = s;
    while (cur.evolves_from_species_id) {
      const parent = byId.get(cur.evolves_from_species_id);
      if (!parent) break;
      d++;
      cur = parent;
    }
    return d;
  };
  const result = new Map<string, string[][]>();
  const chains = groupBy(species, (s) => s.evolution_chain_id || `solo-${s.id}`);
  for (const members of chains.values()) {
    const stages: string[][] = [];
    for (const s of [...members].sort((a, b) => Number(a.order) - Number(b.order))) {
      (stages[depth(s)] ??= []).push(s.identifier);
    }
    const compact = stages.filter(Boolean);
    for (const s of members) result.set(s.id, compact);
  }
  return result;
}

export function buildPokemon(
  t: PokemonTables,
  typeIdToName: Map<string, TypeName>,
  spriteBase: string,
): Pokemon[] {
  const speciesById = new Map(t.species.map((s) => [s.id, s]));
  const speciesName = new Map(
    t.speciesNames.filter((r) => r.local_language_id === EN).map((r) => [r.pokemon_species_id, r.name]),
  );
  const abilitySlug = new Map(t.abilities.map((a) => [a.id, a.identifier]));
  const typesBy = groupBy(t.pokemonTypes, (r) => r.pokemon_id);
  const statsBy = groupBy(t.pokemonStats, (r) => r.pokemon_id);
  const abilitiesBy = groupBy(t.pokemonAbilities, (r) => r.pokemon_id);
  const formNameById = new Map(
    t.formNames.filter((r) => r.local_language_id === EN).map((r) => [r.pokemon_form_id, r.pokemon_name]),
  );
  const formNameByPokemon = new Map<string, string>();
  for (const f of t.forms) {
    const n = f.is_default === "1" ? formNameById.get(f.id) : undefined;
    if (n) formNameByPokemon.set(f.pokemon_id, n);
  }
  const evolution = buildEvolutionStages(t.species);

  const out: Pokemon[] = [];
  const usedNames = new Set<string>();
  for (const [speciesId, rows] of groupBy(t.pokemon, (r) => r.species_id)) {
    const sp = speciesById.get(speciesId);
    if (!sp) continue;
    const ordered = [...rows].sort(
      (a, b) => Number(b.is_default) - Number(a.is_default) || Number(a.id) - Number(b.id),
    );
    const seen = new Set<string>();
    for (const row of ordered) {
      const types = [...(typesBy.get(row.id) ?? [])]
        .sort(bySlot)
        .map((r) => typeIdToName.get(r.type_id))
        .filter((x): x is TypeName => x !== undefined);
      const abilities = [...(abilitiesBy.get(row.id) ?? [])]
        .sort(bySlot)
        .map((r) => abilitySlug.get(r.ability_id))
        .filter((x): x is string => x !== undefined);
      if (types.length === 0 || abilities.length === 0) continue;

      const isDefault = row.is_default === "1";
      const signature = `${types.join("/")}|${[...abilities].sort().join(",")}`;
      if (!isDefault && seen.has(signature)) continue;
      seen.add(signature);

      const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
      for (const s of statsBy.get(row.id) ?? []) {
        const k = STAT_BY_ID[s.stat_id];
        if (k) stats[k] = Number(s.base_stat);
      }

      const prefix = `${sp.identifier}-`;
      const form = isDefault
        ? null
        : row.identifier.startsWith(prefix) ? row.identifier.slice(prefix.length) : row.identifier;
      let name = isDefault
        ? speciesName.get(speciesId) ?? titleCase(sp.identifier)
        : formNameByPokemon.get(row.id) ?? titleCase(row.identifier);
      if (usedNames.has(name) && form) name = `${name} (${titleCase(form)})`;
      usedNames.add(name);

      out.push({
        slug: isDefault ? sp.identifier : row.identifier,
        name,
        speciesSlug: sp.identifier,
        dex: Number(speciesId),
        generation: Number(sp.generation_id),
        form,
        types,
        abilities,
        stats,
        evolution: evolution.get(speciesId) ?? [[sp.identifier]],
        sprite: `${spriteBase}/${row.id}.png`,
      });
    }
  }
  return out.sort((a, b) => a.dex - b.dex);
}
