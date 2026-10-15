import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { TypeCalculator } from "@/components/TypeCalculator";
import { TypeChartTable } from "@/components/TypeChartTable";
import { homeFaq } from "@/lib/home-faq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Type Chart & Weakness Calculator",
  description:
    "Interactive Pokémon type chart for all 18 types. Pick one or two types to see weaknesses, resistances and immunities instantly, or check what a move type is super effective against.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <Breadcrumbs items={[]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Type Chart &amp; Weakness Calculator</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Pick a Pokémon&apos;s types to see what it is weak to, or switch to Attacking to see what a move hits hard.
      </p>
      <TypeCalculator />
      <AdSlot id="home-1" />
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Full type chart</h2>
        <p className="mb-3 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Rows are the attacking type, columns the defending type. Tap a type to highlight its row or column.
        </p>
        <TypeChartTable />
      </section>
      <section className="mt-8 max-w-2xl space-y-3">
        <h2 className="text-xl font-semibold">How type matchups work</h2>
        <p>
          Every move has one type. Against a single-type Pokémon a move is super effective (2×), neutral (1×),
          not very effective (½×) or has no effect (0×). Against a dual-type Pokémon the two multipliers are
          multiplied, which is how 4× weaknesses and ¼× resistances happen.
        </p>
        <p>This chart uses the current rules from Generation 6 onward, including the Fairy type.</p>
      </section>
      <Faq items={homeFaq()} />
    </>
  );
}
