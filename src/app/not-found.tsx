import Link from "next/link";
import { Band } from "@/components/Page";
import { PokemonCard } from "@/components/PokemonCard";
import { getPokemon, toSummary } from "@/lib/data";
import type { Pokemon } from "@/lib/model";

const POPULAR = ["charizard", "pikachu", "gengar", "garchomp", "lucario", "eevee"];

export default function NotFound() {
  const popular = POPULAR.map(getPokemon).filter((p): p is Pokemon => p !== undefined);
  return (
    <>
      <Band tone="yellow">
        <p className="text-7xl font-extrabold tracking-tighter sm:text-9xl">404</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-lg font-medium">
          That page does not exist.{" "}
          <Link href="/pokemon" className="font-extrabold underline decoration-2 underline-offset-4">Search all Pokémon</Link> or try one of these:
        </p>
      </Band>
      <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-6">
        {popular.map((p) => (
          <li key={p.slug}>
            <PokemonCard p={toSummary(p)} size={96} />
          </li>
        ))}
      </ul>
    </>
  );
}
