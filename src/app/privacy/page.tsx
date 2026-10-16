import { Breadcrumbs } from "@/components/Breadcrumbs";
import { adsOn, bannerUnit, nativeUnit } from "@/lib/ads";
import { pageMetadata } from "@/lib/seo";

/** The ad paragraph switches on with the same build flags that turn ads on, so the policy never lags the site. */
const ads = adsOn(process.env) && (bannerUnit(process.env) !== null || nativeUnit(process.env) !== null);

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: ads
    ? "How Monpedia handles data: no accounts, cookie-free analytics, and ads from Adsterra that may use cookies."
    : "How Monpedia handles data: no accounts, no tracking cookies, privacy-friendly analytics.",
  path: "/privacy",
});

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 leading-relaxed">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="text-4xl font-extrabold">Privacy Policy</h1>
      <p>Last updated: {ads ? "October 16, 2026" : "October 15, 2026"}.</p>
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
      {ads ? (
        <>
          <p>
            Monpedia shows ads from Adsterra (adsterra.com), an advertising network. Ads are loaded in separate
            frames from Adsterra&apos;s servers, which receive standard request data such as your IP address,
            browser and the page you are on, and may set cookies or use similar technologies to count impressions,
            limit how often you see an ad and prevent fraud. See Adsterra&apos;s privacy policy at
            adsterra.com/privacy-policy for details and choices.
          </p>
          <p>You can block or delete cookies in your browser settings; the site works without them.</p>
        </>
      ) : (
        <p>
          If we start showing advertising, this policy will be updated before ads go live to describe the
          advertising partners and the cookies they use.
        </p>
      )}
      <p>Questions: contact@monpedia.net</p>
    </article>
  );
}
