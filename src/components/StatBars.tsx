import type { CSSProperties } from "react";
import { STAT_KEYS, type Stats } from "@/lib/model";
import { STAT_LABELS } from "@/lib/natures";

/** Data color by base-stat value, low (red) to high (green). */
function statColor(v: number): string {
  if (v < 50) return "#e5534b";
  if (v < 80) return "#f08a24";
  if (v < 100) return "#f2c200";
  if (v < 120) return "#8cc63f";
  return "#2f9e66";
}

export function StatBars({ stats }: { stats: Stats }) {
  const total = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
  return (
    <dl className="mt-4 space-y-2.5">
      {STAT_KEYS.map((k, i) => (
        <div key={k} className="grid grid-cols-[5.5rem_2.75rem_1fr] items-center gap-3">
          <dt className="text-sm font-semibold text-muted">{STAT_LABELS[k]}</dt>
          <dd className="text-right text-lg font-extrabold tabular-nums">{stats[k]}</dd>
          <dd aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-panel">
            <div
              className="grow-in h-full rounded-full"
              style={{ width: `${Math.min(100, (stats[k] / 200) * 100)}%`, backgroundColor: statColor(stats[k]), "--i": i } as CSSProperties}
            />
          </dd>
        </div>
      ))}
      <div className="grid grid-cols-[5.5rem_2.75rem_1fr] items-center gap-3 border-t border-line pt-2.5">
        <dt className="text-sm font-extrabold">Total</dt>
        <dd className="text-right text-lg font-extrabold tabular-nums">{total}</dd>
      </div>
    </dl>
  );
}
