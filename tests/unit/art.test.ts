import { describe, expect, it } from "vitest";
import { artworkUrl } from "@/lib/art";

describe("artworkUrl", () => {
  it("points a pinned sprite at the official artwork in the same repo", () => {
    const sprite = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@abc123/sprites/pokemon/10034.png";
    expect(artworkUrl(sprite)).toBe("https://cdn.jsdelivr.net/gh/PokeAPI/sprites@abc123/sprites/pokemon/other/official-artwork/10034.png");
  });
});
