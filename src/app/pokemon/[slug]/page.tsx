import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { HoloCard } from "@/components/HoloCard";
import { MatchupRows, MultiplierChip } from "@/components/Matchups";
import { H2, Wrap } from "@/components/Page";
import { dexNo, PokemonCard } from "@/components/PokemonCard";
import { Sprite } from "@/components/Sprite";
import { StatBars } from "@/components/StatBars";
import { TypeBadge } from "@/components/TypeBadge";
import { groupLabel } from "@/lib/calculator";
import { offenseVsProfile, recommendCounters } from "@/lib/counters";
import {
  getAbilityModifiers,
  getAbilityName,
  getAllPokemon,
  getEvolutionStages,
  getPokemon,
  hasEvolution,
  sameTypeCombo,
  toSummary,
} from "@/lib/data";
import { abilityChanges, guaranteedProfile } from "@/lib/matchups";
import type { Pokemon } from "@/lib/model";
import { pokemonDescription, pokemonFaq } from "@/lib/pokemon-page";
import { pageMetadata } from "@/lib/seo";
import { TYPE_COLORS } from "@/lib/type-colors";
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

/** Previous/next in Pokédex order, like the arrows on pokemon.com's Pokédex pages. */
function neighbors(p: Pokemon): [Pokemon | undefined, Pokemon | undefined] {
  const all = getAllPokemon();
  const i = all.findIndex((x) => x.slug === p.slug);
  return [all[i - 1], all[i + 1]];
}

const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

