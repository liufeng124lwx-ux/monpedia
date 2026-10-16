import Link from "next/link";
import type { CSSProperties } from "react";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";

type Props = { type: TypeName; link?: boolean; size?: "sm" | "md"; className?: string; style?: CSSProperties };

const SIZES = { sm: "px-2.5 py-1 text-[11px] leading-4", md: "px-3.5 py-1 text-sm" };

export function TypeBadge({ type, link = true, size = "sm", className = "", style }: Props) {
  const { bg, fg } = TYPE_COLORS[type];
  const cls = `inline-block rounded-full font-extrabold uppercase tracking-wider ${SIZES[size]} ${className}`;
  const css = { backgroundColor: bg, color: fg, ...style };
  return link ? (
    <Link
      href={`/types/${type}`}
      className={`${cls} transition-transform duration-(--duration-fast) hover:-translate-y-0.5`}
      style={css}
    >
      {typeLabel(type)}
    </Link>
  ) : (
    <span className={cls} style={css}>{typeLabel(type)}</span>
  );
}
