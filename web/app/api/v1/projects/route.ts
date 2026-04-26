import { NextResponse } from "next/server";

import { listPublicProjects } from "@/lib/public-content";

export const revalidate = 60;

export async function GET() {
  const projects = await listPublicProjects();
  return NextResponse.json({
    object: "list",
    data: projects,
  });
}
