import { faqJsonLd, type Qa } from "@/lib/seo";
import { JsonLd } from "./JsonLd";
import { H2, Wrap } from "./Page";

export function Faq({ items }: { items: Qa[] }) {
  if (items.length === 0) return null;
  return (
    <Wrap className="mt-14">
      <section>
        <H2>Frequently asked questions</H2>
        <div className="mt-5 max-w-3xl divide-y divide-line border-y border-line">
          {items.map(({ q, a }, i) => (
            <details key={q} open={i === 0} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-lg font-semibold">
                {q}
                <span aria-hidden="true" className="chev relative size-4 shrink-0 transition-transform duration-(--duration)">
                  <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded bg-current" />
                </span>
              </summary>
              <p className="pb-5 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
        <JsonLd data={faqJsonLd(items)} />
      </section>
    </Wrap>
  );
}