function DexArrow({ to, dir }: { to: Pokemon | undefined; dir: "prev" | "next" }) {
  if (!to) return <span />;
  return (
    <Link
      href={`/pokemon/${to.slug}`}
      transitionTypes={[dir === "next" ? "nav-forward" : "nav-back"]}
      rel={dir}
      className={`group flex min-w-0 items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-sm font-bold transition-colors duration-(--duration-fast) hover:bg-black/25 ${dir === "next" ? "flex-row-reverse" : ""}`}
    >
      <span aria-hidden="true" className="transition-transform duration-(--duration-fast) group-hover:scale-125">
        {dir === "next" ? "→" : "←"}
      </span>
      <span className="hidden tabular-nums opacity-70 sm:inline">{dexNo(to.dex)}</span>
      <span className="max-w-36 truncate">{to.name}</span>
    </Link>
  );
}

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
  const [prev, next] = neighbors(p);
  const main = TYPE_COLORS[p.types[0]];
  // Dual types show the second type behind the artwork; single types get a light disk on their own color.
  const disk = p.types[1]
    ? `radial-gradient(circle at 50% 40%, ${TYPE_COLORS[p.types[1]].bg}, color-mix(in srgb, ${TYPE_COLORS[p.types[1]].bg} 55%, black))`
    : "radial-gradient(circle at 50% 40%, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.12))";
  const weak = groups.filter((g) => g.multiplier > 1);

  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      <article>
        <section style={{ backgroundColor: main.bg, color: main.fg }} className="relative overflow-hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 right-0 select-none text-[11rem] font-extrabold leading-none tracking-tighter opacity-10 sm:text-[16rem]"
          >
            {String(p.dex).padStart(4, "0")}
          </span>
          <Wrap className="relative py-8 sm:py-12">
            <div className="mb-6 flex items-center justify-between gap-2">
              <DexArrow to={prev} dir="prev" />
              <DexArrow to={next} dir="next" />
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <Breadcrumbs items={[{ name: "Pokémon", path: "/pokemon" }, { name: p.name, path: `/pokemon/${p.slug}` }]} />
                <p className="text-lg font-extrabold tabular-nums opacity-70">{dexNo(p.dex)}</p>
                <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl">{p.name} Weakness &amp; Counters</h1>
                <div className="mt-4 flex gap-2">
                  {p.types.map((t) => <TypeBadge key={t} type={t} size="md" className="ring-2 ring-white/70" />)}
                </div>
                {weak.length > 0 && (
                  <div className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-[10px] bg-paper p-3 text-ink">
                    <span className="mr-1 text-sm font-extrabold uppercase tracking-wider">Weak to</span>
                    {weak.flatMap((g) =>
                      g.types.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1">
                          <TypeBadge type={t} />
                          <span className="text-sm font-extrabold tabular-nums">{formatMultiplier(g.multiplier)}</span>
                        </span>
                      )),
                    )}
                  </div>
                )}
              </div>
              <div className="bob justify-self-center">
                <HoloCard className="rounded-full">
                  <div
                    className="flex size-64 items-center justify-center rounded-full sm:size-80"
                    style={{ background: disk }}
                  >
                    <Sprite src={p.sprite} name={p.name} type={p.types[0]} size={280} eager morph={`art-${p.slug}`} className="max-sm:size-56!" />
                  </div>
                </HoloCard>
              </div>
            </div>
          </Wrap>
        </section>

        <Wrap className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <section>
            <H2>Type matchups</H2>
            <p className="mb-5 mt-1 text-muted">Damage {p.name} takes from each attacking type.</p>
            <MatchupRows groups={groups} label={(m) => groupLabel("defense", m)} />
            {changes.length > 0 && (
              <ul className="mt-6 space-y-2">
                {changes.map(({ ability, changes: c, always }) => (
                  <li key={ability.slug} className="rounded-[10px] bg-panel p-4 text-sm">
                    <strong className="font-extrabold">
                      {always ? `${getAbilityName(ability.slug)} (always, already counted above):` : `With ${getAbilityName(ability.slug)}:`}
                    </strong>{" "}
                    {c.map((x) => `${typeLabel(x.type)} ${formatMultiplier(x.from)} → ${formatMultiplier(x.to)}`).join(", ")}
                    {ability.note ? ` (${ability.note})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <H2>Base stats</H2>
            <StatBars stats={p.stats} />
          </section>
        </Wrap>

        <Wrap>
          <AdSlot id="pokemon-1" />
        </Wrap>

        {hasEvolution(p) && (
          <Wrap className="mt-14">
            <section>
              <H2>Evolution</H2>
              <ol className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                {stages.map((stage, i) => (
                  <li key={i} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                    {i > 0 && (
                      <span aria-hidden="true" className="pl-6 text-2xl font-extrabold text-muted sm:pl-0">
                        <span className="sm:hidden">↓</span>
                        <span className="hidden sm:inline">→</span>
                      </span>
                    )}
                    <div className="flex flex-col gap-2">
                      {stage.map((e) => {
                        const current = e.slug === p.slug || e.slug === p.speciesSlug;
                        return (
                          <Link
                            key={e.slug}
                            href={`/pokemon/${e.slug}`}
                            aria-current={current ? "page" : undefined}
                            className={`flex items-center gap-2 rounded-[10px] py-1 pl-1 pr-4 transition-colors duration-(--duration-fast) ${current ? "bg-ink text-paper" : "bg-panel hover:bg-line"}`}
                          >
                            <Sprite src={e.sprite} name={e.name} type={e.types[0]} size={56} />
                            <span className="font-extrabold">{e.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </Wrap>
        )}

        {counters.length > 0 && (
          <Wrap className="mt-14">
            <section>
              <H2>Best counters to {p.name}</H2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {counters.map((c) => (
                  <li key={c.slug}>
                    <PokemonCard
                      p={toSummary(c)}
                      size={96}
                      footer={
                        <span className="flex items-center gap-2">
                          <span className="text-muted">Hits for</span>
                          <MultiplierChip m={offenseVsProfile(c, profile)} className="min-w-0 py-0.5 text-sm" />
                        </span>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          </Wrap>
        )}

        {same.length > 0 && (
          <Wrap className="mt-14">
            <section>
              <H2>Other {p.types.map(typeLabel).join("/")} Pokémon</H2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {same.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/pokemon/${o.slug}`} className="block rounded-full bg-panel px-3 py-1.5 text-sm font-bold hover:bg-line">
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Wrap>
        )}

        <Faq items={pokemonFaq(p, counters)} />
      </article>
    </ViewTransition>
  );
}
