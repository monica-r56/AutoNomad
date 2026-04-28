const buckets = new Map<string, { tokens: number; lastRefill: number }>();

export interface RateLimitOptions {
  limit: number; // tokens per interval
  interval: number; // milliseconds
}

function refill(key: string, opts: RateLimitOptions) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: opts.limit, lastRefill: now };
  const delta = Math.max(0, now - bucket.lastRefill);
  const tokensToAdd = (delta / opts.interval) * opts.limit;
  bucket.tokens = Math.min(opts.limit, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
  buckets.set(key, bucket);
  return bucket;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRateLimit<T>(
  key: string,
  opts: RateLimitOptions,
  fn: () => Promise<T>
): Promise<T> {
  while (true) {
    const bucket = refill(key, opts);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      buckets.set(key, bucket);
      return fn();
    }
    await wait(Math.max(50, opts.interval / opts.limit));
  }
}
