import { NextResponse } from "next/server";

import { getPublicProject } from "@/lib/public-content";
import { resolveLocaleFromRequest } from "@/lib/i18n";

export const revalidate = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string; slug: string }> },
) {
  const { handle, slug } = await params;
  const locale = resolveLocaleFromRequest(req);
  const project = await getPublicProject(handle, slug, locale);
  if (!project) {
    return new NextResponse("public project not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse(project.markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
