/**
 * Adsterra configuration, read from build-time env vars. Ads render only when NEXT_PUBLIC_ADS=on and the unit's
 * code from the Adsterra dashboard is set, so a build without them is identical to an ad-free site.
 *
 * Each unit is served from its own same-origin page under /ads/ and shown in an iframe: Adsterra's banner code reads
 * one global `atOptions` and writes the ad where its script sits, which clashes with React hydration and with a
 * second slot on the same page. Inside its own frame every slot gets a clean page, and the referrer stays monpedia.net.
 */

const HEX32 = /[0-9a-f]{32}/;

export type BannerUnit = { key: string; src: string; width: 300; height: 250 };
export type NativeUnit = { src: string; container: string };

type Env = Record<string, string | undefined>;

function httpsSrc(raw: string, name: string): string {
  const src = raw.startsWith("//") ? `https:${raw}` : raw;
  if (!/^https:\/\/[a-z0-9.-]+\/\S+$/i.test(src)) throw new Error(`${name} must be the script URL from the Adsterra code, got "${raw}"`);
  return src;
}

/** Banner 300×250: `atOptions.key` and the invoke.js script URL from the dashboard's code. */
export function bannerUnit(env: Env): BannerUnit | null {
  const key = env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY;
  const src = env.NEXT_PUBLIC_ADSTERRA_BANNER_SRC;
  if (!key || !src) return null;
  if (!/^[0-9a-f]{32}$/.test(key)) throw new Error(`NEXT_PUBLIC_ADSTERRA_BANNER_KEY must be 32 hex chars, got "${key}"`);
  return { key, src: httpsSrc(src, "NEXT_PUBLIC_ADSTERRA_BANNER_SRC"), width: 300, height: 250 };
}

/** Native Banner: the script URL; its container id is `container-<hash>` where the hash is in the URL path. */
export function nativeUnit(env: Env): NativeUnit | null {
  const raw = env.NEXT_PUBLIC_ADSTERRA_NATIVE_SRC;
  if (!raw) return null;
  const src = httpsSrc(raw, "NEXT_PUBLIC_ADSTERRA_NATIVE_SRC");
  const hash = new URL(src).pathname.match(HEX32)?.[0];
  if (!hash) throw new Error(`NEXT_PUBLIC_ADSTERRA_NATIVE_SRC must contain the 32-char unit hash, got "${raw}"`);
  return { src, container: `container-${hash}` };
}

export function adsOn(env: Env): boolean {
  return env.NEXT_PUBLIC_ADS === "on";
}

const page = (body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head><body>${body}</body></html>`;

/** The exact snippet Adsterra hands out, wrapped in a minimal page. */
export function bannerPage(unit: BannerUnit | null): string {
  if (!unit) return page("");
  const options = JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} });
  return page(`<script>atOptions = ${options};</script><script src="${unit.src}"></script>`);
}

export function nativePage(unit: NativeUnit | null): string {
  if (!unit) return page("");
  return page(`<script async data-cfasync="false" src="${unit.src}"></script><div id="${unit.container}"></div>`);
}
