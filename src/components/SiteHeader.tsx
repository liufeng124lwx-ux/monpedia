"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { SEARCH_EVENT } from "@/lib/search";

const NAV = [
  { href: "/", label: "Type Chart", short: "Types" },
  { href: "/pokemon", label: "Pokémon" },
  { href: "/natures", label: "Natures" },
  { href: "/winds-waves", label: "Winds & Waves" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/types");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // "/" focuses the quick search, like the Pokédex search on pokemon.com sits one keystroke away.
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="z-40 bg-stage-ink text-white sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden="true" className="relative inline-block size-6 rounded-full bg-red ring-2 ring-white">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white" />
            <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-stage-ink" />
          </span>
          MONPEDIA
        </Link>
        <nav aria-label="Main" className="order-3 -mx-1 flex w-full justify-between gap-0.5 overflow-x-auto sm:order-none sm:w-auto sm:justify-start sm:gap-1">
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-2 py-1.5 text-[13px] font-semibold sm:px-3 sm:text-sm transition-colors duration-(--duration-fast) ${active ? "bg-red text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
              >
                {n.short ? (
                  <>
                    <span className="sm:hidden">{n.short}</span>
                    <span className="hidden sm:inline">{n.label}</span>
                  </>
                ) : (
                  n.label
                )}
              </Link>
            );
          })}
        </nav>
        <form
          role="search"
          className="ml-auto min-w-0 flex-1 sm:flex-none"
          onSubmit={(e) => {
            e.preventDefault();
            const q = input.current?.value.trim() ?? "";
            // Already on the list: filter in place instead of navigating to the same route.
            if (pathname === "/pokemon") window.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: q }));
            else router.push(q ? `/pokemon?q=${encodeURIComponent(q)}` : "/pokemon");
            if (input.current) {
              input.current.value = "";
              input.current.blur();
            }
          }}
        >
          <label className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm focus-within:bg-white/15">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 fill-none stroke-current stroke-2 opacity-70">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              ref={input}
              type="search"
              aria-label="Jump to a Pokémon"
              placeholder="Name or number"
              className="w-full min-w-0 bg-transparent placeholder:text-white/50 focus:outline-none sm:w-40"
            />
            <kbd className="hidden rounded border border-white/25 px-1.5 text-xs text-white/60 sm:inline">/</kbd>
          </label>
        </form>
      </div>
    </header>
  );
}
