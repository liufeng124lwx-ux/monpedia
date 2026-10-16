import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Monpedia handles data: no accounts, no tracking cookies, privacy-friendly analytics.",
  path: "/privacy",
});

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 leading-relaxed">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="text-4xl font-extrabold">Privacy Policy</h1>
      <p>Last updated: October 15, 2026.</p>
      <p>Monpedia has no user accounts and does not ask you for personal information.</p>
      <p>
        We use Cloudflare Web Analytics to count page views. It does not use cookies and does not track you
        across websites. Our hosting provider, Cloudflare, processes standard request data such as IP
        addresses to deliver and protect the site.
      </p>
      <p>
        Pokémon images are loaded from the jsDelivr CDN, which receives standard request data when your browser
        downloads them.
      </p>
      <p>
        If we start showing advertising, this policy will be updated before ads go live to describe the
        advertising partners and the cookies they use.
      </p>
      <p>Questions: contact@monpedia.net</p>
    </article>
  );
}
