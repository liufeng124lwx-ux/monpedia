"use client";

import { useState } from "react";
import { STAT_KEYS, type Nature, type StatKey } from "@/lib/model";
import { filterNatures, STAT_LABELS } from "@/lib/natures";

const BATTLE_STATS = STAT_KEYS.filter((k) => k !== "hp");
/** Neutral natures sit on the grid diagonal where the in-game nature index puts them. */
const NEUTRAL_ON: Partial<Record<StatKey, string>> = { atk: "Hardy", def: "Docile", spe: "Serious", spa: "Bashful", spd: "Quirky" };

const pill = (on: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-bold transition-colors duration-(--duration-fast) ${on ? "bg-red text-white" : "bg-panel hover:bg-line"}`;

function StatPills({ label, value, onChange }: { label: string; value: StatKey | null; onChange: (v: StatKey | null) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-16 text-sm font-extrabold">{label}</span>
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={pill(value === null)}>
        Any
      </button>
      {BATTLE_STATS.map((k) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(value === k ? null : k)} className={pill(value === k)}>
          {STAT_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

export function NatureTable({ natures }: { natures: Nature[] }) {
  const [up, setUp] = useState<StatKey | null>(null);
  const [down, setDown] = useState<StatKey | null>(null);
  const rows = filterNatures(natures, up, down);
  const at = (u: StatKey, d: StatKey) =>
    u === d ? natures.find((n) => n.name === NEUTRAL_ON[u]) : natures.find((n) => n.up === u && n.down === d);

  return (
    <div className="my-8 space-y-10">
      <section aria-labelledby="nature-grid">
        <h2 id="nature-grid" className="mb-4 text-2xl font-extrabold sm:text-3xl">Nature chart: raised vs lowered stat</h2>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="w-28 p-1 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  Raises ↓ / Lowers →
                </th>
                {BATTLE_STATS.map((d) => (
                  <th key={d} scope="col" className={`rounded-md p-2 font-extrabold ${down === d ? "text-white" : "bg-panel"}`} style={down === d ? { backgroundColor: "var(--x2)" } : undefined}>
                    −{STAT_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BATTLE_STATS.map((u) => (
                <tr key={u}>
                  <th scope="row" className="rounded-md p-2 text-left font-extrabold" style={{ backgroundColor: up === u ? "var(--xhalf)" : "var(--panel)", color: up === u ? "white" : undefined }}>
                    +{STAT_LABELS[u]}
                  </th>
                  {BATTLE_STATS.map((d) => {
                    const n = at(u, d);
                    const isNeutral = u === d;
                    const selected = up === u && down === d;
                    const inLine = (up === u && !down) || (down === d && !up) || selected;
                    return (
                      <td key={d} className="p-0">
                        <button
                          type="button"
                          aria-pressed={selected}
                          disabled={!n}
                          onClick={() => {
                            if (isNeutral || selected) { setUp(null); setDown(null); }
                            else { setUp(u); setDown(d); }
                          }}
                          className={`h-12 w-full rounded-md font-extrabold transition-[transform,background-color] duration-(--duration-fast) hover:-translate-y-0.5 ${
                            selected ? "bg-ink text-paper" : isNeutral ? "bg-transparent text-muted ring-1 ring-line ring-inset" : inLine ? "bg-yellow text-stage-ink" : "bg-panel hover:bg-line"
                          }`}
                        >
                          {n?.name ?? "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">Tap a nature to filter the list. Natures on the diagonal are neutral.</p>
      </section>

      <section aria-labelledby="nature-list">
        <h2 id="nature-list" className="mb-4 text-2xl font-extrabold sm:text-3xl">All 25 Pokémon natures</h2>
        <div className="space-y-2">
          <StatPills label="Raises" value={up} onChange={setUp} />
          <StatPills label="Lowers" value={down} onChange={setDown} />
        </div>
        <table className="mt-5 w-full text-left">
          <thead>
            <tr className="text-sm text-muted">
              <th className="py-2 font-bold">Nature</th>
              <th className="py-2 font-bold">Increases (+10%)</th>
              <th className="py-2 font-bold">Decreases (−10%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.name} className="border-t border-line">
                <td className="py-2.5 text-lg font-extrabold">{n.name}</td>
                <td className="py-2.5 font-bold" style={{ color: n.up ? "var(--xhalf)" : undefined }}>{n.up ? `▲ ${STAT_LABELS[n.up]}` : "—"}</td>
                <td className="py-2.5 font-bold" style={{ color: n.down ? "var(--x2)" : undefined }}>{n.down ? `▼ ${STAT_LABELS[n.down]}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
