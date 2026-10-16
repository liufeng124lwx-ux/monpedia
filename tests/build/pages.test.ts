import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

const OUT = path.resolve(__dirname, "../../out");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    // _next is framework output; ads/ holds the noindexed Adsterra frame pages, not site pages.
    if (statSync(full).isDirectory()) return name.startsWith("_") || name === "ads" ? [] : htmlFiles(full);
    return name.endsWith(".html") && !name.startsWith("_") && name !== "404.html" ? [full] : [];
  });
}

const pages = htmlFiles(OUT).map((f) => {
  const html = readFileSync(f, "utf8");
  const root = parse(html);
  return {
    file: path.relative(OUT, f),
    html,
    title: root.querySelector("title")?.text.trim() ?? "",
    h1: root.querySelectorAll("h1").length,
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    description: root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    ogImage: root.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "",
    jsonLd: root.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.text)),
  };
});
const find = (file: string) => pages.find((p) => p.file === file)!;

describe("built site", () => {
  it("has about 1300 Pokémon pages and 18 type pages", () => {
    const pokemon = pages.filter((p) => p.file.startsWith("pokemon/")).length;
    expect(pokemon).toBeGreaterThan(1100);
    expect(pokemon).toBeLessThan(1500);
    expect(pages.filter((p) => p.file.startsWith("types/"))).toHaveLength(18);
  });

  it("every page has a title, one h1, a slash-free canonical and breadcrumb JSON-LD", () => {
    for (const p of pages) {
      expect(p.title, p.file).not.toBe("");
      expect(p.h1, p.file).toBe(1);
      expect(p.canonical, p.file).toMatch(/^https:\/\/monpedia\.net(\/[^?#]*[^/])?$/);
      expect(p.jsonLd.some((j) => j["@type"] === "BreadcrumbList"), p.file).toBe(true);
    }
  });

  it("every page has a snippet-length description and a share image", () => {
    for (const p of pages) {
      expect(p.description.length, p.file).toBeGreaterThan(50);
      expect(p.description.length, `${p.file}: ${p.description}`).toBeLessThanOrEqual(160);
      expect(p.ogImage, p.file).toMatch(/^https:\/\//);
    }
  });

  it("titles are unique", () => {
    const titles = pages.map((p) => p.title);
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it("uses the spec title templates", () => {
    expect(find("index.html").title).toBe("Pokémon Type Chart & Weakness Calculator | Monpedia");
    expect(find("pokemon/charizard.html").title).toBe("Charizard Weakness & Counters – Type Matchups | Monpedia");
    expect(find("types/fire.html").title).toBe("Fire Type Weakness & Strengths | Monpedia");
    expect(find("natures.html").title).toBe("Pokémon Nature Chart – All 25 Natures | Monpedia");
  });

  it("canonicalises the home page to the bare domain", () => {
    expect(find("index.html").canonical).toBe("https://monpedia.net");
  });

  it("emits FAQPage JSON-LD on Pokémon pages", () => {
    expect(find("pokemon/charizard.html").jsonLd.some((j) => j["@type"] === "FAQPage")).toBe(true);
  });

  it("lists every page in the sitemap and links it from robots.txt", () => {
    const xml = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
    expect((xml.match(/<loc>/g) ?? []).length).toBe(pages.length);
    expect(readFileSync(path.join(OUT, "robots.txt"), "utf8")).toContain("Sitemap: https://monpedia.net/sitemap.xml");
  });

  it("never references raw.githubusercontent.com", () => {
    expect(pages.filter((p) => p.html.includes("raw.githubusercontent.com")).map((p) => p.file)).toEqual([]);
  });

  it("has a 404 page", () => {
    expect(existsSync(path.join(OUT, "404.html"))).toBe(true);
  });
});
