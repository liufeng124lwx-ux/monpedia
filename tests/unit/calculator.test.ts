import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  groupLabel,
  parseCalcState,
  serializeCalcState,
  setMode,
  toggleType,
} from "@/lib/calculator";

describe("parseCalcState", () => {
  it("defaults when empty", () => {
    expect(parseCalcState("")).toEqual(DEFAULT_STATE);
    expect(DEFAULT_STATE).toEqual({ mode: "defense", types: ["fire"] });
  });

  it("is case-insensitive and keeps at most two defending types", () => {
    expect(parseCalcState("?t=FIRE,flying")).toEqual({ mode: "defense", types: ["fire", "flying"] });
    expect(parseCalcState("?t=fire,fire,water,grass")).toEqual({ mode: "defense", types: ["fire", "water"] });
  });

  it("drops unknown types and falls back to the default when nothing is left", () => {
    expect(parseCalcState("?t=banana,water").types).toEqual(["water"]);
    expect(parseCalcState("?t=banana")).toEqual(DEFAULT_STATE);
    expect(parseCalcState("?t=")).toEqual(DEFAULT_STATE);
  });

  it("keeps one type in attack mode", () => {
    expect(parseCalcState("?m=attack&t=fire,water")).toEqual({ mode: "attack", types: ["fire"] });
    expect(parseCalcState("?m=attack")).toEqual({ mode: "attack", types: ["fire"] });
    expect(parseCalcState("?m=nonsense&t=ice").mode).toBe("defense");
  });
});

describe("serializeCalcState", () => {
  it("omits the default state and round-trips others", () => {
    expect(serializeCalcState(DEFAULT_STATE)).toBe("");
    expect(serializeCalcState({ mode: "defense", types: ["fire", "flying"] })).toBe("?t=fire,flying");
    const s = { mode: "attack" as const, types: ["ground" as const] };
    expect(serializeCalcState(s)).toBe("?m=attack&t=ground");
    expect(parseCalcState(serializeCalcState(s))).toEqual(s);
  });
});

describe("toggleType / setMode", () => {
  it("adds up to two types, replacing the oldest", () => {
    let s = toggleType(DEFAULT_STATE, "flying");
    expect(s.types).toEqual(["fire", "flying"]);
    s = toggleType(s, "water");
    expect(s.types).toEqual(["flying", "water"]);
  });

  it("removes a selected type but never empties the selection", () => {
    expect(toggleType({ mode: "defense", types: ["fire", "flying"] }, "fire").types).toEqual(["flying"]);
    expect(toggleType({ mode: "defense", types: ["fire"] }, "fire").types).toEqual(["fire"]);
  });

  it("attack mode replaces the single type", () => {
    expect(toggleType({ mode: "attack", types: ["fire"] }, "ice").types).toEqual(["ice"]);
    expect(setMode({ mode: "defense", types: ["fire", "flying"] }, "attack")).toEqual({ mode: "attack", types: ["fire"] });
  });
});

describe("groupLabel", () => {
  it("labels defense and attack groups", () => {
    expect(groupLabel("defense", 4)).toBe("Weak to (4×)");
    expect(groupLabel("defense", 0.5)).toBe("Resists (½×)");
    expect(groupLabel("defense", 0)).toBe("Immune to (0×)");
    expect(groupLabel("attack", 2)).toBe("Super effective against (2×)");
    expect(groupLabel("attack", 0.5)).toBe("Not very effective against (½×)");
    expect(groupLabel("attack", 0)).toBe("No effect on (0×)");
  });
});
