import type { CSSProperties } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Band, Eyebrow, H2, H3, Wrap } from "@/components/Page";
import { TypeBadge } from "@/components/TypeBadge";
import { TypeCalculator } from "@/components/TypeCalculator";
import { TypeChartTable } from "@/components/TypeChartTable";
import { homeFaq } from "@/lib/home-faq";
import { TYPE_NAMES } from "@/lib/model";
import { pageMetadata } from "@/lib/seo";
import { joinList } from "@/lib/text";
import { typeMatchupLists } from "@/lib/type-page";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";

export const metadata = pageMetadata({
  title: "Pokémon Type Chart & Weakness Calculator",
  description:
    "Interactive Pokémon type chart for all 18 types. Pick one or two types to see weaknesses, resistances and immunities, or what a move type hits hard.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <Band tone="yellow" className="pb-4">
        <Breadcrumbs items={[]} />
        <Eyebrow>All 18 types · Gen 6 onward</Eyebrow>
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[0.95] sm:text-6xl">
          Pokémon Type Chart &amp; Weakness Calculator
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium">
          Pick a Pokémon&apos;s types to see what it is weak to, or switch to Attacking to see what a move hits hard.
        </p>
        <div className="mt-8">
          <TypeCalculator />
        </div>
      </Band>

      <Wrap>
        <AdSlot id="home-1" />
      </Wrap>

      <Band tone="ink">
        <Eyebrow>Reference</Eyebrow>
        <H2>Full type chart</H2>
        <p className="mb-6 mt-2 max-w-2xl text-white/70">
          Rows are the attacking type, columns the defending type. Tap a type to highlight its row or column.
        </p>
        <TypeChartTable />
      </Band>

      <Wrap className="mt-14">
        <section>
          <H2>Pokémon type chart cheat sheet</H2>
          <p className="mt-2 max-w-3xl text-muted">
            Every type at a glance: what its moves hit hard, and what hits a Pokémon of that type hard.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TYPE_NAMES.map((t) => {
              const l = typeMatchupLists(t);
              return (
                <li key={t} className="rounded-[10px] bg-panel p-4">
                  <TypeBadge type={t} size="md" />
                  <dl className="mt-3 space-y-1.5 text-sm leading-snug">
                    <div>
                      <dt className="inline font-extrabold">Strong against: </dt>
                      <dd className="inline">{l.strongAgainst.length ? joinList(l.strongAgainst) : "nothing"}</dd>
                    </div>
                    <div>
                      <dt className="inline font-extrabold">Weak to: </dt>
                      <dd className="inline">{joinList(l.weakTo)}</dd>
                    </div>
                    <div>
                      <dt className="inline font-extrabold">Resists: </dt>
                      <dd className="inline">{l.resists.length ? joinList(l.resists) : "nothing"}</dd>
                    </div>
                    {l.immuneTo.length > 0 && (
                      <div>
                        <dt className="inline font-extrabold">Immune to: </dt>
                        <dd className="inline">{joinList(l.immuneTo)}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      </Wrap>

      <Wrap className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-3 leading-relaxed">
          <H2>How type matchups work</H2>
          <p>
            Every move has one type. Against a single-type Pokémon a move is super effective (2×), neutral (1×),
            not very effective (½×) or has no effect (0×). Against a dual-type Pokémon the two multipliers are
            multiplied, which is how 4× weaknesses and ¼× resistances happen.
          </p>
          <p>
            For example, a Water move against a Ground/Rock Pokémon such as Rhydon is 2× against Ground and 2× against
            Rock, so it deals 4× damage. An Electric move against the same Pokémon does nothing, because Ground is
            immune to Electric and any 0× makes the total 0×.
          </p>
          <p>
            Moves that share a type with the Pokémon using them get a 1.5× Same Type Attack Bonus (STAB) on top of the
            type multiplier. That is why a Pokémon&apos;s own types decide which weaknesses it can exploit best.
          </p>
          <p>
            Some abilities change matchups too: Levitate makes a Pokémon immune to Ground, and Thick Fat halves Fire
            and Ice damage. Each Pokémon&apos;s page includes the abilities it always has.
          </p>
          <p>This chart uses the current rules from Generation 6 onward, including the Fairy type.</p>
          <H3>How to use the weakness calculator</H3>
          <p>
            In Defending mode, pick one or two types to see every type that is super effective against that
            combination, what it resists and what it is immune to. In Attacking mode, pick a move type to see which
            Pokémon types it hits hard. The address bar updates as you pick, so you can bookmark or share any result.
          </p>
        </section>
        <section>
          <H2>Browse by type</H2>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TYPE_NAMES.map((t) => (
              <li key={t}>
                <Link
                  href={`/types/${t}`}
                  className="key block px-1 py-2.5 text-center text-sm font-extrabold"
                  style={{ "--key-bg": TYPE_COLORS[t].bg, "--key-fg": TYPE_COLORS[t].fg } as CSSProperties}
                >
                  {typeLabel(t)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Wrap>

      <Faq items={homeFaq()} />
    </>
  );
}
