import { baseStatTotal, isMega } from "./counters";
import { getAbilityName, getAllPokemon, getEvolutionStages, getPokemon, hasEvolution, sameTypeCombo } from "./data";
import { STAT_KEYS, TYPE_NAMES, type Pokemon, type StatKey, type TypeName } from "./model";
import { STAT_LABELS } from "./natures";
import { joinList } from "./text";
import { defenseProfile, effectiveness, formatMultiplier, typeLabel, type Profile } from "./typechart";

/**
 * Data-driven prose for a Pokémon page. Every sentence is computed from the dataset so each page
 * says something specific about that Pokémon rather than repeating a template.
 */

const PLURALS: Record<string, string> = { weakness: "weaknesses", immunity: "immunities", "other Pokémon": "other Pokémon" };
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : (PLURALS[word] ?? `${word}s`)}`;
const typeList = (types: readonly TypeName[]) => joinList(types.map(typeLabel));

let sortedCache: Record<StatKey | "bst" | "bulk", number[]> | null = null;
function sorted() {
  if (sortedCache) return sortedCache;
  const all = getAllPokemon();
  const col = (f: (p: Pokemon) => number) => all.map(f).sort((a, b) => a - b);
  sortedCache = {
    ...(Object.fromEntries(STAT_KEYS.map((k) => [k, col((p) => p.stats[k])])) as Record<StatKey, number[]>),
    bst: col(baseStatTotal),
    bulk: col((p) => p.stats.hp + p.stats.def + p.stats.spd),
  };
  return sortedCache;
}

/** Share of all Pokémon (forms included) with a strictly lower value, 0–100. */
export function percentile(key: StatKey | "bst" | "bulk", value: number): number {
  const arr = sorted()[key];
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / arr.length) * 100);
}

export function roleSummary(p: Pokemon): string {
  const { stats } = p;
  const bst = baseStatTotal(p);
  const best = STAT_KEYS.reduce((a, b) => (stats[b] > stats[a] ? b : a));
  const sentences = [`${p.name} has a base stat total of ${bst}, higher than ${percentile("bst", bst)}% of Pokémon.`];
  // Attack and Sp. Atk are covered by the attacker sentence below.
  if (best !== "atk" && best !== "spa") sentences.push(`Its best stat is ${STAT_LABELS[best]} (${stats[best]}).`);

  if (stats.atk >= stats.spa * 1.2) {
    sentences.push(`With Attack (${stats.atk}) well above Sp. Atk (${stats.spa}), it works best as a physical attacker.`);
  } else if (stats.spa >= stats.atk * 1.2) {
    sentences.push(`With Sp. Atk (${stats.spa}) well above Attack (${stats.atk}), it works best as a special attacker.`);
  } else {
    sentences.push(`Its Attack (${stats.atk}) and Sp. Atk (${stats.spa}) are close, so it can run physical or special moves.`);
  }

  const spe = percentile("spe", stats.spe);
  if (spe >= 75) sentences.push(`A Speed of ${stats.spe} beats ${spe}% of Pokémon, so it outspeeds most opponents.`);
  else if (spe >= 40) sentences.push(`Its Speed of ${stats.spe} is middling (faster than ${spe}% of Pokémon).`);
  else sentences.push(`At ${stats.spe} Speed it is slower than most Pokémon, which suits Trick Room teams.`);

  const bulk = percentile("bulk", stats.hp + stats.def + stats.spd);
  const leaning =
    stats.def >= stats.spd * 1.2 ? " and holds up better against physical hits" : stats.spd >= stats.def * 1.2 ? " and holds up better against special hits" : "";
  const word = bulk >= 75 ? "bulky" : bulk >= 40 ? "reasonably sturdy" : "frail";
  sentences.push(`With ${stats.hp} HP, ${stats.def} Defense and ${stats.spd} Sp. Def it is ${word}${leaning}.`);
  return sentences.join(" ");
}

/** How to beat the Pokémon: which move types to use and avoid, then why the top counters work. */
export function howToBeat(p: Pokemon, profile: Profile, counters: Pokemon[]): string[] {
  const at = (keep: (m: number) => boolean) => TYPE_NAMES.filter((t) => keep(profile[t]));
  const x4 = at((m) => m >= 4);
  const x2 = at((m) => m === 2);
  const immune = at((m) => m === 0);
  const resisted = at((m) => m > 0 && m < 1);
  const out: string[] = [];

  if (x4.length) {
    let s = `The best way to beat ${p.name} is with ${typeList(x4)} moves, which deal 4× damage.`;
    if (x2.length) s += ` ${typeList(x2)} moves are also super effective (2×).`;
    out.push(s);
  } else if (x2.length) {
    out.push(`${p.name} takes 2× damage from ${typeList(x2)} moves, so lead with those.`);
  } else {
    out.push(`${p.name} has no type weaknesses, so no move type deals super-effective damage. Use your strongest neutral attacks instead.`);
  }

  const avoid: string[] = [];
  if (immune.length) avoid.push(`${typeList(immune)} moves have no effect on it`);
  if (resisted.length) avoid.push(`${typeList(resisted)} moves are resisted`);
  if (avoid.length) out.push(`Avoid relying on attacks it shrugs off: ${joinList(avoid)}.`);

  const reasons = counters.slice(0, 3).map((c) => {
    const stab = c.types.reduce((a, b) => (profile[b] > profile[a] ? b : a));
    const immuneTo = p.types.filter((t) => effectiveness(t, c.types) === 0);
    const resists = p.types.filter((t) => effectiveness(t, c.types) > 0 && effectiveness(t, c.types) < 1);
    const weakTo = p.types.filter((t) => effectiveness(t, c.types) > 1);
    let s = `${c.name} hits for ${formatMultiplier(profile[stab])} with ${typeLabel(stab)}-type STAB`;
    if (weakTo.length) {
      s += `, but is weak to ${p.name}'s ${typeList(weakTo)} moves, so switch it in carefully`;
    } else {
      const shrugs = [
        immuneTo.length ? `is immune to ${p.name}'s ${typeList(immuneTo)} moves` : "",
        resists.length ? `resists its ${typeList(resists)} moves` : "",
      ].filter(Boolean);
      if (shrugs.length) s += ` and ${joinList(shrugs)}`;
    }
    return `${s}.`;
  });
  if (reasons.length) out.push(`Good counters: ${reasons.join(" ")}`);
  return out;
}

