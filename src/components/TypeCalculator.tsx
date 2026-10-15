"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_STATE,
  groupLabel,
  parseCalcState,
  serializeCalcState,
  setMode,
  toggleType,
  type CalcMode,
  type CalcState,
} from "@/lib/calculator";
import { TYPE_NAMES } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { defenseProfile, groupByMultiplier, offenseProfile, typeLabel } from "@/lib/typechart";
import { TypeBadge } from "./TypeBadge";

const MODES: { mode: CalcMode; label: string }[] = [
  { mode: "defense", label: "Defending" },
  { mode: "attack", label: "Attacking" },
];

export function TypeCalculator() {
  const [state, setState] = useState<CalcState>(DEFAULT_STATE);

  useEffect(() => {
    // Must read the URL after mount; reading it during render would mismatch the static HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(parseCalcState(window.location.search));
  }, []);

  const update = (next: CalcState) => {
    setState(next);
    window.history.replaceState(null, "", `${window.location.pathname}${serializeCalcState(next)}`);
  };

  const profile = state.mode === "defense" ? defenseProfile(state.types) : offenseProfile(state.types[0]);
  const groups = groupByMultiplier(profile);

  return (
    <section aria-label="Type calculator" className="my-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div role="tablist" className="mb-3 inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={state.mode === mode}
            onClick={() => update(setMode(state, mode))}
            className={`rounded-md px-3 py-1 text-sm font-medium ${state.mode === mode ? "bg-white shadow dark:bg-zinc-700" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
        {state.mode === "defense" ? "Pick up to two defending types." : "Pick the attacking move's type."}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TYPE_NAMES.map((t) => {
          const pressed = state.types.includes(t);
          const { bg, fg } = TYPE_COLORS[t];
          return (
            <button
              key={t}
              type="button"
              aria-pressed={pressed}
              onClick={() => update(toggleType(state, t))}
              className={`rounded-md px-2 py-2 text-sm font-semibold transition ${pressed ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950" : "opacity-60 hover:opacity-100"}`}
              style={{ backgroundColor: bg, color: fg }}
            >
              {typeLabel(t)}
            </button>
          );
        })}
      </div>
      <div data-testid="calc-results" className="mt-5 space-y-3" aria-live="polite">
        {groups.map((g) => (
          <div key={g.multiplier} data-multiplier={g.multiplier}>
            <h3 className="mb-1 text-sm font-semibold">{groupLabel(state.mode, g.multiplier)}</h3>
            <div className="flex flex-wrap gap-1">
              {g.types.map((t) => <TypeBadge key={t} type={t} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
