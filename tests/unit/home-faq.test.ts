import { describe, expect, it } from "vitest";
import { homeFaq } from "@/lib/home-faq";

describe("homeFaq", () => {
  const faq = homeFaq();
  const answer = (start: string) => faq.find((x) => x.q.startsWith(start))!.a;

  it("lists all 18 types", () => {
    expect(answer("How many types")).toContain("18 types");
    expect(answer("How many types")).toContain("Fairy");
  });

  it("computes the types with the most weaknesses", () => {
    expect(answer("Which type has the most weaknesses")).toBe("Grass and Rock each have 5 weaknesses as a single type.");
  });

  it("computes the types that are super effective against the most types", () => {
    expect(answer("Which type is super effective")).toBe("Fighting and Ground are each super effective against 5 types.");
  });
});
