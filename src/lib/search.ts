import type { PokemonSummary } from "./data";
import type { TypeName } from "./model";

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function matchesQuery(p: { name: string; slug: string; dex: number }, q: string): boolean {
  const trimmed = q.trim().replace(/^#/, "");
  if (trimmed === "") return true;
  if (/^\d+$/.test(trimmed)) return p.dex === Number(trimmed);
  const nq = normalize(trimmed);
  return normalize(p.name).includes(nq) || normalize(p.slug).includes(nq);
}

export type PokemonFilter = { q: string; type: TypeName | null; gen: number | null };

export function filterPokemon<T extends PokemonSummary>(list: readonly T[], f: PokemonFilter): T[] {
  return list.filter(
    (p) => (!f.type || p.types.includes(f.type)) && (!f.gen || p.generation === f.gen) && matchesQuery(p, f.q),
  );
}
