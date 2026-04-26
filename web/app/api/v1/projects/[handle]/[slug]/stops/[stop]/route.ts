import { NextResponse } from "next/server";

import { getPublicStop } from "@/lib/public-content";

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string; slug: string; stop: string }> },
) {
  const { handle, slug, stop } = await params;
  const result = await getPublicStop(handle, slug, stop);
  if (!result) {
    return NextResponse.json(
      { error: "public stop not found", code: "not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    project: {
      id: result.project.id,
      handle: result.project.handle,
      slug: result.project.slug,
      title: result.project.title,
      canonicalUrl: result.project.canonicalUrl,
    },
    stop: result.stop,
  });
}
