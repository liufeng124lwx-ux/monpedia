import Link from "next/link";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";

export function TypeBadge({ type, link = true }: { type: TypeName; link?: boolean }) {
  const { bg, fg } = TYPE_COLORS[type];
  const className = "inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide";
  const style = { backgroundColor: bg, color: fg };
  return link ? (
    <Link href={`/types/${type}`} className={className} style={style}>{typeLabel(type)}</Link>
  ) : (
    <span className={className} style={style}>{typeLabel(type)}</span>
  );
}
