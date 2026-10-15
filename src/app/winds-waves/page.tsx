import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Sprite } from "@/components/Sprite";
import { TypeBadge } from "@/components/TypeBadge";
import { defensiveMatchups } from "@/lib/matchups";
import { pageMetadata } from "@/lib/seo";
import { joinList } from "@/lib/text";
import { typeLabel } from "@/lib/typechart";
import { getWindsWaves } from "@/lib/winds-waves";

const ww = getWindsWaves();
const starterNames = joinList(ww.starters.map((s) => s.name));

export const metadata = pageMetadata({
  title: "Pokémon Winds and Waves Starters, Release Date & Confirmed Info",
  description: `The Pokémon Winds and Waves starters are ${starterNames}. See their types and weaknesses, the release window and every officially confirmed detail with sources.`,
  path: "/winds-waves",
});

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function WindsWavesPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Winds & Waves", path: "/winds-waves" }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Winds and Waves: Starters &amp; Confirmed Info</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated {formatDate(ww.updated)}. Official information only — no leaks.</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">The three starters</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {ww.starters.map((s) => {
            const weak = defensiveMatchups({ types: [s.type] }).filter((g) => g.multiplier > 1).flatMap((g) => g.types);
            return (
              <li key={s.name} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Sprite src={null} name={s.name} type={s.type} size={56} />
                  <div>
                    <p className="text-lg font-semibold">{s.name}</p>
                    <TypeBadge type={s.type} />
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  Weak to: <span className="inline-flex flex-wrap gap-1 align-middle">{weak.map((t) => <TypeBadge key={t} type={t} />)}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <AdSlot id="ww-1" />

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Confirmed so far</h2>
        <p className="mt-1 text-sm">Release: {ww.release}</p>
        <ul className="mt-3 space-y-3">
          {ww.facts.map((f) => (
            <li key={f.text}>
              <p>{f.text}</p>
              <p className="text-xs text-zinc-500">
                Source: <a href={f.source} rel="noopener" className="underline">{new URL(f.source).hostname}</a> (checked {formatDate(f.date)})
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Faq
        items={[
          {
            q: "Who are the Pokémon Winds and Waves starters?",
            a: `The starters are ${joinList(ww.starters.map((s) => `${s.name} (${typeLabel(s.type)})`))}.`,
          },
          { q: "When does Pokémon Winds and Waves come out?", a: `The official release window is ${ww.release}.` },
        ]}
      />
    </>
  );
}
