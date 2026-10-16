import { describe, expect, it } from "vitest";
import { adsOn, bannerPage, bannerUnit, nativePage, nativeUnit } from "@/lib/ads";

const KEY = "0123456789abcdef0123456789abcdef";

describe("Adsterra config", () => {
  it("is off unless explicitly enabled", () => {
    expect(adsOn({})).toBe(false);
    expect(adsOn({ NEXT_PUBLIC_ADS: "on" })).toBe(true);
  });

  it("needs both the banner key and script URL", () => {
    expect(bannerUnit({ NEXT_PUBLIC_ADSTERRA_BANNER_KEY: KEY })).toBeNull();
    expect(bannerUnit({ NEXT_PUBLIC_ADSTERRA_BANNER_KEY: KEY, NEXT_PUBLIC_ADSTERRA_BANNER_SRC: `//example.com/${KEY}/invoke.js` })).toEqual({
      key: KEY,
      src: `https://example.com/${KEY}/invoke.js`,
      width: 300,
      height: 250,
    });
  });

  it("rejects malformed values instead of shipping a broken ad", () => {
    expect(() => bannerUnit({ NEXT_PUBLIC_ADSTERRA_BANNER_KEY: "nope", NEXT_PUBLIC_ADSTERRA_BANNER_SRC: "https://x.com/a" })).toThrow();
    expect(() => nativeUnit({ NEXT_PUBLIC_ADSTERRA_NATIVE_SRC: "https://x.com/no-hash/invoke.js" })).toThrow();
  });

  it("derives the native container id from the script URL", () => {
    expect(nativeUnit({ NEXT_PUBLIC_ADSTERRA_NATIVE_SRC: `//pl1.example.com/${KEY}/invoke.js` })?.container).toBe(`container-${KEY}`);
  });

  it("writes the dashboard snippet into the frame page", () => {
    const html = bannerPage(bannerUnit({ NEXT_PUBLIC_ADSTERRA_BANNER_KEY: KEY, NEXT_PUBLIC_ADSTERRA_BANNER_SRC: `https://example.com/${KEY}/invoke.js` }));
    expect(html).toContain(`atOptions = {"key":"${KEY}","format":"iframe","height":250,"width":300,"params":{}};`);
    expect(html).toContain(`<script src="https://example.com/${KEY}/invoke.js"></script>`);
    expect(html).toContain('name="robots" content="noindex"');
    expect(nativePage(null)).not.toContain("<script");
  });
});
