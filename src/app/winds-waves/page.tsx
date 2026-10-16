import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Eyebrow, H2, Wrap } from "@/components/Page";
import { Sprite } from "@/components/Sprite";
import { TypeBadge } from "@/components/TypeBadge";
import { defensiveMatchups } from "@/lib/matchups";
import { pageMetadata } from "@/lib/seo";
import { joinList } from "@/lib/text";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";
import { getWindsWaves } from "@/lib/winds-waves";

const ww = getWindsWaves();
const starterNames = joinList(ww.starters.map((s) => s.name));
const OFFICIAL = "https://windswaves.pokemon.com/en-us/";

export const metadata = pageMetadata({
  title: "Pokémon Winds and Waves Starters, Release Date & Confirmed Info",
  description: `The Pokémon Winds and Waves starters are ${starterNames}. See their types and weaknesses, the release window and every officially confirmed detail with sources.`,
  path: "/winds-waves",
});

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** Wave edge like the official site's banner trim, drawn with gradients (decorative only). */
function WaveEdge({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="h-4 w-full"
      style={{ background: `radial-gradient(circle at 12px 0, ${color} 11px, transparent 12px) 0 0 / 24px 16px repeat-x` }}
    />
  );
}

export default function WindsWavesPage() {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#bfe9ff_0%,#7fd8f0_55%,#33b6c9_100%)] text-stage-ink">
        <Wrap className="py-10 sm:py-14">
          <Breadcrumbs items={[{ name: "Winds & Waves", path: "/winds-waves" }]} />
          <Eyebrow>Nintendo Switch 2 · {ww.release}</Eyebrow>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-[0.95] sm:text-6xl">
            Pokémon Winds and Waves: Starters &amp; Confirmed Info
          </h1>
          <p className="mt-4 text-sm font-bold">Last updated {formatDate(ww.updated)}. Official information only — no leaks.</p>
          <a href={OFFICIAL} rel="noopener" className="key mt-6 inline-block px-5 py-3 font-extrabold">
            Official site ↗
          </a>
        </Wrap>
      </section>
      <WaveEdge color="#33b6c9" />

      <Wrap className="mt-12">
        <section>
          <H2>The three starters</H2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {ww.starters.map((s) => {
              const weak = defensiveMatchups({ types: [s.type] }).filter((g) => g.multiplier > 1).flatMap((g) => g.types);
              return (
                <li key={s.name} className="overflow-hidden rounded-[10px] ring-1 ring-line">
                  <div className="relative flex justify-center py-6" style={{ backgroundColor: TYPE_COLORS[s.type].bg }}>
                    <span aria-hidden="true" className="absolute -right-6 -top-6 size-28 rounded-full border-[10px] border-white/20" />
                    <Sprite src={null} name={s.name} type={s.type} size={112} className="ring-4 ring-white/40" />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-extrabold">{s.name}</p>
                      <TypeBadge type={s.type} size="md" />
                    </div>
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                      <span className="mr-1 text-muted">Weak to</span>
                      {weak.map((t) => <TypeBadge key={t} type={t} />)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-muted">
            Artwork for the new starters is on the <a href={OFFICIAL} rel="noopener" className="font-semibold underline">official site</a>.
          </p>
        </section>
      </Wrap>

      <Wrap>
        <AdSlot id="ww-1" />
      </Wrap>

      <Wrap className="mt-14">
        <section>
          <H2>Confirmed so far</H2>
          <p className="mt-1 font-semibold text-muted">Release: {ww.release}</p>
          <ol className="mt-5 max-w-3xl space-y-3">
            {ww.facts.map((f, i) => (
              <li key={f.text} className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-[10px] bg-panel p-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-yellow font-extrabold text-stage-ink">{i + 1}</span>
                <div>
                  <p className="text-lg leading-snug">{f.text}</p>
                  <p className="mt-1 text-xs text-muted">
                    Source: <a href={f.source} rel="noopener" className="underline">{new URL(f.source).hostname}</a> (checked {formatDate(f.date)})
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Wrap>

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
