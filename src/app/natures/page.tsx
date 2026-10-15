import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { NatureTable } from "@/components/NatureTable";
import { getNatures } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Nature Chart – All 25 Natures",
  description:
    "All 25 Pokémon natures with the stat each one raises and lowers. Filter by stat to find the right nature for Attack, Speed, Sp. Atk and more.",
  path: "/natures",
});

const FAQ = [
  {
    q: "How many natures are there?",
    a: "There are 25 natures. 20 of them raise one stat by 10% and lower another by 10%; the 5 neutral natures (Bashful, Docile, Hardy, Quirky and Serious) change nothing.",
  },
  {
    q: "Which nature is best?",
    a: "It depends on the Pokémon. Physical attackers usually want Adamant (+Attack, −Sp. Atk) or Jolly (+Speed, −Sp. Atk); special attackers usually want Modest (+Sp. Atk, −Attack) or Timid (+Speed, −Attack).",
  },
  {
    q: "Does nature affect HP?",
    a: "No. Natures only affect Attack, Defense, Sp. Atk, Sp. Def and Speed.",
  },
];

export default function NaturesPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Natures", path: "/natures" }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Nature Chart</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Every nature and the stat it raises and lowers. Use the filters to find natures for a specific stat.
      </p>
      <NatureTable natures={getNatures()} />
      <AdSlot id="natures-1" />
      <Faq items={FAQ} />
    </>
  );
}
