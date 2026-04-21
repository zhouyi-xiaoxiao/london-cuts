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
// still compiles but makes Vercel's post-build step choke on a missing
// `routes-manifest-deterministic.json` entry, which is why the
// M-preview deploys were all erroring.

import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lc_preview_auth";

// Paths the proxy must NOT block (otherwise the gate itself can't render).
const PUBLIC_PATHS = new Set<string>([
  "/gate",
  "/api/gate",
  // Health / OG / robots / sitemap stay public if/when we add them.
  "/robots.txt",
  "/sitemap.xml",
]);

export function proxy(req: NextRequest) {
  const password = process.env.PREVIEW_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow the gate routes + known public paths through.
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

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
