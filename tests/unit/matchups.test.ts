import { describe, expect, it } from "vitest";
import modifiersJson from "../../data/abilities.json";
import { abilityChanges, applyAbility, defensiveMatchups } from "@/lib/matchups";
import type { AbilityModifier } from "@/lib/model";
import { defenseProfile } from "@/lib/typechart";

const modifiers = modifiersJson as unknown as AbilityModifier[];
const get = (slug: string) => modifiers.find((m) => m.slug === slug)!;

describe("Bronzong (Steel/Psychic)", () => {
  const types = ["steel", "psychic"] as const;

  it("takes 2× from Ground and Fire by default", () => {
    const p = defenseProfile(types);
    expect(p.ground).toBe(2);
    expect(p.fire).toBe(2);
  });

  it("Levitate makes Ground 0×", () => {
    expect(applyAbility(defenseProfile(types), get("levitate")).ground).toBe(0);
  });

  it("Heatproof makes Fire 1×", () => {
    expect(applyAbility(defenseProfile(types), get("heatproof")).fire).toBe(1);
  });

  it("reports both ability changes", () => {
    const changes = abilityChanges({ types: [...types], abilities: ["levitate", "heatproof", "heavy-metal"] }, modifiers);
    expect(changes.map((c) => [c.ability.slug, c.changes])).toEqual([
      ["levitate", [{ type: "ground", from: 2, to: 0 }]],
      ["heatproof", [{ type: "fire", from: 2, to: 1 }]],
    ]);
  });
});

describe("Shedinja (Bug/Ghost, Wonder Guard)", () => {
  it("can only be hit by super-effective types", () => {
    const groups = defensiveMatchups({ types: ["bug", "ghost"] }, get("wonder-guard"));
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ multiplier: 2, types: ["flying", "rock", "ghost", "fire", "dark"] });
    expect(groups[1].multiplier).toBe(0);
    expect(groups[1].types).toHaveLength(13);
  });
});

describe("non-standard multipliers", () => {
  it("Dry Skin: Water 0×, Fire ×1.25 on top of the type multiplier", () => {
    const p = applyAbility(defenseProfile(["poison", "fighting"]), get("dry-skin"));
    expect(p.water).toBe(0);
    expect(p.fire).toBe(1.25);
  });

  it("Thick Fat on a ¼× Fire resistance gives ⅛×", () => {
    expect(applyAbility(defenseProfile(["water", "dragon"]), get("thick-fat")).fire).toBe(0.125);
  });

  it("ignores abilities that do not touch type matchups", () => {
    expect(abilityChanges({ types: ["fire"], abilities: ["blaze"] }, modifiers)).toEqual([]);
  });
});
