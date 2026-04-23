// Supabase client factory. Three clients:
//   - `getServerClient()` — uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS.
//     Server-only. Safe to call from RSC / route handlers / migrations.
//   - `getBrowserClient()` — uses NEXT_PUBLIC_SUPABASE_ANON_KEY, respects RLS.
//     Safe for client bundles. Cached as a module-level singleton.
//   - `getUserServerClient()` — (M2) SSR auth-aware client that reads the
//     user's session cookies via `@supabase/ssr`. Use from server components
//     + route handlers + middleware when you need `auth.uid()` to resolve.
//
// Per repo seam discipline: `@supabase/supabase-js` + `@supabase/ssr` are
// imported ONLY in this file + in `scripts/*.ts`. Every other `web/lib/*.ts`
// or component must use these factories (or the higher-level `lib/storage.ts`
// / `lib/auth.ts`) so we can swap backends without fan-out.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

let browserClient: SupabaseClient | null = null;

/**
 * Browser client (anon key). Respects RLS. Cached per module load.
 * Call from "use client" components only. M2 flipped this to persist
 * sessions + detect callback codes so magic-link sign-in works.
 */
export function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "getBrowserClient: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

/**
 * Server client (service_role key). Bypasses RLS. Server-only.
 * Not cached at module level because server-side code can run in multiple
 * contexts (RSC, API handler, cron); each gets a fresh client so that
 * future per-request auth context can be injected without mutating a shared
 * singleton.
 *
 * NEVER call from code that runs in the browser — the service_role key
 * must not cross the network to the client bundle.
 */
export function getServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "getServerClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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

/**
 * True when Supabase env vars are present. Use in seam code to decide
 * whether to hit the backend or fall back to the legacy Zustand path.
 * M-preview users without a .env.local stay on the client-only flow.
 */
export function hasSupabaseConfig(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
