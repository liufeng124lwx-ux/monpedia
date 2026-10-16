import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { NatureTable } from "@/components/NatureTable";
import { Band, Eyebrow, H2, H3, Wrap } from "@/components/Page";
import { getNatures } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Nature Chart – All 25 Natures",
  description:
    "All 25 Pokémon natures with the stat each one raises and lowers. Filter by stat to find the right nature for Attack, Speed, Sp. Atk and more.",
  path: "/natures",
});

const ROLES = [
  { role: "Fast physical attacker", pick: "Jolly (+Speed, −Sp. Atk) to outspeed, or Adamant (+Attack, −Sp. Atk) for raw damage." },
  { role: "Fast special attacker", pick: "Timid (+Speed, −Attack), or Modest (+Sp. Atk, −Attack) for raw damage." },
  { role: "Physical wall", pick: "Impish (+Defense, −Sp. Atk) or Bold (+Defense, −Attack) for special attackers." },
  { role: "Special wall", pick: "Careful (+Sp. Def, −Sp. Atk) or Calm (+Sp. Def, −Attack) for special attackers." },
  { role: "Trick Room", pick: "Brave (+Attack), Quiet (+Sp. Atk), Relaxed (+Defense) or Sassy (+Sp. Def), all −Speed." },
  { role: "Mixed attacker", pick: "Naive or Hasty (+Speed, lowering a defense) so neither attacking stat is cut." },
];

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
      <Band tone="yellow">
        <Breadcrumbs items={[{ name: "Natures", path: "/natures" }]} />
        <Eyebrow>25 natures · ±10%</Eyebrow>
        <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl">Pokémon Nature Chart</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium">
          Every nature and the stat it raises and lowers. Use the filters to find natures for a specific stat.
        </p>
      </Band>
      <Wrap>
        <NatureTable natures={getNatures()} />
        <AdSlot id="natures-1" />
      </Wrap>
      <Wrap className="mt-6 grid gap-12 lg:grid-cols-2">
        <section className="space-y-3 leading-relaxed">
          <H2>How natures work</H2>
          <p>
            Every Pokémon has one of 25 natures. Twenty of them raise one stat by 10% and lower another by 10%. The
            other five (Bashful, Docile, Hardy, Quirky and Serious) raise and lower the same stat, so they change
            nothing. HP is never affected.
          </p>
          <p>
            The 10% applies to the final stat, so a nature matters most on a Pokémon&apos;s highest stats. Lowering a
            stat the Pokémon never uses costs nothing: physical attackers can drop Sp. Atk, special attackers can drop
            Attack.
          </p>
          <H3>How to change a Pokémon&apos;s nature</H3>
          <p>
            Since Pokémon Sword and Shield, Mints change which stats a nature boosts and lowers. The Pokémon&apos;s
            original nature still shows on its summary screen, but its stats follow the Mint. When breeding, a parent
            holding an Everstone passes its nature to the Egg.
          </p>
        </section>
        <section>
          <H2>Best natures by role</H2>
          <p className="mt-2 leading-relaxed text-muted">The usual picks for competitive and in-game teams.</p>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {ROLES.map((r) => (
              <div key={r.role} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <dt className="font-extrabold">{r.role}</dt>
                <dd className="leading-relaxed">{r.pick}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Wrap>
      <Faq items={FAQ} />
    </>
  );
}
