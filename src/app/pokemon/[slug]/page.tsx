import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Sprite } from "@/components/Sprite";
import { StatBars } from "@/components/StatBars";
import { TypeBadge } from "@/components/TypeBadge";
import { offenseVsProfile, recommendCounters } from "@/lib/counters";
import {
  getAbilityModifiers,
  getAbilityName,
  getAllPokemon,
  getEvolutionStages,
  getPokemon,
  hasEvolution,
  sameTypeCombo,
} from "@/lib/data";
import { abilityChanges, guaranteedProfile } from "@/lib/matchups";
import { pokemonDescription, pokemonFaq } from "@/lib/pokemon-page";
import { pageMetadata } from "@/lib/seo";
import { formatMultiplier, groupByMultiplier, typeLabel } from "@/lib/typechart";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPokemon().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPokemon(slug);
  if (!p) return {};
  return pageMetadata({
    title: `${p.name} Weakness & Counters – Type Matchups`,
    description: pokemonDescription(p),
    path: `/pokemon/${p.slug}`,
  });
}

const h2 = "text-xl font-semibold";

export default async function PokemonPage({ params }: Props) {
  const { slug } = await params;
  const p = getPokemon(slug);
  if (!p) notFound();

  const modifiers = getAbilityModifiers();
  const profile = guaranteedProfile(p, modifiers);
  const groups = groupByMultiplier(profile);
  const changes = abilityChanges(p, modifiers);
  const counters = recommendCounters(p, getAllPokemon(), 6, modifiers);
  const stages = getEvolutionStages(p);
  const same = sameTypeCombo(p).slice(0, 12);

  return (
    <article>
      <Breadcrumbs items={[{ name: "Pokémon", path: "/pokemon" }, { name: p.name, path: `/pokemon/${p.slug}` }]} />
      <header className="flex items-center gap-4">
        <Sprite src={p.sprite} name={p.name} type={p.types[0]} eager />
        <div>
          <p className="text-sm text-zinc-500">#{String(p.dex).padStart(4, "0")}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{p.name} Weakness &amp; Counters</h1>
          <div className="mt-2 flex gap-1">{p.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className={h2}>Type matchups</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="w-20 py-2">Damage</th>
              <th className="py-2">Attacking types</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.multiplier} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2 font-semibold">{formatMultiplier(g.multiplier)}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">{g.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {changes.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {changes.map(({ ability, changes: c, always }) => (
              <li key={ability.slug}>
                <strong>{always ? `${getAbilityName(ability.slug)} (always, already counted above):` : `With ${getAbilityName(ability.slug)}:`}</strong>{" "}
                {c.map((x) => `${typeLabel(x.type)} ${formatMultiplier(x.from)} → ${formatMultiplier(x.to)}`).join(", ")}
                {ability.note ? ` (${ability.note})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdSlot id="pokemon-1" />

      <section className="mt-8">
        <h2 className={h2}>Base stats</h2>
        <StatBars stats={p.stats} />
      </section>

      {hasEvolution(p) && (
        <section className="mt-8">
          <h2 className={h2}>Evolution</h2>
          <ol className="mt-2 flex flex-wrap items-center gap-3">
            {stages.map((stage, i) => (
              <li key={i} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">→</span>}
                <div className="flex flex-col gap-1">
                  {stage.map((e) => (
                    <Link key={e.slug} href={`/pokemon/${e.slug}`} className="flex items-center gap-1 hover:underline">
                      <Sprite src={e.sprite} name={e.name} type={e.types[0]} size={48} />
                      <span className={e.slug === p.slug || e.slug === p.speciesSlug ? "font-semibold" : ""}>{e.name}</span>
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {counters.length > 0 && (
        <section className="mt-8">
          <h2 className={h2}>Best counters to {p.name}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {counters.map((c) => (
              <li key={c.slug}>
                <Link href={`/pokemon/${c.slug}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <Sprite src={c.sprite} name={c.name} type={c.types[0]} size={56} />
                  <span>
                    <span className="block font-medium">{c.name}</span>
                    <span className="text-xs text-zinc-500">Hits for {formatMultiplier(offenseVsProfile(c, profile))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {same.length > 0 && (
        <section className="mt-8">
          <h2 className={h2}>Other {p.types.map(typeLabel).join("/")} Pokémon</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {same.map((o) => (
              <li key={o.slug}>
                <Link href={`/pokemon/${o.slug}`} className="underline">{o.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq items={pokemonFaq(p, counters)} />
    </article>
  );
}
