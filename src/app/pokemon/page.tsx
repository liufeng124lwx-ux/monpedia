import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Band, Eyebrow, Wrap } from "@/components/Page";
import { PokemonBrowser } from "@/components/PokemonBrowser";
import { getAllPokemon, toSummary } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Weakness List – Every Pokémon's Type Matchups",
  description:
    "Search every Pokémon, including Mega Evolutions and regional forms, and open its weaknesses, resistances, immunities and best counters.",
  path: "/pokemon",
});

export default function PokemonIndex() {
  const all = getAllPokemon();
  return (
    <>
      <Band tone="yellow">
        <Breadcrumbs items={[{ name: "Pokémon", path: "/pokemon" }]} />
        <Eyebrow>{all.length} Pokémon · Megas &amp; regional forms included</Eyebrow>
        <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl">Pokémon Weakness List</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium">
          Find any Pokémon to see what it is weak to, what it resists and which Pokémon counter it.
        </p>
      </Band>
      <Wrap className="mt-8">
        <PokemonBrowser all={all.map(toSummary)} />
      </Wrap>
    </>
  );
}
