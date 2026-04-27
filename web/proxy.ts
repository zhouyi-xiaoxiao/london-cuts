// Retired preview-stage password gate.
//
// PREVIEW_PASSWORD has been removed from Vercel, so proxy() now falls
// through immediately and public pages are shareable. Keep this file as
// a no-op emergency brake: if PREVIEW_PASSWORD is ever set again, the
// listed write / editor paths require a cookie with that password while
// everything else stays public by default.
//
// Why a denylist is OK here:
//   - the public read pages are, by design, shareable to anyone
//   - what we actually need to protect is spend (OpenAI-backed APIs)
//     and write surface (service_role backed sync). Those live on
//     specific, stable path prefixes (/studio, /api/ai, /api/sync,
//     /api/migrate) that never contain user-generated segments
//   - M2 auth now protects /studio via app/studio/layout.tsx and protects
//     write / AI routes via gateApiRequest()
//
// If you add a new sensitive prefix later, remember to add it to
// GATED_PREFIXES below, and ship it in the same PR as the feature
// that introduces the spend / write surface.

import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  normalizeLocale,
  stripLocalePrefix,
} from "@/lib/i18n";

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
  const { pathname } = req.nextUrl;
  const prefixed = stripLocalePrefix(pathname);
  const cookieLocale = normalizeLocale(req.cookies.get(LOCALE_COOKIE)?.value);
  const negotiated =
    prefixed.locale ??
    cookieLocale ??
    localeFromAcceptLanguage(req.headers.get("accept-language")) ??
    DEFAULT_LOCALE;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-lc-locale", negotiated);

  let localeResponse: NextResponse | null = null;
  if (prefixed.locale) {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = prefixed.pathname;
    localeResponse = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
    localeResponse.cookies.set(LOCALE_COOKIE, prefixed.locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const password = process.env.PREVIEW_PASSWORD;
  if (!password) {
    return (
      localeResponse ??
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  if (!shouldGate(prefixed.pathname)) {
    return (
      localeResponse ??
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  // Already authenticated? Let through.
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value === password) {
    return (
      localeResponse ??
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

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
