"use client";

import { useEffect, useRef } from "react";

/** Same-origin frame for the Native Banner; grows to fit whatever the ad renders. */
export function NativeAdFrame({ id }: { id: string }) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const body = el.contentDocument?.body;
      if (!body) return;
      el.style.height = `${body.scrollHeight}px`;
      observer?.disconnect();
      observer = new ResizeObserver(() => (el.style.height = `${body.scrollHeight}px`));
      observer.observe(body);
    };
    el.addEventListener("load", fit);
    fit();
    return () => {
      el.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={frame}
      data-ad-slot={id}
      src="/ads/native"
      title="Advertisement"
      loading="lazy"
      scrolling="no"
      className="block w-full max-w-4xl border-0"
      style={{ height: 0 }}
    />
  );
}
