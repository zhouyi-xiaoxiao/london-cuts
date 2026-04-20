// Environment variables. Real validation (Zod) lands when Supabase is wired in M1.
// See ../docs/architecture.md#environment-variables

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
  SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
