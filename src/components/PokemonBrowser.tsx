"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PokemonSummary } from "@/lib/data";
import { TYPE_NAMES, type TypeName } from "@/lib/model";
import { filterPokemon } from "@/lib/search";
import { typeLabel } from "@/lib/typechart";
import { Sprite } from "./Sprite";
import { TypeBadge } from "./TypeBadge";

const PAGE = 60;
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const field = "rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

export function PokemonBrowser({ all }: { all: PokemonSummary[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeName | null>(null);
  const [gen, setGen] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const results = useMemo(() => filterPokemon(all, { q, type, gen }), [all, q, type, gen]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit((l) => l + PAGE);
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          aria-label="Search Pokémon"
          placeholder="Search by name or number"
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
          className={`${field} min-w-56 flex-1`}
        />
        <select aria-label="Filter by type" value={type ?? ""} onChange={(e) => { setType((e.target.value || null) as TypeName | null); setLimit(PAGE); }} className={field}>
          <option value="">All types</option>
          {TYPE_NAMES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
        <select aria-label="Filter by generation" value={gen ?? ""} onChange={(e) => { setGen(e.target.value ? Number(e.target.value) : null); setLimit(PAGE); }} className={field}>
          <option value="">All generations</option>
          {GENERATIONS.map((g) => <option key={g} value={g}>Gen {g}</option>)}
        </select>
      </div>
      <p className="mb-2 text-sm text-zinc-500">{results.length} Pokémon</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {results.slice(0, limit).map((p) => (
          <li key={p.slug}>
            <Link href={`/pokemon/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <Sprite src={p.sprite} name={p.name} type={p.types[0]} size={56} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="text-xs text-zinc-500">#{p.dex}</span>
                <span className="mt-1 flex gap-1">{p.types.map((t) => <TypeBadge key={t} type={t} link={false} />)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div ref={sentinel} aria-hidden="true" className={limit < results.length ? "h-10" : "h-0"} />
    </div>
  );
}
