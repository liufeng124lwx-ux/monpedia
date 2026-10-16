"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/** Trading-card style tilt + foil glare that follows the pointer. Mouse/pen only; off under reduced motion via CSS. */
export function HoloCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const node = el.current;
    if (!node || e.pointerType === "touch") return;
    const r = node.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    node.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    node.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    node.style.setProperty("--mx", `${x * 100}%`);
    node.style.setProperty("--my", `${y * 100}%`);
    node.dataset.active = "true";
  };

  const leave = () => {
    const node = el.current;
    if (!node) return;
    node.style.setProperty("--rx", "0deg");
    node.style.setProperty("--ry", "0deg");
    node.dataset.active = "false";
  };

  return (
    <div ref={el} onPointerMove={move} onPointerLeave={leave} className={`holo relative ${className}`}>
      {children}
    </div>
  );
}
