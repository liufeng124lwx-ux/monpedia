import { describe, expect, it } from "vitest";
import { parseCsv } from "../../scripts/lib/csv";
import { buildAbilityNames, buildNatures, buildTypeData, titleCase } from "../../scripts/lib/transform";

describe("titleCase", () => {
  it("turns identifiers into words", () => {
    expect(titleCase("charizard-mega-x")).toBe("Charizard Mega X");
  });
});

describe("buildTypeData", () => {
  const types = parseCsv("id,identifier\n10,fire\n11,water\n19,stellar\n10001,unknown\n");
  const names = parseCsv("type_id,local_language_id,name\n10,9,Fire\n10,1,ほのお\n11,9,Water\n");
  const efficacy = parseCsv(
    "damage_type_id,target_type_id,damage_factor\n10,10,50\n10,11,50\n11,10,200\n11,11,50\n",
  );
  const { typeIdToName, data } = buildTypeData(types, names, efficacy);

  it("keeps only the 18 battle types", () => {
    expect([...typeIdToName.values()]).toEqual(["fire", "water"]);
  });
  it("uses English names", () => {
    expect(data.names.fire).toBe("Fire");
  });
  it("converts damage factors to multipliers indexed [attack][defend]", () => {
    expect(data.chart.water.fire).toBe(2);
    expect(data.chart.fire.water).toBe(0.5);
  });
});

describe("buildNatures", () => {
  const natures = parseCsv(
    "id,identifier,decreased_stat_id,increased_stat_id\n1,hardy,2,2\n3,adamant,4,2\n",
  );
  const names = parseCsv("nature_id,local_language_id,name\n1,9,Hardy\n3,9,Adamant\n");
  it("maps stat ids and marks neutral natures with nulls", () => {
    expect(buildNatures(natures, names)).toEqual([
      { name: "Adamant", up: "atk", down: "spa" },
      { name: "Hardy", up: null, down: null },
    ]);
  });
});

describe("buildAbilityNames", () => {
  it("maps slugs to English names with a title-case fallback", () => {
    const abilities = parseCsv("id,identifier\n26,levitate\n999,new-thing\n");
    const names = parseCsv("ability_id,local_language_id,name\n26,9,Levitate\n");
    expect(buildAbilityNames(abilities, names)).toEqual({ levitate: "Levitate", "new-thing": "New Thing" });
  });
});
