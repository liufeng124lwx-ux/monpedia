"use client";

import { useState } from "react";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";

type Props = { src: string | null; name: string; type: TypeName; size?: number; eager?: boolean };

export function Sprite({ src, name, type, size = 96, eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const { bg, fg } = TYPE_COLORS[type];
    return (
      <div
        role="img"
        aria-label={name}
        className="flex shrink-0 items-center justify-center rounded-full font-bold"
        style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: size / 3 }}
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className="shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
