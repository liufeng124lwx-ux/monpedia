import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Monpedia",
  description: "Monpedia is an unofficial fan-made toolkit for Pokémon type matchups, weaknesses, counters and natures.",
  path: "/about",
});

export default function About() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 leading-relaxed">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="text-4xl font-extrabold">About Monpedia</h1>
      <p>
        Monpedia is a free, fan-made set of tools for Pokémon players: a type chart and weakness calculator,
        a nature chart, and a weakness and counters page for every Pokémon.
      </p>
      <p>
        Type matchups follow the current rules used since Generation 6, including the Fairy type. Pokémon data
        comes from the open-source PokeAPI project. We only publish officially confirmed information and never
        publish leaks.
      </p>
      <p>
        Monpedia is an unofficial fan site and is not affiliated with, endorsed by or sponsored by Nintendo,
        Game Freak, Creatures Inc. or The Pokémon Company. Pokémon and all related names are their trademarks.
      </p>
      <p>Contact: contact@monpedia.net</p>
    </article>
  );
}
