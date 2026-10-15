import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: SITE_NAME };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const NAV = [
  { href: "/", label: "Type Chart" },
  { href: "/pokemon", label: "Pokémon" },
  { href: "/natures", label: "Natures" },
  { href: "/winds-waves", label: "Winds & Waves" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const beacon = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">Monpedia</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-xs text-zinc-500 dark:text-zinc-400">
            <p>
              Monpedia is an unofficial fan site. Pokémon and all related names are trademarks of Nintendo,
              Game Freak and The Pokémon Company. Monpedia is not affiliated with or endorsed by them.
            </p>
            <p className="flex gap-4">
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
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
