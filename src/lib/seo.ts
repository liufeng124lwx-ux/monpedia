import type { Metadata } from "next";

export const SITE_URL = "https://monpedia.net";
export const SITE_NAME = "Monpedia";

export type Crumb = { name: string; path: string };
export type Qa = { q: string; a: string };

export function absoluteUrl(path: string): string {
  const clean = `/${path}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return clean === "" ? SITE_URL : `${SITE_URL}${clean}`;
}

export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = absoluteUrl(path);
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, siteName: SITE_NAME, type: "website" },
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
