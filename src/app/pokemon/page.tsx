import { Breadcrumbs } from "@/components/Breadcrumbs";
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
  return (
    <>
      <Breadcrumbs items={[{ name: "Pokémon", path: "/pokemon" }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Weakness List</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Find any Pokémon to see what it is weak to, what it resists and which Pokémon counter it.
      </p>
      <PokemonBrowser all={getAllPokemon().map(toSummary)} />
    </>
  );
}
