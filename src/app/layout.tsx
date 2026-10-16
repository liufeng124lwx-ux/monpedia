import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-outfit" });

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: SITE_NAME };
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#211f1a" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const beacon = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <main>{children}</main>
        <footer className="mt-20 bg-stage-ink text-white/70">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 text-sm">
            <p className="text-lg font-extrabold text-white">MONPEDIA</p>
            <p className="max-w-2xl text-xs leading-relaxed">
              Monpedia is an unofficial fan site. Pokémon and all related names are trademarks of Nintendo,
              Game Freak and The Pokémon Company. Monpedia is not affiliated with or endorsed by them.
            </p>
            <p className="flex gap-5 font-semibold">
              <Link href="/about" className="py-1 hover:text-white">About</Link>
              <Link href="/privacy" className="py-1 hover:text-white">Privacy</Link>
              <Link href="/terms" className="py-1 hover:text-white">Terms</Link>
            </p>
          </div>
        </footer>
        {beacon && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: beacon })}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
