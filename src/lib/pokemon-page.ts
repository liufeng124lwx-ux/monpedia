import { getAbilityModifiers } from "./data";
import { guaranteedMatchups } from "./matchups";
import type { Pokemon } from "./model";
import { fitDescription, type Qa } from "./seo";
import { joinList } from "./text";
import { formatMultiplier, typeLabel, type MatchupGroup } from "./typechart";

const PLAIN = new Set([2, 0.5, 0]);

function labels(groups: MatchupGroup[], keep: (m: number) => boolean): string[] {
  return groups
    .filter((g) => keep(g.multiplier))
    .flatMap((g) => g.types.map((t) => (PLAIN.has(g.multiplier) ? typeLabel(t) : `${typeLabel(t)} (${formatMultiplier(g.multiplier)})`)));
}

/** Matchups including abilities the Pokémon always has (spec §2.2). */
export function weaknessSummary(p: Pick<Pokemon, "types" | "abilities">) {
  const groups = guaranteedMatchups(p, getAbilityModifiers());
  return {
    weak: labels(groups, (m) => m > 1),
    resist: labels(groups, (m) => m > 0 && m < 1),
    immune: labels(groups, (m) => m === 0),
  };
}

const typeString = (p: Pick<Pokemon, "types">) => p.types.map(typeLabel).join("/");
const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

export function pokemonDescription(p: Pokemon): string {
  const { weak, resist, immune } = weaknessSummary(p);
  const types = typeString(p);
  const head = `${p.name} is ${article(types)} ${types}-type Pokémon. ${weak.length ? `It is weak to ${joinList(weak)}` : "It has no weaknesses"}`;
  const res = resist.length ? `, resists ${joinList(resist)}` : "";
  const imm = immune.length ? ` and is immune to ${joinList(immune)}` : "";
  // Longest first; drop the resist list, then the tail, until it fits a search snippet.
  return fitDescription([
    `${head}${res}${imm}. See its best counters, base stats and evolutions.`,
    `${head}${res}${imm}. See its best counters.`,
    `${head}${imm}. See its best counters, base stats and evolutions.`,
    `${head}${imm}. See its best counters.`,
    `${head}${imm}.`,
  ]);
}

export function pokemonFaq(p: Pokemon, counters: Pokemon[]): Qa[] {
  const { weak, resist, immune } = weaknessSummary(p);
  const types = typeString(p);
  const faq: Qa[] = [
    {
      q: `What is ${p.name} weak to?`,
      a: weak.length
        ? `As ${article(types)} ${types} type, ${p.name} takes super-effective damage from ${joinList(weak)} moves.`
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
