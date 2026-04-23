// POST /api/auth/send-magic-link — send a one-time login link to an email.
//
// Called from the /sign-in page's form. Uses the auth seam
// (`lib/auth.ts::sendMagicLink`) which wraps Supabase Auth's OTP.
//
// The emailRedirectTo is built from the incoming request's origin so
// localhost dev, london-cuts.vercel.app, and the future custom domain
// all route the magic link back to the same host that initiated it.
//
// M2 PR 2. No per-user rate limiting yet (Supabase has its own throttle
// at ~3 mails/hour per address). PR 4 adds the per-user daily caps for
// the AI surface.

import { NextResponse } from "next/server";

import { sendMagicLink } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; next?: string };
  try {
    body = (await req.json()) as { email?: string; next?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "a valid email is required" },
      { status: 400 },
    );
  }

  // Callback redirect — preserve optional ?next= so users land back where
  // they intended after signing in.
  const origin = new URL(req.url).origin;
  const next =
    typeof body.next === "string" &&
    body.next.startsWith("/") &&
    !body.next.startsWith("//")
      ? body.next
      : null;
  const callbackUrl = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`;

  try {
    await sendMagicLink(email, callbackUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
