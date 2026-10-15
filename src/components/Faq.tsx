import { faqJsonLd, type Qa } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

export function Faq({ items }: { items: Qa[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Frequently asked questions</h2>
      <dl className="mt-3 space-y-4">
        {items.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-medium">{q}</dt>
            <dd className="mt-1 text-zinc-600 dark:text-zinc-400">{a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqJsonLd(items)} />
    </section>
  );
}
