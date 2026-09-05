/**
 * Fixed-window in-process rate limiter.
 *
 * Caveat: state lives in the Node process memory, so on a multi-instance or
 * serverless deployment the effective limit is per instance. It still blocks
 * naive brute-force and mail-flood attempts. Swap for Upstash/Redis if the
 * site is scaled horizontally.
 */

const buckets = new Map();
const MAX_TRACKED_KEYS = 10000;

function prune(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) prune(now);

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}

export function resetRateLimit(key) {
  buckets.delete(key);
}

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
