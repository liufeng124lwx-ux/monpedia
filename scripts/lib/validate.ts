import {
  isTypeName,
  STAT_KEYS,
  TYPE_NAMES,
  type AbilityModifier,
  type Nature,
  type Pokemon,
  type TypeData,
} from "../../src/lib/model";

export type Dataset = {
  types: TypeData;
  pokemon: Pokemon[];
  natures: Nature[];
  abilityNames: Record<string, string>;
  abilityModifiers: AbilityModifier[];
};

const ALLOWED = new Set([0, 0.5, 1, 2]);

export function mergeOverrides(base: Pokemon[], overrides: Pokemon[]): Pokemon[] {
  const bySlug = new Map(base.map((p) => [p.slug, p]));
  for (const o of overrides) bySlug.set(o.slug, o);
  return [...bySlug.values()].sort((a, b) => a.dex - b.dex);
}

export function validateDataset(d: Dataset): string[] {
  const errors: string[] = [];

  for (const a of TYPE_NAMES) {
    if (!d.types.names[a]) errors.push(`type ${a}: missing name`);
    for (const b of TYPE_NAMES) {
      const v = d.types.chart[a]?.[b];
      if (v === undefined || !ALLOWED.has(v)) errors.push(`chart ${a}->${b}: invalid ${v}`);
    }
  }

  const slugs = new Set<string>();
  for (const p of d.pokemon) {
    if (slugs.has(p.slug)) errors.push(`duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    if (p.types.length < 1 || p.types.length > 2 || !p.types.every(isTypeName)) {
      errors.push(`${p.slug}: invalid types ${p.types.join(",")}`);
    }
    for (const ab of p.abilities) if (!d.abilityNames[ab]) errors.push(`${p.slug}: unknown ability ${ab}`);
    for (const k of STAT_KEYS) {
      if (!Number.isInteger(p.stats[k]) || p.stats[k] <= 0) errors.push(`${p.slug}: invalid stat ${k}`);
    }
  }
  for (const p of d.pokemon) {
    for (const s of p.evolution.flat()) {
      if (!slugs.has(s)) errors.push(`${p.slug}: evolution references unknown ${s}`);
    }
  }

  for (const m of d.abilityModifiers) {
    if (!d.abilityNames[m.slug]) errors.push(`ability modifier ${m.slug}: unknown ability`);
  }
  if (d.natures.length !== 25) errors.push(`expected 25 natures, got ${d.natures.length}`);
  return errors;
}
