import { describe, expect, it } from "vitest";
import { typeDescription, typeFaq, typeMatchupLists } from "@/lib/type-page";

describe("typeMatchupLists", () => {
  it("lists Fire matchups in chart order", () => {
    const l = typeMatchupLists("fire");
    expect(l.weakTo).toEqual(["Ground", "Rock", "Water"]);
    expect(l.strongAgainst).toEqual(["Bug", "Steel", "Grass", "Ice"]);
    expect(l.immuneTo).toEqual([]);
  });

  it("captures immunities", () => {
    expect(typeMatchupLists("ghost").immuneTo).toEqual(["Normal", "Fighting"]);
    expect(typeMatchupLists("normal").noEffectOn).toEqual(["Ghost"]);
  });
});

describe("typeDescription / typeFaq", () => {
  it("describes the type from data", () => {
    expect(typeDescription("fire")).toContain("weak to Ground, Rock and Water");
    expect(typeFaq("fire").map((x) => x.q)).toEqual(["What is Fire weak to?", "What is Fire strong against?"]);
  });
});
