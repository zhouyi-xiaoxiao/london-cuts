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
    return NextResponse.json(
      { error: "public project not found", code: "not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json(project);
}
