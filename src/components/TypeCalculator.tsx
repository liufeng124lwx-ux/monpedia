"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
import { MatchupRows } from "./Matchups";

const MODES: { mode: CalcMode; label: string }[] = [
  { mode: "defense", label: "Defending" },
  { mode: "attack", label: "Attacking" },
];

function summary(state: CalcState, groups: ReturnType<typeof groupByMultiplier>): string {
  const name = state.types.map(typeLabel).join(" / ");
  const count = (pred: (m: number) => boolean) =>
    groups.filter((g) => pred(g.multiplier)).reduce((n, g) => n + g.types.length, 0);
  if (state.mode === "defense") {
    const weak = count((m) => m > 1);
    return `${name} is weak to ${weak} type${weak === 1 ? "" : "s"}`;
  }
  const strong = count((m) => m > 1);
  return `${name} moves hit ${strong} type${strong === 1 ? "" : "s"} super effectively`;
}

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
  const stateKey = `${state.mode}:${state.types.join(",")}`;

  return (
    <section
      aria-label="Type calculator"
      className="grid gap-6 rounded-[10px] bg-paper p-4 text-ink sm:p-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10"
    >
      <div>
        <div role="tablist" className="mb-4 inline-flex rounded-full bg-panel p-1">
          {MODES.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={state.mode === mode}
              onClick={() => update(setMode(state, mode))}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors duration-(--duration-fast) ${state.mode === mode ? "bg-red text-white" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm font-semibold text-muted">
          {state.mode === "defense" ? "Pick up to two defending types." : "Pick the attacking move's type."}
        </p>
        <div className="grid grid-cols-4 gap-x-1.5 gap-y-2.5 sm:grid-cols-6 sm:gap-x-2 sm:gap-y-3">
          {TYPE_NAMES.map((t) => {
            const pressed = state.types.includes(t);
            const { bg, fg } = TYPE_COLORS[t];
            return (
              <button
                key={t}
                type="button"
                aria-pressed={pressed}
                onClick={() => update(toggleType(state, t))}
                className="key px-1 py-2 text-xs font-extrabold sm:py-2.5 sm:text-sm"
                style={{ "--key-bg": bg, "--key-fg": fg } as CSSProperties}
              >
                {typeLabel(t)}
              </button>
            );
          })}
        </div>
      </div>
      {/* The live region stays mounted; only its children are re-keyed to replay the pop-in. */}
      <div className="lg:border-l lg:border-line lg:pl-10" aria-live="polite">
        <p key={stateKey} className="pop mb-5 text-2xl font-extrabold leading-tight sm:text-3xl">
          {summary(state, groups)}
        </p>
        <div data-testid="calc-results" key={`r-${stateKey}`}>
          <MatchupRows groups={groups} label={(m) => groupLabel(state.mode, m)} animate />
        </div>
      </div>
    </section>
  );
}
