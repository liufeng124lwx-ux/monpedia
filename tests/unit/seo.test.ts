import { describe, expect, it } from "vitest";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { joinList } from "@/lib/text";

describe("absoluteUrl", () => {
  it("never adds a trailing slash", () => {
    expect(absoluteUrl("/")).toBe("https://monpedia.net");
    expect(absoluteUrl("/pokemon/charizard")).toBe("https://monpedia.net/pokemon/charizard");
    expect(absoluteUrl("/natures/")).toBe("https://monpedia.net/natures");
  });
});

describe("pageMetadata", () => {
  it("appends the site name and sets canonical", () => {
    const m = pageMetadata({ title: "Fire Type Weakness & Strengths", description: "d", path: "/types/fire" });
    expect(m.title).toEqual({ absolute: "Fire Type Weakness & Strengths | Monpedia" });
    expect(m.alternates?.canonical).toBe("https://monpedia.net/types/fire");
  });
});

describe("JSON-LD", () => {
  it("builds breadcrumbs with absolute URLs", () => {
    expect(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Pokémon", path: "/pokemon" }])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://monpedia.net" },
        { "@type": "ListItem", position: 2, name: "Pokémon", item: "https://monpedia.net/pokemon" },
      ],
    });
  });

  it("builds FAQPage", () => {
    expect(faqJsonLd([{ q: "Q?", a: "A." }]).mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Q?",
      acceptedAnswer: { "@type": "Answer", text: "A." },
    });
  });
});

describe("joinList", () => {
  it("joins with commas and 'and'", () => {
    expect(joinList([])).toBe("");
    expect(joinList(["A"])).toBe("A");
    expect(joinList(["A", "B"])).toBe("A and B");
    expect(joinList(["A", "B", "C"])).toBe("A, B and C");
  });
});
