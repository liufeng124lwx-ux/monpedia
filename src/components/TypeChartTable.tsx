"use client";

import { useState } from "react";
import { TYPE_NAMES, type TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { effectiveness, formatMultiplier, typeLabel } from "@/lib/typechart";
import { multiplierColor } from "./Matchups";

type Cell = { a: TypeName; d: TypeName } | null;

export function TypeChartTable() {
  const [row, setRow] = useState<TypeName | null>(null);
  const [col, setCol] = useState<TypeName | null>(null);
  const [hover, setHover] = useState<Cell>(null);

  // Hover draws a crosshair; tapping a header pins a row or column (useful on touch screens).
  const hotRow = hover?.a ?? row;
  const hotCol = hover?.d ?? col;
  const readout = hover ?? (row && col ? { a: row, d: col } : null);

  const header = (t: TypeName, onClick: () => void, short: boolean, hot: boolean, pinned: boolean) => {
    const { bg, fg } = TYPE_COLORS[t];
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pinned}
        title={typeLabel(t)}
        className={`w-full rounded px-1 py-1 font-extrabold uppercase tracking-wide transition-transform duration-(--duration-fast) ${hot ? "scale-110" : ""}`}
        style={{ backgroundColor: bg, color: fg }}
      >
        {short ? typeLabel(t).slice(0, 3) : typeLabel(t)}
      </button>
    );
  };

  return (
    <div>
      <p className="mb-3 h-7 text-lg font-extrabold" aria-hidden="true">
        {readout ? (
          <>
            {typeLabel(readout.a)} <span className="opacity-60">→</span> {typeLabel(readout.d)}:{" "}
            <span style={{ color: effectiveness(readout.a, [readout.d]) === 1 ? undefined : "var(--yellow)" }}>
              {formatMultiplier(effectiveness(readout.a, [readout.d]))}
            </span>
          </>
        ) : (
          <span className="opacity-60">Hover or tap a cell</span>
        )}
      </p>
      <div className="-mx-4 overflow-x-auto px-4 pb-2" onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
        <table className="w-full max-w-5xl border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-stage-ink p-1 text-left text-[10px] font-bold uppercase tracking-wider text-white/60">
                Atk ↓ Def →
              </th>
              {TYPE_NAMES.map((d) => (
                <th key={d} scope="col" className="min-w-9">
                  {header(d, () => setCol(col === d ? null : d), true, hotCol === d, col === d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPE_NAMES.map((a) => (
              <tr key={a}>
                <th scope="row" className="sticky left-0 z-10 min-w-20 bg-stage-ink pr-1">
                  {header(a, () => setRow(row === a ? null : a), false, hotRow === a, row === a)}
                </th>
                {TYPE_NAMES.map((d) => {
                  const m = effectiveness(a, [d]);
                  const inLine = hotRow === a || hotCol === d;
                  const isHit = hotRow === a && hotCol === d;
                  const dim = (hotRow || hotCol) && !inLine;
                  return (
                    <td
                      key={d}
                      title={`${typeLabel(a)} → ${typeLabel(d)}: ${formatMultiplier(m)}`}
                      onPointerEnter={() => setHover({ a, d })}
                      className={`h-8 rounded text-center text-sm font-extrabold transition-opacity duration-(--duration-fast) ${isHit ? "outline-2 -outline-offset-2 outline-yellow" : ""}`}
                      style={{
                        backgroundColor: m === 1 ? (inLine ? "rgb(255 255 255 / 0.14)" : "rgb(255 255 255 / 0.05)") : multiplierColor(m),
                        color: m === 0 ? "var(--yellow)" : "white",
                        opacity: dim ? 0.35 : 1,
                      }}
                    >
                      {m === 1 ? "" : formatMultiplier(m).replace("×", "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-white/70" aria-label="Legend">
        {[2, 0.5, 0].map((m) => (
          <li key={m} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm ring-1 ring-white/40" style={{ backgroundColor: multiplierColor(m) }} />
            {m === 2 ? "Super effective (2×)" : m === 0 ? "No effect (0×)" : "Not very effective (½×)"}
          </li>
        ))}
      </ul>
    </div>
  );
}
