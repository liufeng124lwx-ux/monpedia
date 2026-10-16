import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { MatchupRows } from "@/components/Matchups";
import { Eyebrow, H2, Wrap } from "@/components/Page";
import { PokemonCard } from "@/components/PokemonCard";
import { groupLabel } from "@/lib/calculator";
import { pokemonOfType, toSummary } from "@/lib/data";
import { isTypeName, TYPE_NAMES } from "@/lib/model";
import { pageMetadata } from "@/lib/seo";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeDescription, typeFaq } from "@/lib/type-page";
import { defenseProfile, groupByMultiplier, offenseProfile, typeLabel } from "@/lib/typechart";

type Props = { params: Promise<{ type: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TYPE_NAMES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!isTypeName(type)) return {};
  return pageMetadata({
    title: `${typeLabel(type)} Type Weakness & Strengths`,
    description: typeDescription(type),
    path: `/types/${type}`,
  });
}

export default async function TypePage({ params }: Props) {
  const { type } = await params;
  if (!isTypeName(type)) notFound();
  const label = typeLabel(type);
  const members = pokemonOfType(type);
  const { bg, fg } = TYPE_COLORS[type];
  return (
    <>
      <section style={{ backgroundColor: bg, color: fg }}>
        <Wrap className="py-10 sm:py-14">
          <Breadcrumbs items={[{ name: `${label} type`, path: `/types/${type}` }]} />
          <Eyebrow>Type · {members.length} Pokémon</Eyebrow>
          <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl">{label} Type Weakness &amp; Strengths</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium">{typeDescription(type)}</p>
          <nav aria-label="Other types" className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
            {TYPE_NAMES.map((t) => (
              <Link
                key={t}
                href={`/types/${t}`}
                aria-current={t === type ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ring-2 transition-transform duration-(--duration-fast) hover:-translate-y-0.5 ${t === type ? "ring-current" : "ring-transparent"}`}
                style={{ backgroundColor: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].fg }}
              >
                {typeLabel(t)}
              </Link>
            ))}
          </nav>
        </Wrap>
      </section>

      <Wrap className="mt-12 grid gap-10 lg:grid-cols-2">
        <section className="rounded-[10px] bg-panel p-5 sm:p-6">
          <H2>{label} type weaknesses</H2>
          <p className="mb-5 mt-1 text-muted">Defending: damage {label} Pokémon take</p>
          <MatchupRows groups={groupByMultiplier(defenseProfile([type]))} label={(m) => groupLabel("defense", m)} />
        </section>
        <section className="rounded-[10px] bg-panel p-5 sm:p-6">
          <H2>{label} type strengths</H2>
          <p className="mb-5 mt-1 text-muted">Attacking: damage {label} moves deal</p>
          <MatchupRows groups={groupByMultiplier(offenseProfile(type))} label={(m) => groupLabel("attack", m)} />
        </section>
      </Wrap>

      <Wrap>
        <AdSlot id="type-1" />
      </Wrap>

      <Wrap className="mt-14">
        <section>
          <H2>All {label}-type Pokémon ({members.length})</H2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {members.map((p) => (
              <li key={p.slug}>
                <PokemonCard p={toSummary(p)} morph size={104} />
              </li>
            ))}
          </ul>
        </section>
      </Wrap>
      <Faq items={typeFaq(type)} />
    </>
  );
}
