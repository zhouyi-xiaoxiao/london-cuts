// Environment variables. Real validation (Zod) lands when Supabase is wired in M1.
// See ../docs/architecture.md#environment-variables

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  /** Max cents we're willing to spend on OpenAI image generation. Default $8. */
  OPENAI_SPEND_CAP_CENTS: process.env.OPENAI_SPEND_CAP_CENTS ?? "800",
  /** "true" = return mock placeholder images, never call OpenAI. */
  AI_PROVIDER_MOCK: process.env.AI_PROVIDER_MOCK ?? "true",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  OWNER_NOTIFY_EMAIL: process.env.OWNER_NOTIFY_EMAIL ?? "",
  TRANSACTIONAL_FROM_EMAIL:
    process.env.TRANSACTIONAL_FROM_EMAIL ??
    "London Cuts <no-reply@auth.zhouyixiaoxiao.org>",
  POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
  SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
