import { describe, expect, it } from "vitest";
import { getNatures } from "@/lib/data";
import { filterNatures, STAT_LABELS } from "@/lib/natures";

describe("filterNatures", () => {
  const natures = getNatures();

  it("returns all natures with no filter", () => {
    expect(filterNatures(natures, null, null)).toHaveLength(25);
  });

  it("filters by raised stat", () => {
    expect(filterNatures(natures, "atk", null).map((n) => n.name).sort()).toEqual(["Adamant", "Brave", "Lonely", "Naughty"]);
  });

  it("filters by raised and lowered stat", () => {
    expect(filterNatures(natures, "spe", "spa").map((n) => n.name)).toEqual(["Jolly"]);
  });

  it("labels stats", () => {
    expect(STAT_LABELS.spa).toBe("Sp. Atk");
  });
});
