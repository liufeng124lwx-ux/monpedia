import type { ReactNode } from "react";
import { adsOn, bannerUnit, nativeUnit } from "@/lib/ads";
import { NativeAdFrame } from "./NativeAdFrame";

const env = process.env;

function Labelled({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Advertisement" className="my-10 flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Advertisement</span>
      {children}
    </aside>
  );
}

/** 300×250 Adsterra banner in a same-origin frame (see lib/ads.ts). Renders nothing until ads are configured. */
export function AdSlot({ id }: { id: string }) {
  const unit = adsOn(env) ? bannerUnit(env) : null;
  if (!unit) return null;
  return (
    <Labelled>
      <iframe
        data-ad-slot={id}
        src="/ads/banner"
        title="Advertisement"
        width={unit.width}
        height={unit.height}
        loading="lazy"
        scrolling="no"
        className="block max-w-full border-0"
        style={{ width: unit.width, height: unit.height }}
      />
    </Labelled>
  );
}

/** Adsterra Native Banner, sized to its content. Renders nothing until ads are configured. */
export function NativeAdSlot({ id }: { id: string }) {
  if (!adsOn(env) || !nativeUnit(env)) return null;
  return (
    <Labelled>
      <NativeAdFrame id={id} />
    </Labelled>
  );
}
