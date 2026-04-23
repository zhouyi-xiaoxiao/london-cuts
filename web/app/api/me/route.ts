// GET /api/me — thin wrapper around getCurrentUser().
//
// Used by client components (e.g. the onboarding page, studio header /
// user menu) to find out "am I signed in, and if so, what's my public
// profile?". Mirrors the shape of `Session` from lib/auth.ts so the
// client gets a single source of truth.
//
// Always returns 200. `user` is null when not signed in — distinguishing
// "unauthenticated visitor" from "server error" is useful for UIs that
// conditionally render a Sign-in link instead of an error banner.
//
// M2 PR 3. Kept tiny on purpose; adding profile PATCH later belongs in
// a sibling file or a focused PR.

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    return NextResponse.json({ user: session });
  } catch (err) {
    // getCurrentUser() should never throw under normal use (it returns
    // null for the anon case). A throw here means Supabase config is
    // missing or the SSR cookie layer blew up — surface it as a 500 so
    // the client can show something useful instead of a silent "not
    // signed in" state.
    const msg = err instanceof Error ? err.message : "failed to load session";
    return NextResponse.json({ user: null, error: msg }, { status: 500 });
  }
}
