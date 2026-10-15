import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Sprite } from "@/components/Sprite";
import { TypeBadge } from "@/components/TypeBadge";
import { pokemonOfType } from "@/lib/data";
import { isTypeName, TYPE_NAMES } from "@/lib/model";
import { pageMetadata } from "@/lib/seo";
import { typeDescription, typeFaq } from "@/lib/type-page";
import { defenseProfile, formatMultiplier, groupByMultiplier, offenseProfile, typeLabel } from "@/lib/typechart";

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

function Groups({ title, groups }: { title: string; groups: ReturnType<typeof groupByMultiplier> }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <dl className="mt-2 space-y-2">
        {groups.map((g) => (
          <div key={g.multiplier} className="flex flex-wrap items-center gap-2">
            <dt className="w-12 font-semibold">{formatMultiplier(g.multiplier)}</dt>
            <dd className="flex flex-wrap gap-1">{g.types.map((t) => <TypeBadge key={t} type={t} />)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function TypePage({ params }: Props) {
  const { type } = await params;
  if (!isTypeName(type)) notFound();
  const label = typeLabel(type);
  const members = pokemonOfType(type);
  return (
    <>
      <Breadcrumbs items={[{ name: `${label} type`, path: `/types/${type}` }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">{label} Type Weakness &amp; Strengths</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{typeDescription(type)}</p>
      <Groups title={`Defending: damage ${label} Pokémon take`} groups={groupByMultiplier(defenseProfile([type]))} />
      <Groups title={`Attacking: damage ${label} moves deal`} groups={groupByMultiplier(offenseProfile(type))} />
      <AdSlot id="type-1" />
      <section className="mt-8">
        <h2 className="text-xl font-semibold">All {label}-type Pokémon ({members.length})</h2>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((p) => (
            <li key={p.slug}>
              <Link href={`/pokemon/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                <Sprite src={p.sprite} name={p.name} type={p.types[0]} size={48} />
                <span className="truncate">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Faq items={typeFaq(type)} />
    </>
  );
}
