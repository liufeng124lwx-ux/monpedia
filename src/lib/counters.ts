import type { Pokemon } from "./model";
import { effectiveness } from "./typechart";

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

export function recommendCounters(target: Pokemon, all: readonly Pokemon[], n = 6): Pokemon[] {
  return all
    .filter((c) => c.speciesSlug !== target.speciesSlug && !isMega(c))
    .map((c) => ({ c, off: offenseVs(c, target), threat: threatFrom(target, c), bst: baseStatTotal(c) }))
    .filter((x) => x.off >= 2)
    .sort((a, b) => b.off - a.off || a.threat - b.threat || b.bst - a.bst || a.c.dex - b.c.dex)
    .slice(0, n)
    .map((x) => x.c);
}
