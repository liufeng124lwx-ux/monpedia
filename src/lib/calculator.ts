import { isTypeName, type TypeName } from "./model";
import { formatMultiplier } from "./typechart";

export type CalcMode = "defense" | "attack";
export type CalcState = { mode: CalcMode; types: TypeName[] };

export const DEFAULT_STATE: CalcState = { mode: "defense", types: ["fire"] };

const maxTypes = (mode: CalcMode) => (mode === "attack" ? 1 : 2);

export function parseCalcState(search: string): CalcState {
  const params = new URLSearchParams(search);
  const mode: CalcMode = params.get("m") === "attack" ? "attack" : "defense";
  const raw = params.get("t") ?? "";
  const types = [...new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(isTypeName))].slice(
    0,
    maxTypes(mode),
  );
  return { mode, types: types.length ? types : [...DEFAULT_STATE.types] };
}

export function serializeCalcState(s: CalcState): string {
  if (s.mode === DEFAULT_STATE.mode && s.types.join(",") === DEFAULT_STATE.types.join(",")) return "";
  const mode = s.mode === "attack" ? "m=attack&" : "";
  return `?${mode}t=${s.types.join(",")}`;
}

export function toggleType(s: CalcState, t: TypeName): CalcState {
  if (s.types.includes(t)) {
    const rest = s.types.filter((x) => x !== t);
    return { ...s, types: rest.length ? rest : s.types };
  }
  return { ...s, types: [...s.types, t].slice(-maxTypes(s.mode)) };
}

export function setMode(s: CalcState, mode: CalcMode): CalcState {
  return { mode, types: s.types.slice(0, maxTypes(mode)) };
}

export function groupLabel(mode: CalcMode, m: number): string {
  const f = formatMultiplier(m);
  if (mode === "defense") {
    if (m === 0) return `Immune to (${f})`;
    return m > 1 ? `Weak to (${f})` : `Resists (${f})`;
  }
  if (m === 0) return `No effect on (${f})`;
  return m > 1 ? `Super effective against (${f})` : `Not very effective against (${f})`;
}
