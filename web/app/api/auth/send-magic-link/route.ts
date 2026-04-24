// POST /api/auth/send-magic-link — send a one-time login link to an email.
//
// Called from the /sign-in page's form. Uses the auth seam
// (`lib/auth.ts::sendMagicLink`) which wraps Supabase Auth's OTP.
//
// The emailRedirectTo is built from the incoming request's origin so
// localhost dev, london-cuts.vercel.app, and the future custom domain
// all route the magic link back to the same host that initiated it.
//
// M2 PR 2. Supabase Auth handles the actual per-recipient and project-level
// email throttle. Production uses custom SMTP via Resend.

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
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(
    next ?? "/studio",
  )}`;

  try {
    await sendMagicLink(email, callbackUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send failed";
    if (msg.toLowerCase().includes("rate limit")) {
      return NextResponse.json(
        {
          error:
            "Email sending is temporarily limited. Please wait a little, then request a new magic link.",
          code: "email_rate_limited",
        },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
