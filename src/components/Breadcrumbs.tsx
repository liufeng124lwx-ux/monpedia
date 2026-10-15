import Link from "next/link";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      {items.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          <ol className="flex flex-wrap gap-1">
            {all.map((it, i) => (
              <li key={it.path}>
                {i < all.length - 1 ? (
                  <>
                    <Link href={it.path} className="hover:underline">{it.name}</Link>
                    <span aria-hidden="true"> › </span>
                  </>
                ) : (
                  <span aria-current="page">{it.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}
