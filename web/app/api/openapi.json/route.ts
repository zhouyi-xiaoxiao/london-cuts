import { NextResponse } from "next/server";

import { buildOpenApiDocument } from "@/lib/openapi";
import { resolveLocaleFromRequest } from "@/lib/i18n";

export const revalidate = 300;

export async function GET(req: Request) {
  return NextResponse.json(buildOpenApiDocument(resolveLocaleFromRequest(req)), {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
