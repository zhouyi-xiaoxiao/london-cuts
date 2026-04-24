// Server-only Supabase helper — lives in its own file so we can tag
// it with `server-only` and keep `next/headers` out of the client
// bundle. `lib/supabase.ts` re-exports `getUserServerClient` for
// back-compat so existing imports don't break.
//
// Why the split: turbopack errors the build with
// "You're importing a module that depends on `next/headers`" when a
// "use client" component transitively imports a module that imports
// `next/headers`. The `/auth/callback/page.tsx` is a client component
// that needs `getBrowserClient`. Without this split, their shared
// parent module (`lib/supabase.ts`) drags `next/headers` into every
// client bundle.

import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * M2 — auth-aware server client. Reads the user's session from cookies
 * via `@supabase/ssr`. Use this when you need RLS policies to evaluate
 * with `auth.uid()` populated (i.e. from the signed-in user's perspective).
 *
 * Safe to call from route handlers / server components / server actions.
 * Returns a client that:
 *   - respects RLS
 *   - sees `auth.uid()` as whoever holds the current session cookie
 *   - sees `null` user when not signed in
 *
 * Cookie mutation (setAll) is a no-op inside plain server components —
 * Next's cookies() is readonly there. Route handlers + middleware CAN
 * set cookies, and this client's refresh logic works there. We swallow
 * the error silently so RSC callers don't crash.
 */
export async function getUserServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "getUserServerClient: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
      ) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Read-only in server components — Next will use the
          // middleware / route-handler cookies for refresh instead.
        }
      },
    },
  });
}
