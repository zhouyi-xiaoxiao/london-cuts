// Preview-stage password gate.
//
// When PREVIEW_PASSWORD is set in the Vercel env, every request that
// doesn't carry the correct `lc_preview_auth` cookie is redirected to
// /gate. This is NOT real auth — it's a "don't scrape this" door for
// beta friends. Real auth lands in M2 (Supabase magic link).
//
// When PREVIEW_PASSWORD is unset (local dev without a value), the gate
// is disabled: requests pass straight through.
//
// Next.js 16 renamed the `middleware` convention to `proxy` — the file
// and the exported function are both `proxy` now. Legacy `middleware.ts`
// compiles but doesn't deploy cleanly on Vercel.
//
// NOTE: the real Vercel deploy failure we hit on 2026-04-21 was NOT
// caused by proxy vs middleware — it was `outputFileTracingRoot` in
// next.config.ts. See HANDOFF.md → "deploy gotchas".

import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lc_preview_auth";

// Exact paths the proxy must NOT block (so the gate itself can render).
const PUBLIC_PATHS = new Set<string>([
  "/gate",
  "/api/gate",
  "/robots.txt",
  "/sitemap.xml",
  "/atlas",
]);

// Path prefixes that are genuinely public — reader-side views of
// published projects. Friends / strangers can follow a share link
// without a password; the only thing they can do is READ a project
// that the owner already marked published + visibility=public.
// Write-side routes (studio + /api/ai + /api/sync + /api/migrate)
// stay gated — they're where money is spent and where data gets
// mutated via the M1 service_role workaround. The full gate goes
// away once M2 auth lands.
const PUBLIC_PREFIXES: readonly string[] = [
  "/@", // public project / chapter / postcard pages — /@handle/slug, /@handle/slug/chapter/*, /@handle/slug/p/*
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export function proxy(req: NextRequest) {
  const password = process.env.PREVIEW_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow the gate routes + known public paths through.
  if (isPublicPath(pathname)) return NextResponse.next();

  // Already authenticated? Let through.
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value === password) return NextResponse.next();

  // Otherwise redirect to the gate, preserving the intended destination.
  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

// Run on EVERY path except Next.js asset prefixes + files with an extension.
// (The sitemap/robots exceptions are handled inside proxy() above so
//  they can coexist with this matcher.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|txt|xml|json|css|js|map|woff|woff2|ttf|otf|eot)$).*)",
  ],
};