export function evolutionSummary(p: Pokemon): string {
  const species = getPokemon(p.speciesSlug);
  if (p.form && species && species.slug !== p.slug) {
    const kind = isMega(p) ? "a Mega Evolution" : "an alternate form";
    return `${p.name} is ${kind} of ${species.name}, so it shares ${species.name}'s evolution line.`;
  }
  if (!hasEvolution(p)) return `${p.name} does not evolve.`;
  const stages = getEvolutionStages(p);
  const names = stages.map((stage) => joinList(stage.map((s) => s.name)).replace(/ and /g, " or "));
  const i = stages.findIndex((stage) => stage.some((s) => s.slug === p.slug || s.slug === p.speciesSlug));
  const chain = names.join(" → ");
  if (i === 0) return `${p.name} is the first stage of a ${stages.length}-stage line (${chain}) and evolves into ${names[1]}.`;
  if (i === stages.length - 1) return `${p.name} is the final stage of a ${stages.length}-stage line (${chain}), evolving from ${names[i - 1]}.`;
  return `${p.name} is the middle stage of its line (${chain}): it evolves from ${names[i - 1]} and into ${names[i + 1]}.`;
}

export function abilitySummary(p: Pokemon): string {
  if (!p.abilities.length) return "";
  const names = p.abilities.map(getAbilityName);
  return p.abilities.length === 1
    ? `${p.name}'s only ability is ${names[0]}.`
    : `${p.name} can have the abilities ${joinList(names)}.`;
}

let avgWeak: number | null = null;
function averageWeaknesses(): number {
  if (avgWeak === null) {
    const all = getAllPokemon();
    const count = (p: Pokemon) => TYPE_NAMES.filter((t) => defenseProfile(p.types)[t] > 1).length;
    avgWeak = all.reduce((n, p) => n + count(p), 0) / all.length;
  }
  return avgWeak;
}

export function typingSummary(p: Pokemon, profile: Profile): string {
  const types = p.types.map(typeLabel).join("/");
  const weak = TYPE_NAMES.filter((t) => profile[t] > 1).length;
  const resist = TYPE_NAMES.filter((t) => profile[t] > 0 && profile[t] < 1).length;
  const immune = TYPE_NAMES.filter((t) => profile[t] === 0).length;
  const avg = averageWeaknesses();
  const compare = weak < avg - 0.5 ? "fewer than" : weak > avg + 0.5 ? "more than" : "about the same as";
  const others = sameTypeCombo(p).length;
  const share = others ? `${plural(others, "other Pokémon")} share the ${types} typing.` : `No other Pokémon has the ${types} typing.`;
  return `As ${/^[AEIOU]/.test(types) ? "an" : "a"} ${types} type, ${p.name} has ${plural(weak, "weakness")}, ${plural(resist, "resistance")} and ${plural(immune, "immunity")}, ${compare} the average Pokémon's ${avg.toFixed(1)} weaknesses. ${share}`;
}
