import type { Nature, StatKey } from "./model";

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP", atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed",
};

export function filterNatures(natures: readonly Nature[], up: StatKey | null, down: StatKey | null): Nature[] {
  return natures.filter((n) => (!up || n.up === up) && (!down || n.down === down));
}
