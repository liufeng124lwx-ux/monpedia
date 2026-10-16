import { describe, expect, it } from "vitest";
import { fitDescription, MAX_DESCRIPTION } from "@/lib/seo";

describe("fitDescription", () => {
  it("returns the first candidate that fits", () => {
    expect(fitDescription(["x".repeat(200), "short enough", "shorter"])).toBe("short enough");
  });

  it("cuts the last candidate at a word boundary when none fit", () => {
    const out = fitDescription([`${"word ".repeat(60)}end`]);
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(out.endsWith("word…")).toBe(true);
  });
});
