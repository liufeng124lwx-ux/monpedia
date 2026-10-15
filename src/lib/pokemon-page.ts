import { defensiveMatchups } from "./matchups";
import type { Pokemon } from "./model";
import type { Qa } from "./seo";
import { joinList } from "./text";
import { formatMultiplier, typeLabel, type MatchupGroup } from "./typechart";

const PLAIN = new Set([2, 0.5, 0]);

function labels(groups: MatchupGroup[], keep: (m: number) => boolean): string[] {
  return groups
    .filter((g) => keep(g.multiplier))
    .flatMap((g) => g.types.map((t) => (PLAIN.has(g.multiplier) ? typeLabel(t) : `${typeLabel(t)} (${formatMultiplier(g.multiplier)})`)));
}

export function weaknessSummary(p: Pick<Pokemon, "types">) {
  const groups = defensiveMatchups(p);
  return {
    weak: labels(groups, (m) => m > 1),
    resist: labels(groups, (m) => m > 0 && m < 1),
    immune: labels(groups, (m) => m === 0),
  };
}

const typeString = (p: Pick<Pokemon, "types">) => p.types.map(typeLabel).join("/");

export function pokemonDescription(p: Pokemon): string {
  const { weak, resist, immune } = weaknessSummary(p);
  let s = `${p.name} is a ${typeString(p)}-type Pokémon. It is weak to ${weak.length ? joinList(weak) : "nothing"}`;
  if (resist.length) s += `, resists ${joinList(resist)}`;
  if (immune.length) s += ` and is immune to ${joinList(immune)}`;
  return `${s}. See its best counters, base stats and evolutions.`;
}

export function pokemonFaq(p: Pokemon, counters: Pokemon[]): Qa[] {
  const { weak, resist, immune } = weaknessSummary(p);
  const faq: Qa[] = [
    {
      q: `What is ${p.name} weak to?`,
      a: weak.length
        ? `As a ${typeString(p)} type, ${p.name} takes super-effective damage from ${joinList(weak)} moves.`
        : `${p.name} has no type weaknesses.`,
    },
    {
      q: `What is ${p.name} resistant to?`,
      a:
        (resist.length ? `${p.name} resists ${joinList(resist)} moves.` : `${p.name} has no type resistances.`) +
        (immune.length ? ` It is immune to ${joinList(immune)}.` : ""),
    },
  ];
  if (counters.length) {
    faq.push({
      q: `What are the best counters to ${p.name}?`,
      a: `Strong type-based picks include ${joinList(counters.slice(0, 3).map((c) => c.name))}, which hit ${p.name} with super-effective attacks.`,
    });
  }
  return faq;
}
