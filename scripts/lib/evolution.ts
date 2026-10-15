import type { Pokemon } from "../../src/lib/model";

const REGIONS = ["alola", "galar", "hisui", "paldea"] as const;
type Region = (typeof REGIONS)[number];

/** Species that only the regional form of their pre-evolution can evolve into. */
export const REGIONAL_ONLY_EVOLUTIONS: Record<string, Region> = {
  sirfetchd: "galar",
  "mr-rime": "galar",
  cursola: "galar",
  perrserker: "galar",
  obstagoon: "galar",
  runerigus: "galar",
  overqwil: "hisui",
  sneasler: "hisui",
  clodsire: "paldea",
};

function regionOf(p: Pokemon): Region | null {
  const tag = p.form?.split("-")[0];
  if (tag && (REGIONS as readonly string[]).includes(tag)) return tag as Region;
  return REGIONAL_ONLY_EVOLUTIONS[p.slug] ?? null;
}

/**
 * PokeAPI evolution chains are per species. Rewrite each entry's chain so that original forms
 * do not list regional-only evolutions, and regional forms list their own regional line.
 */
export function regionalizeEvolution(list: Pokemon[]): Pokemon[] {
  const slugs = list.map((p) => p.slug);
  const regionalSlug = (species: string, region: Region): string | undefined =>
    slugs.find((s) => s === `${species}-${region}`) ?? slugs.find((s) => s.startsWith(`${species}-${region}-`));

  return list.map((p) => {
    const region = regionOf(p);
    const evolution = p.evolution
      .map((stage) => {
        if (!region) return stage.filter((s) => !REGIONAL_ONLY_EVOLUTIONS[s]);
        const ownRegionOnly = stage.some((s) => REGIONAL_ONLY_EVOLUTIONS[s] === region);
        return stage.flatMap((s) => {
          const only = REGIONAL_ONLY_EVOLUTIONS[s];
          if (only) return only === region ? [s] : [];
          const regional = regionalSlug(s, region);
          if (regional) return [regional];
          return ownRegionOnly ? [] : [s];
        });
      })
      .filter((stage) => stage.length > 0);
    return { ...p, evolution };
  });
}
