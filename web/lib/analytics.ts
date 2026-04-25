// Product analytics seam. Wraps PostHog.
// M-fast: no-op with dev console logging.
// M5: real PostHog instrumentation.

export function track(event: string, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, props);
  }
}

export function identify(
  userId: string,
  props?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics] identify", userId, props);
  }
}
