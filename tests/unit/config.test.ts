import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("next config", () => {
  it("exports a fully static site with spec settings", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.trailingSlash).toBe(false);
    expect(nextConfig.images?.unoptimized).toBe(true);
  });
});
