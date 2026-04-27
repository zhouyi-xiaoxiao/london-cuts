import { NextResponse } from "next/server";

import { listPublicProjects } from "@/lib/public-content";
import { resolveLocaleFromRequest } from "@/lib/i18n";

export const revalidate = 60;

export async function GET(req: Request) {
  const locale = resolveLocaleFromRequest(req);
  const projects = await listPublicProjects(locale);
  return NextResponse.json({
    object: "list",
    locale,
    availableLocales: ["en", "zh"],
    data: projects,
  });
}
