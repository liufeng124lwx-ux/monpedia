import { TYPE_NAMES, type TypeName } from "./model";
import type { Qa } from "./seo";
import { joinList } from "./text";
import { countSuperEffective, countWeaknesses, typeLabel } from "./typechart";

function leaders(score: (t: TypeName) => number): { types: string[]; score: number } {
  const best = Math.max(...TYPE_NAMES.map(score));
  const types = TYPE_NAMES.filter((t) => score(t) === best).map(typeLabel).sort();
  return { types, score: best };
}

export function homeFaq(): Qa[] {
  const weak = leaders(countWeaknesses);
  const strong = leaders(countSuperEffective);
  return [
    {
      q: "How many types are there in Pokémon?",
      a: `There are 18 types: ${joinList(TYPE_NAMES.map(typeLabel))}.`,
    },
    {
      q: "Which type has the most weaknesses?",
      a: `${joinList(weak.types)} ${weak.types.length > 1 ? "each have" : "has"} ${weak.score} weaknesses as a single type.`,
    },
    {
      q: "Which type is super effective against the most types?",
      a: `${joinList(strong.types)} ${strong.types.length > 1 ? "are each" : "is"} super effective against ${strong.score} types.`,
    },
    {
      q: "How do dual-type weaknesses work?",
      a: "The two multipliers are multiplied. A move that is super effective against both types deals 4× damage, one that both types resist deals ¼×, and an immunity on either type makes the total 0×.",
    },
  ];
}
