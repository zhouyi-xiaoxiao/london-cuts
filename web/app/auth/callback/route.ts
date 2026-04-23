// M2 auth callback.
//
// The magic link in the user's email points here with a `code` query
// param. We exchange the code for a session cookie (via Supabase Auth)
// and then redirect:
//   - to /onboarding if the user has NO public.users row yet
//     (first-time sign-in — they need to pick a handle + redeem an
//     invite code)
//   - to /studio otherwise
//
// Uses the SSR server client so `setAll` on the cookie store actually
// persists the Supabase session cookies (auth-token etc.) — these are
// what subsequent requireUser() calls will read.

import { NextResponse } from "next/server";

import { getUserServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "";

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?e=missing-code", url.origin),
    );
  }

  const supabase = await getUserServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?e=${encodeURIComponent(error.message)}`,
        url.origin,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/sign-in?e=no-user", url.origin),
    );
  }

  // Has this user done onboarding (handle + display_name)?
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const destination = profile
    ? next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/studio"
    : "/onboarding";

  return NextResponse.redirect(new URL(destination, url.origin));
}
