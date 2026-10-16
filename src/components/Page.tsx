import type { CSSProperties, ReactNode } from "react";

/** Centered content column used inside every band. */
export function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>;
}

type Tone = "yellow" | "ink" | "panel";

const TONES: Record<Tone, string> = {
  yellow: "bg-yellow text-stage-ink",
  ink: "bg-stage-ink text-white",
  panel: "bg-panel",
};

/** Full-bleed color band, the Playdate-style section block. `style` lets type pages tint it. */
export function Band({
  tone,
  style,
  className = "",
  children,
}: {
  tone?: Tone;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${tone ? TONES[tone] : ""} ${className}`} style={style}>
      <Wrap className="py-10 sm:py-14">{children}</Wrap>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] opacity-70">{children}</p>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return <h2 id={id} className="text-2xl font-extrabold sm:text-3xl">{children}</h2>;
}
