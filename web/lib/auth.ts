// Authentication seam — M2 real implementation backed by Supabase Auth.
//
// Flow:
//   1. User visits /sign-in, enters email → POST /api/auth/send-magic-link
//   2. We email them a one-time login link via Supabase Auth (OTP).
//   3. They click the link → /auth/callback → exchangeCodeForSession →
//      session cookie set → redirect to /onboarding or /studio.
//   4. Subsequent requests call getCurrentUser() / requireUser() which
//      read the session cookie via the SSR-aware Supabase client.
//
// Public-page reads continue to work without a session (SSR uses anon
// key + the "published + visibility=public" RLS policy). Only /studio
// + write-side API routes require a user. See the deferred design doc
// at tasks/deferred/M2-auth-and-invites.md for the full plan.

import "server-only";

import { createClient } from "@supabase/supabase-js";

import { AuthRequiredError, OnboardingRequiredError, AdminRequiredError } from "./errors";
import { getUserServerClient } from "./supabase-server";

export interface UserProfile {
  /** `public.users.id` — our internal UUID, used as owner_id on projects. */
  id: string;
  /** URL-safe handle, displayed in `/@handle/slug` public URLs. */
  handle: string;
  displayName: string | null;
  isAdmin: boolean;
  /** Corresponds to `auth.users.id` — Supabase Auth identity. */
  authUserId: string;
  email: string;
}

export interface Session {
  /** Raw Supabase `auth.users.id`. Populated whenever there's a valid session. */
  authUserId: string;
  email: string;
  /** `public.users` row. NULL until the user finishes onboarding
   *  (picks a handle + redeems an invite). */
  profile: UserProfile | null;
}

/**
 * Read the current user from the session cookie. Returns `null` when
 * the visitor is not signed in. Does not throw.
 */
export async function getCurrentUser(): Promise<Session | null> {
  const supabase = await getUserServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, handle, display_name, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    authUserId: user.id,
    email: user.email ?? "",
    profile: profile
      ? {
          id: profile.id as string,
          handle: profile.handle as string,
          displayName: (profile.display_name as string | null) ?? null,
          isAdmin: Boolean(profile.is_admin),
          authUserId: user.id,
          email: user.email ?? "",
        }
      : null,
  };
}

/** Throws `AuthRequiredError` if not signed in. */
export async function requireUser(): Promise<Session> {
  const s = await getCurrentUser();
  if (!s) throw new AuthRequiredError();
  return s;
}

/** Throws if not signed in, or signed in but not onboarded. */
export async function requireOnboardedUser(): Promise<
  Session & { profile: UserProfile }
> {
  const s = await requireUser();
  if (!s.profile) throw new OnboardingRequiredError();
  return { ...s, profile: s.profile };
}

/** Throws if not signed in, not onboarded, or not `is_admin`. */
export async function requireAdmin(): Promise<
  Session & { profile: UserProfile }
> {
  const s = await requireOnboardedUser();
  if (!s.profile.isAdmin) throw new AdminRequiredError();
  return s;
}

/**
 * Send a magic link to the given email. Wraps Supabase Auth OTP sign-in.
 * The `emailRedirectTo` is where the link in the email points — the
 * callback route resolves the code into a session.
 *
 * Important beta detail: do NOT use `getUserServerClient()` here. The
 * `@supabase/ssr` client hardcodes PKCE; those links only work if the
 * recipient opens the email in the exact browser/storage context that
 * requested the link. External beta invites often open mail links in a
 * different browser, which surfaces "PKCE code verifier not found".
 *
 * Use Supabase's implicit OTP flow for emailed links instead. The
 * callback page already handles the resulting `#access_token=...` hash
 * and persists the session into SSR cookies via `setSession()`.
 */
export async function sendMagicLink(
  email: string,
  emailRedirectTo: string,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "sendMagicLink: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });
  if (error) throw new Error(error.message);
}

/**
 * End the current session. Called from the user menu "sign out" button.
 * Client-side via the browser client. Server-side sign-out is also
 * possible but this is fine for our flow.
 */
export async function signOut(): Promise<void> {
  const supabase = await getUserServerClient();
  await supabase.auth.signOut();
}
