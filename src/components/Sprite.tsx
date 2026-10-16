"use client";

import { useState, ViewTransition } from "react";
import { artworkUrl } from "@/lib/art";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";

type Props = {
  src: string | null;
  name: string;
  type: TypeName;
  size?: number;
  eager?: boolean;
  /** Shared-element name so the artwork morphs between the list card and the detail hero. */
  morph?: string;
  className?: string;
};

/** Official artwork for a Pokémon, falling back to a type-colored initial when there is none. */
export function Sprite({ src, name, type, size = 96, eager = false, morph, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const body =
    !src || failed ? (
      <div
        role="img"
        aria-label={name}
        className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${className}`}
        style={{ width: size, height: size, backgroundColor: TYPE_COLORS[type].bg, color: TYPE_COLORS[type].fg, fontSize: size / 2.6 }}
      >
        {name.charAt(0)}
      </div>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artworkUrl(src)}
        alt={name}
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        onError={() => setFailed(true)}
        className={`shrink-0 object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.18)] ${className}`}
        style={{ width: size, height: size }}
      />
    );
  return morph ? (
    <ViewTransition name={morph} share="morph" default="none">
      {body}
    </ViewTransition>
  ) : (
    body
  );
}
