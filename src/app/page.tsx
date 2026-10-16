import type { CSSProperties } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Band, Eyebrow, H2, Wrap } from "@/components/Page";
import { TypeCalculator } from "@/components/TypeCalculator";
import { TypeChartTable } from "@/components/TypeChartTable";
import { homeFaq } from "@/lib/home-faq";
import { TYPE_NAMES } from "@/lib/model";
import { pageMetadata } from "@/lib/seo";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";

export const metadata = pageMetadata({
  title: "Pokémon Type Chart & Weakness Calculator",
  description:
    "Interactive Pokémon type chart for all 18 types. Pick one or two types to see weaknesses, resistances and immunities instantly, or check what a move type is super effective against.",
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

      <Wrap className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-3 leading-relaxed">
          <H2>How type matchups work</H2>
          <p>
            Every move has one type. Against a single-type Pokémon a move is super effective (2×), neutral (1×),
            not very effective (½×) or has no effect (0×). Against a dual-type Pokémon the two multipliers are
            multiplied, which is how 4× weaknesses and ¼× resistances happen.
          </p>
          <p>This chart uses the current rules from Generation 6 onward, including the Fairy type.</p>
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
