import { NextResponse } from "next/server";

import { buildOpenApiDocument } from "@/lib/openapi";

export const revalidate = 300;

export async function GET() {
  return NextResponse.json(buildOpenApiDocument(), {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
