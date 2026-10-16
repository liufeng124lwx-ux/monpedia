import type { CSSProperties } from "react";
import type { MatchupGroup } from "@/lib/typechart";
import { formatMultiplier } from "@/lib/typechart";
import { TypeBadge } from "./TypeBadge";

/** Damage-scale colors: data-only, never reused for UI chrome. */
export function multiplierColor(m: number): string {
  if (m >= 4) return "var(--x4)";
  if (m >= 2) return "var(--x2)";
  if (m === 0) return "var(--x0)";
  if (m <= 0.25) return "var(--xquarter)";
  if (m < 1) return "var(--xhalf)";
  return "var(--line)";
}

export function MultiplierChip({ m, className = "" }: { m: number; className?: string }) {
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center rounded-md px-2 py-1 text-base font-extrabold tabular-nums text-white ${className}`}
      style={{ backgroundColor: multiplierColor(m) }}
    >
      {formatMultiplier(m)}
    </span>
  );
}

/** One row per multiplier; `label` describes the row. Badges pop in on mount, so re-key to replay. */
export function MatchupRows({
  groups,
  label,
  animate = false,
}: {
  groups: MatchupGroup[];
  label: (m: number) => string;
  animate?: boolean;
}) {
  let i = 0;
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.multiplier} data-multiplier={g.multiplier} className="grid grid-cols-[3.5rem_1fr] items-start gap-3">
          <MultiplierChip m={g.multiplier} />
          <div>
            <h3 className="mb-1.5 text-sm font-semibold text-muted">{label(g.multiplier)}</h3>
            <div className="flex flex-wrap gap-1.5">
              {g.types.map((t) => (
                <TypeBadge
                  key={t}
                  type={t}
                  size="md"
                  className={animate ? "pop" : ""}
                  style={animate ? ({ "--i": i++ } as CSSProperties) : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
