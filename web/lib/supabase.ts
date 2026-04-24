// Supabase client factory. Two browser-safe clients live here; the
// SSR cookie-aware `getUserServerClient()` lives in a sibling file
// (`lib/supabase-server.ts`) so this module can be imported from
// "use client" components without dragging `next/headers` into the
// client bundle.
//
//   - `getServerClient()` — uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS.
//     Server-only at runtime (we guard the env read), but the MODULE
//     has no `next/headers` import, so client components that also
//     import from here (for `getBrowserClient`) don't cause a build
//     error.
//   - `getBrowserClient()` — uses NEXT_PUBLIC_SUPABASE_ANON_KEY, respects
//     RLS. Safe for client bundles. Cached as a module-level singleton.
//
// Seam discipline: `@supabase/supabase-js` is imported ONLY in this
// file + `lib/supabase-server.ts` + `scripts/*.ts`. Every other
// `web/lib/*.ts` or component must use these factories so we can swap
// backends without fan-out.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
 * Server client (service_role key). Bypasses RLS.
 *
 * Runtime-server-only: the env read throws if `SUPABASE_SERVICE_ROLE_KEY`
 * isn't set, which it never is on the client. Importing this function
 * from client code is safe (no `next/headers` taint here); calling it
 * from client code at runtime would throw.
 *
 * Not cached at module level because server-side code can run in multiple
 * contexts (RSC, API handler, cron); each gets a fresh client so that
 * future per-request auth context can be injected without mutating a
 * shared singleton.
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

// Note: `getUserServerClient()` lives in `./supabase-server.ts`. We do
// NOT re-export it here because Next.js traces re-exports and would
// pull `next/headers` into every client bundle that imports anything
// from this file. Call sites that need the SSR cookie-aware client
// import directly from "@/lib/supabase-server".
