import { STAT_KEYS, type Stats } from "@/lib/model";
import { STAT_LABELS } from "@/lib/natures";

export function StatBars({ stats }: { stats: Stats }) {
  const total = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
  return (
    <dl className="mt-2 space-y-1 text-sm">
      {STAT_KEYS.map((k) => (
        <div key={k} className="grid grid-cols-[5rem_3rem_1fr] items-center gap-2">
          <dt>{STAT_LABELS[k]}</dt>
          <dd className="text-right tabular-nums">{stats[k]}</dd>
          <dd aria-hidden="true" className="h-2 rounded bg-zinc-200 dark:bg-zinc-800">
            <div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.min(100, (stats[k] / 255) * 100)}%` }} />
          </dd>
        </div>
      ))}
      <div className="grid grid-cols-[5rem_3rem_1fr] gap-2 font-semibold">
        <dt>Total</dt>
        <dd className="text-right tabular-nums">{total}</dd>
      </div>
    </dl>
  );
}
