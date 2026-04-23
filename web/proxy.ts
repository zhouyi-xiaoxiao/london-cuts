// Preview-stage password gate.
//
// When PREVIEW_PASSWORD is set in the Vercel env, the listed write /
// editor paths require a cookie with that password. Everything else is
// public by default. This flip — from "default gated, explicit allow"
// to "default public, explicit deny" — fixes the dogfood bug where
// `/@handle/slug` links in public pages got URL-encoded to `/%40...`
// and stopped matching the allow-list prefix. With the deny-list shape
// we never depend on URL-encoding details.
//
// Why a denylist is OK here:
//   - the public read pages are, by design, shareable to anyone
//   - what we actually need to protect is spend (OpenAI-backed APIs)
//     and write surface (service_role backed sync). Those live on
//     specific, stable path prefixes (/studio, /api/ai, /api/sync,
//     /api/migrate) that never contain user-generated segments
//   - the full gate goes away when M2 auth lands — see
//     tasks/deferred/M2-auth-and-invites.md
//
// If you add a new sensitive prefix later, remember to add it to
// GATED_PREFIXES below, and ship it in the same PR as the feature
// that introduces the spend / write surface.

import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lc_preview_auth";

/** Paths we NEVER gate — the gate itself lives here. */
const GATE_INFRA = new Set<string>([
  "/gate",
  "/api/gate",
  "/robots.txt",
  "/sitemap.xml",
]);

/** Exact paths that ARE gated. Currently just the root, which
 *  redirects to /studio anyway. */
const GATED_EXACT = new Set<string>(["/"]);

/** Path prefixes that ARE gated. Anything matching one of these
 *  requires the preview cookie. Everything else is public. */
const GATED_PREFIXES: readonly string[] = [
  "/studio",
  "/api/ai",
  "/api/sync",
  "/api/migrate",
  "/poc",
];

function decodePathSafe(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function shouldGate(rawPathname: string): boolean {
  const pathname = decodePathSafe(rawPathname);
  if (GATE_INFRA.has(pathname)) return false;
  if (GATED_EXACT.has(pathname)) return true;
  for (const prefix of GATED_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export function proxy(req: NextRequest) {
  const password = process.env.PREVIEW_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;

  if (!shouldGate(pathname)) return NextResponse.next();

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
