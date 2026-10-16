import { bannerPage, bannerUnit } from "@/lib/ads";

export const dynamic = "force-static";

export function GET() {
  return new Response(bannerPage(bannerUnit(process.env)), { headers: { "content-type": "text/html; charset=utf-8" } });
}
