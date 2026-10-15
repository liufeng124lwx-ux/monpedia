import { guaranteedProfile } from "./matchups";
import type { AbilityModifier, Pokemon } from "./model";
import { effectiveness, type Profile } from "./typechart";

type Typed = Pick<Pokemon, "types">;

export function offenseVs(attacker: Typed, target: Typed): number {
  return Math.max(...attacker.types.map((t) => effectiveness(t, target.types)));
}

export function threatFrom(target: Typed, candidate: Typed): number {
  return Math.max(...target.types.map((t) => effectiveness(t, candidate.types)));
}

export function baseStatTotal(p: Pick<Pokemon, "stats">): number {
  return Object.values(p.stats).reduce((a, b) => a + b, 0);
}

export function isMega(p: Pick<Pokemon, "form">): boolean {
  return p.form !== null && /^mega(-|$)/.test(p.form);
}

/** Like offenseVs, but against a precomputed defensive profile (e.g. one that includes guaranteed abilities). */
export function offenseVsProfile(attacker: Typed, profile: Profile): number {
  return Math.max(...attacker.types.map((t) => profile[t]));
}

export function recommendCounters(
  target: Pokemon,
  all: readonly Pokemon[],
  n = 6,
  modifiers: readonly AbilityModifier[] = [],
): Pokemon[] {
  const profile = guaranteedProfile(target, modifiers);
  return all
    .filter((c) => c.speciesSlug !== target.speciesSlug && !isMega(c))
    .map((c) => ({ c, off: offenseVsProfile(c, profile), threat: threatFrom(target, c), bst: baseStatTotal(c) }))
    .filter((x) => x.off >= 2)
    .sort((a, b) => b.off - a.off || a.threat - b.threat || b.bst - a.bst || a.c.dex - b.c.dex)
    .slice(0, n)
    .map((x) => x.c);
}
