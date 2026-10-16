import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description: "Terms of use for Monpedia, an unofficial Pokémon fan site.",
  path: "/terms",
});

export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 leading-relaxed">
      <Breadcrumbs items={[{ name: "Terms", path: "/terms" }]} />
      <h1 className="text-4xl font-extrabold">Terms of Use</h1>
      <p>Last updated: October 15, 2026.</p>
      <p>
        Monpedia is provided free of charge and as is. We try to keep the data accurate but make no guarantee
        that it is complete or error-free.
      </p>
      <p>
        Pokémon and all related names, characters and images are trademarks and copyrights of Nintendo,
        Game Freak, Creatures Inc. and The Pokémon Company. Monpedia is an unofficial fan site and claims no
        ownership of them.
      </p>
      <p>You may link to any page on Monpedia. Do not copy the site in bulk.</p>
      <p>Contact: contact@monpedia.net</p>
    </article>
  );
}
