// Supabase client factory (M1). Two clients:
//   - `getServerClient()` — uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS.
//     Server-only. Safe to call from RSC / route handlers / migrations.
//   - `getBrowserClient()` — uses NEXT_PUBLIC_SUPABASE_ANON_KEY, respects RLS.
//     Safe for client bundles. Cached as a module-level singleton.
//
// Per repo seam discipline: `@supabase/supabase-js` is imported ONLY in this
// file + in `scripts/*.ts`. Every other `web/lib/*.ts` or component must
// use these factories (or the higher-level `lib/storage.ts`) so we can swap
// backends without fan-out.
//
// The browser client is intentionally unauthenticated in M1 — reads fall
// through RLS to the "public SELECT on published+public projects" policy.
// M2 will inject the Supabase Auth session (magic link) so writes land.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Browser client (anon key). Respects RLS. Cached per module load.
 * Call from "use client" components only.
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
      // M1: no user sessions yet. Don't persist anything; M2 flips this.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
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
