export function AdSlot({ id, height = 250 }: { id: string; height?: number }) {
  if (process.env.NEXT_PUBLIC_ADS !== "on") return null;
  return <div data-ad-slot={id} aria-hidden="true" className="my-8 w-full" style={{ minHeight: height }} />;
}
