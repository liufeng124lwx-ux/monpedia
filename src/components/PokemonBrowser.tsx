"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { PokemonSummary } from "@/lib/data";
import { isTypeName, TYPE_NAMES, type TypeName } from "@/lib/model";
import { filterPokemon, SEARCH_EVENT } from "@/lib/search";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";
import { PokemonCard } from "./PokemonCard";

const PAGE = 60;
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const pill = (on: boolean) =>
  `shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition-colors duration-(--duration-fast) ${on ? "bg-red text-white" : "bg-panel text-ink hover:bg-line"}`;

type Initial = { q: string; type: TypeName | null; gen: number | null };
const EMPTY: Initial = { q: "", type: null, gen: null };

/**
 * The static HTML renders the Suspense fallback (unfiltered list, good for crawlers);
 * in the browser the inner component starts from the URL's ?q / ?type / ?gen.
 */
export function PokemonBrowser({ all }: { all: PokemonSummary[] }) {
  return (
    <Suspense fallback={<Browser all={all} initial={EMPTY} />}>
      <BrowserFromUrl all={all} />
    </Suspense>
  );
}

function BrowserFromUrl({ all }: { all: PokemonSummary[] }) {
  const params = useSearchParams();
  const t = params.get("type") ?? "";
  const g = Number(params.get("gen"));
  const initial = { q: params.get("q") ?? "", type: isTypeName(t) ? t : null, gen: GENERATIONS.includes(g) ? g : null };
  return <Browser all={all} initial={initial} />;
}

function Browser({ all, initial }: { all: PokemonSummary[]; initial: Initial }) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q);
  const [type, setType] = useState<TypeName | null>(initial.type);
  const [gen, setGen] = useState<number | null>(initial.gen);
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const results = useMemo(() => filterPokemon(all, { q, type, gen }), [all, q, type, gen]);

  useEffect(() => {
    const onSearch = (e: Event) => {
      setQ((e as CustomEvent<string>).detail);
      setLimit(PAGE);
    };
    window.addEventListener(SEARCH_EVENT, onSearch);
    return () => window.removeEventListener(SEARCH_EVENT, onSearch);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    if (gen) params.set("gen", String(gen));
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [q, type, gen]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit((l) => l + PAGE);
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const surprise = () => {
    const pool = results.length ? results : all;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/pokemon/${pick.slug}`, { transitionTypes: ["nav-forward"] });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-64 flex-1 items-center gap-3 rounded-md bg-panel px-4 py-3 text-ink ring-2 ring-transparent focus-within:ring-ink">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 fill-none stroke-current stroke-2 opacity-60">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            type="search"
            aria-label="Search Pokémon"
            placeholder="Search by name or number"
            value={q}
            onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
            className="w-full bg-transparent text-lg font-semibold placeholder:font-medium placeholder:text-muted focus:outline-none"
          />
        </label>
        <button type="button" onClick={surprise} className="key px-5 py-3 text-base font-extrabold">
          Surprise me!
        </button>
      </div>

      <div className="mt-5 flex gap-1.5 overflow-x-auto pb-2" role="group" aria-label="Filter by type">
        <button type="button" aria-pressed={type === null} onClick={() => { setType(null); setLimit(PAGE); }} className={pill(type === null)}>
          All types
        </button>
        {TYPE_NAMES.map((t) => {
          const on = type === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => { setType(on ? null : t); setLimit(PAGE); }}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition-[opacity,transform] duration-(--duration-fast) hover:-translate-y-0.5"
              style={{
                backgroundColor: TYPE_COLORS[t].bg,
                color: TYPE_COLORS[t].fg,
                opacity: type && !on ? 0.45 : 1,
                outline: on ? "3px solid var(--ink)" : undefined,
                outlineOffset: 2,
              }}
            >
              {typeLabel(t)}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-2" role="group" aria-label="Filter by generation">
        <button type="button" aria-pressed={gen === null} onClick={() => { setGen(null); setLimit(PAGE); }} className={pill(gen === null)}>
          All gens
        </button>
        {GENERATIONS.map((g) => (
          <button key={g} type="button" aria-pressed={gen === g} onClick={() => { setGen(gen === g ? null : g); setLimit(PAGE); }} className={pill(gen === g)}>
            Gen {g}
          </button>
        ))}
      </div>

      <p className="mb-4 mt-6 text-sm font-bold text-muted" aria-live="polite">
        {results.length} Pokémon
      </p>
      {results.length === 0 ? (
        <div className="rounded-[10px] bg-panel p-8 text-center">
          <p className="text-xl font-extrabold">No Pokémon matched your search</p>
          <p className="mt-1 text-muted">Try fewer filters, or search by Pokédex number.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {results.slice(0, limit).map((p) => (
            <li key={p.slug}>
              <PokemonCard p={p} morph />
            </li>
          ))}
        </ul>
      )}
      <div ref={sentinel} aria-hidden="true" className={limit < results.length ? "h-10" : "h-0"} />
    </div>
  );
}
