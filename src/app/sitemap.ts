import type { MetadataRoute } from "next";
import { getAllPokemon } from "@/lib/data";
import { TYPE_NAMES } from "@/lib/model";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/", "/natures", "/pokemon", "/winds-waves", "/about", "/privacy", "/terms",
    ...TYPE_NAMES.map((t) => `/types/${t}`),
    ...getAllPokemon().map((p) => `/pokemon/${p.slug}`),
  ];
  return paths.map((p) => ({ url: absoluteUrl(p) }));
}
