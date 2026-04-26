import { NextResponse } from "next/server";

import { getPublicProject } from "@/lib/public-content";

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string; slug: string }> },
) {
  const { handle, slug } = await params;
  const project = await getPublicProject(handle, slug);
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
