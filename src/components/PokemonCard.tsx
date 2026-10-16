import Link from "next/link";
import type { ReactNode } from "react";
import type { PokemonSummary } from "@/lib/data";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { Sprite } from "./Sprite";
import { TypeBadge } from "./TypeBadge";

export function typePanel(types: readonly TypeName[]): string {
  const a = TYPE_COLORS[types[0]].bg;
  const b = TYPE_COLORS[types[1] ?? types[0]].bg;
  return `linear-gradient(135deg, ${a} 0 62%, ${b} 62% 100%)`;
}

export const dexNo = (dex: number) => `#${String(dex).padStart(4, "0")}`;

/** Colored panel + artwork card. `morph` pairs the artwork with the detail-page hero. */
export function PokemonCard({
  p,
  morph = false,
  footer,
  size = 120,
}: {
  p: PokemonSummary;
  morph?: boolean;
  footer?: ReactNode;
  size?: number;
}) {
  return (
    <Link
      href={`/pokemon/${p.slug}`}
      transitionTypes={["nav-forward"]}
      className="group block overflow-hidden rounded-[10px] bg-paper ring-1 ring-line transition-[box-shadow,transform] duration-(--duration) hover:-translate-y-1 hover:ring-2 hover:ring-ink"
    >
      <div className="relative flex justify-center overflow-hidden py-3" style={{ background: typePanel(p.types) }}>
        <span
          aria-hidden="true"
          className="absolute -right-6 -top-6 size-28 rounded-full border-[10px] border-white/20 transition-transform duration-(--duration-slow) group-hover:rotate-45"
        >
          <span className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 bg-white/20" />
        </span>
        <span className="relative transition-transform duration-(--duration) ease-(--ease-emph) group-hover:-translate-y-1 group-hover:scale-110">
          <Sprite src={p.sprite} name={p.name} type={p.types[0]} size={size} morph={morph ? `art-${p.slug}` : undefined} />
        </span>
      </div>
      <div className="p-3">
        <span className="block text-xs font-bold tabular-nums text-muted">{dexNo(p.dex)}</span>
        <span className="block truncate text-base font-extrabold">{p.name}</span>
        <span className="mt-1.5 flex flex-wrap gap-1">{p.types.map((t) => <TypeBadge key={t} type={t} link={false} />)}</span>
        {footer && <span className="mt-2 block text-sm font-semibold">{footer}</span>}
      </div>
    </Link>
  );
}
