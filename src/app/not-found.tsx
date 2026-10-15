import Link from "next/link";
import { getPokemon } from "@/lib/data";
import type { Pokemon } from "@/lib/model";

const POPULAR = ["charizard", "pikachu", "gengar", "garchomp", "lucario", "eevee"];

export default function NotFound() {
  const popular = POPULAR.map(getPokemon).filter((p): p is Pokemon => p !== undefined);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p>
        That page does not exist. <Link href="/pokemon" className="underline">Search all Pokémon</Link> or try one of these:
      </p>
      <ul className="flex flex-wrap gap-3">
        {popular.map((p) => (
          <li key={p.slug}>
            <Link href={`/pokemon/${p.slug}`} className="underline">{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
