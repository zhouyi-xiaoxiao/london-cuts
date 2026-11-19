// Public pages read published stories from the database and fall back to the
// bundled demo stories when it has nothing for them. If the database is slow
// or unreachable, that fallback must not keep a reader waiting: a lookup gets
// a short time to answer, and after one miss the following lookups skip the
// database for a while and go straight to the fallback.

const LOOKUP_TIMEOUT_MS = 2500;
const SKIP_AFTER_MISS_MS = 2 * 60_000;

let skipUntil = 0;

const TIMED_OUT = Symbol("live-lookup-timed-out");

export async function withLiveLookupGuard<T>(
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (Date.now() < skipUntil) return fallback;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), LOOKUP_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([run(), timeout]);
    if (result === TIMED_OUT) {
      skipUntil = Date.now() + SKIP_AFTER_MISS_MS;
      return fallback;
    }
    return result as T;
  } catch {
    skipUntil = Date.now() + SKIP_AFTER_MISS_MS;
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Test hook: forget an earlier miss. */
export function resetLiveLookupGuard(): void {
  skipUntil = 0;
}
