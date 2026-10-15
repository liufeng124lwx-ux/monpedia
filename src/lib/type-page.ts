import { TYPE_NAMES, type TypeName } from "./model";
import type { Qa } from "./seo";
import { joinList } from "./text";
import { defenseProfile, offenseProfile, typeLabel, type Profile } from "./typechart";

const pick = (profile: Profile, keep: (m: number) => boolean) =>
  TYPE_NAMES.filter((t) => keep(profile[t])).map(typeLabel);

export function typeMatchupLists(t: TypeName) {
  const def = defenseProfile([t]);
  const off = offenseProfile(t);
  return {
    weakTo: pick(def, (m) => m > 1),
    resists: pick(def, (m) => m > 0 && m < 1),
    immuneTo: pick(def, (m) => m === 0),
    strongAgainst: pick(off, (m) => m > 1),
    weakAgainst: pick(off, (m) => m > 0 && m < 1),
    noEffectOn: pick(off, (m) => m === 0),
  };
}

export function typeDescription(t: TypeName): string {
  const l = typeMatchupLists(t);
  const name = typeLabel(t);
  let s = `${name} type is weak to ${joinList(l.weakTo)}`;
  if (l.resists.length) s += ` and resists ${joinList(l.resists)}`;
  s += `. ${name} moves are super effective against ${l.strongAgainst.length ? joinList(l.strongAgainst) : "no types"}.`;
  return `${s} See every ${name}-type Pokémon and its matchups.`;
}

export function typeFaq(t: TypeName): Qa[] {
  const l = typeMatchupLists(t);
  const name = typeLabel(t);
  return [
    {
      q: `What is ${name} weak to?`,
      a: `${name}-type Pokémon take super-effective damage from ${joinList(l.weakTo)} moves.${l.immuneTo.length ? ` They are immune to ${joinList(l.immuneTo)}.` : ""}`,
    },
    {
      q: `What is ${name} strong against?`,
      a: l.strongAgainst.length
        ? `${name} moves are super effective against ${joinList(l.strongAgainst)} Pokémon.`
        : `${name} moves are not super effective against any type.`,
    },
  ];
}
