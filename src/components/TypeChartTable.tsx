"use client";

import { useState } from "react";
import { TYPE_NAMES, type TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { effectiveness, formatMultiplier, typeLabel } from "@/lib/typechart";

function cellClass(m: number): string {
  if (m === 2) return "bg-green-600 text-white";
  if (m === 0.5) return "bg-red-600/80 text-white";
  if (m === 0) return "bg-zinc-800 text-white";
  return "";
}

export function TypeChartTable() {
  const [row, setRow] = useState<TypeName | null>(null);
  const [col, setCol] = useState<TypeName | null>(null);
  const header = (t: TypeName, onClick: () => void, short: boolean) => {
    const { bg, fg } = TYPE_COLORS[t];
    return (
      <button type="button" onClick={onClick} className="w-full rounded px-1 py-0.5 font-semibold" style={{ backgroundColor: bg, color: fg }}>
        {short ? typeLabel(t).slice(0, 3) : typeLabel(t)}
      </button>
    );
  };
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 bg-white p-1 text-left dark:bg-zinc-950">Atk ↓ Def →</th>
            {TYPE_NAMES.map((d) => (
              <th key={d} scope="col" className="p-0.5">{header(d, () => setCol(col === d ? null : d), true)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPE_NAMES.map((a) => (
            <tr key={a}>
              <th scope="row" className="sticky left-0 bg-white p-0.5 dark:bg-zinc-950">{header(a, () => setRow(row === a ? null : a), false)}</th>
              {TYPE_NAMES.map((d) => {
                const m = effectiveness(a, [d]);
                const focus = row === a || col === d;
                return (
                  <td
                    key={d}
                    title={`${typeLabel(a)} → ${typeLabel(d)}: ${formatMultiplier(m)}`}
                    className={`h-7 w-8 border border-zinc-200 text-center dark:border-zinc-800 ${cellClass(m)} ${focus ? "outline outline-2 -outline-offset-2 outline-zinc-900 dark:outline-white" : ""}`}
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
  );
}
