"use client";

import { useState } from "react";
import { STAT_KEYS, type Nature, type StatKey } from "@/lib/model";
import { filterNatures, STAT_LABELS } from "@/lib/natures";

const BATTLE_STATS = STAT_KEYS.filter((k) => k !== "hp");

function StatSelect({ label, value, onChange }: { label: string; value: StatKey | null; onChange: (v: StatKey | null) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || null) as StatKey | null)}
        className="rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
      >
        <option value="">Any</option>
        {BATTLE_STATS.map((k) => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
      </select>
    </label>
  );
}

export function NatureTable({ natures }: { natures: Nature[] }) {
  const [up, setUp] = useState<StatKey | null>(null);
  const [down, setDown] = useState<StatKey | null>(null);
  const rows = filterNatures(natures, up, down);
  return (
    <div className="my-6">
      <div className="mb-3 flex flex-wrap gap-4">
        <StatSelect label="Raises" value={up} onChange={setUp} />
        <StatSelect label="Lowers" value={down} onChange={setDown} />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Nature</th>
            <th className="py-2">Increases (+10%)</th>
            <th className="py-2">Decreases (−10%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.name} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-2 font-medium">{n.name}</td>
              <td className="py-2 text-green-700 dark:text-green-400">{n.up ? STAT_LABELS[n.up] : "—"}</td>
              <td className="py-2 text-red-700 dark:text-red-400">{n.down ? STAT_LABELS[n.down] : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
