import { describe, expect, it } from "vitest";
import {
  countSuperEffective,
  countWeaknesses,
  defenseProfile,
  effectiveness,
  formatMultiplier,
  groupByMultiplier,
  offenseProfile,
  typeLabel,
} from "@/lib/typechart";

describe("effectiveness", () => {
  it("multiplies across dual types (Charizard: Fire/Flying)", () => {
    const p = defenseProfile(["fire", "flying"]);
    expect(p.rock).toBe(4);
    expect(p.water).toBe(2);
    expect(p.electric).toBe(2);
    expect(p.ground).toBe(0);
    expect(p.grass).toBe(0.25);
    expect(p.bug).toBe(0.25);
    expect(p.fairy).toBe(0.5);
  });

  it("gives Ice/Flying a 4× Rock weakness", () => {
    expect(effectiveness("rock", ["ice", "flying"])).toBe(4);
  });

  it("uses the Gen 6+ chart (Fairy exists, Steel no longer resists Ghost)", () => {
    expect(effectiveness("dragon", ["fairy"])).toBe(0);
    expect(effectiveness("ghost", ["steel"])).toBe(1);
  });
});

describe("offenseProfile", () => {
  it("lists what Fire hits", () => {
    const p = offenseProfile("fire");
    expect(["grass", "ice", "bug", "steel"].every((t) => p[t as keyof typeof p] === 2)).toBe(true);
    expect(p.water).toBe(0.5);
  });
});

describe("groupByMultiplier", () => {
  it("sorts groups high to low and skips neutral by default", () => {
    const groups = groupByMultiplier(defenseProfile(["fire", "flying"]));
    expect(groups[0]).toEqual({ multiplier: 4, types: ["rock"] });
    expect(groups.at(-1)).toEqual({ multiplier: 0, types: ["ground"] });
    expect(groups.some((g) => g.multiplier === 1)).toBe(false);
  });
});

describe("formatMultiplier", () => {
  it("formats standard and ability-modified values exactly", () => {
    expect(formatMultiplier(0)).toBe("0×");
    expect(formatMultiplier(0.5)).toBe("½×");
    expect(formatMultiplier(0.25)).toBe("¼×");
    expect(formatMultiplier(0.125)).toBe("⅛×");
    expect(formatMultiplier(4)).toBe("4×");
    expect(formatMultiplier(1.25)).toBe("1.25×");
    expect(formatMultiplier(2.5)).toBe("2.5×");
    expect(formatMultiplier(0.625)).toBe("0.625×");
  });
});

describe("type stats", () => {
  it("counts single-type weaknesses and super-effective targets", () => {
    expect(countWeaknesses("grass")).toBe(5);
    expect(countSuperEffective("fire")).toBe(4);
    expect(typeLabel("psychic")).toBe("Psychic");
  });
});
