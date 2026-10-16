import { nativePage, nativeUnit } from "@/lib/ads";

export const dynamic = "force-static";

export function GET() {
  return new Response(nativePage(nativeUnit(process.env)), { headers: { "content-type": "text/html; charset=utf-8" } });
}
