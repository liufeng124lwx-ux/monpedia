import type { Metadata } from "next";

export const SITE_URL = "https://monpedia.net";
export const SITE_NAME = "Monpedia";

export type Crumb = { name: string; path: string };
export type Qa = { q: string; a: string };

export function absoluteUrl(path: string): string {
  const clean = `/${path}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return clean === "" ? SITE_URL : `${SITE_URL}${clean}`;
}

/** Google cuts snippets around 160 characters. */
export const MAX_DESCRIPTION = 160;

/** First candidate that fits, longest-first; the last one is cut at a word boundary if needed. */
export function fitDescription(candidates: string[]): string {
  const fit = candidates.find((c) => c.length <= MAX_DESCRIPTION);
  if (fit) return fit;
  const last = candidates.at(-1) ?? "";
  return `${last.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, "")}…`;
}

/** Default share card (1200×630) in public/. */
export const DEFAULT_OG_IMAGE = { url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Monpedia – Pokémon type chart and weakness calculator" };

type OgImage = { url: string; width: number; height: number; alt: string };

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  image?: OgImage;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = absoluteUrl(path);
  const wide = image.width / image.height > 1.5;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, siteName: SITE_NAME, type: "website", images: [image] },
    twitter: { card: wide ? "summary_large_image" : "summary", title: fullTitle, description, images: [image.url] },
  };
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(qas: Qa[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
