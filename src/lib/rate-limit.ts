/**
 * Simple in-memory sliding-window rate limiter for public API routes.
 * Note: per-instance only — on serverless each instance has its own map,
 * which still slows distributed abuse without extra infrastructure.
 */
const BUCKETS = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 20_000;

const DEFAULT_MAX = 10;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 1000;

let lastPrune = 0;

function isExpired(entry: { resetAt: number }, now: number): boolean {
  return now > entry.resetAt;
}

/** Keeps a rotating-IP flood from growing the map without bound. */
function pruneBuckets(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [id, entry] of BUCKETS) {
    if (isExpired(entry, now)) BUCKETS.delete(id);
  }
  if (BUCKETS.size <= MAX_BUCKETS) return;
  const excess = BUCKETS.size - MAX_BUCKETS;
  let removed = 0;
  for (const id of BUCKETS.keys()) {
    if (removed >= excess) break;
    BUCKETS.delete(id);
    removed++;
  }
}

export function isRateLimited(
  namespace: string,
  key: string,
  max: number = DEFAULT_MAX
): boolean {
  const id = `${namespace}:${key}`;
  const entry = BUCKETS.get(id);
  const now = Date.now();
  if (!entry) return false;
  if (isExpired(entry, now)) {
    BUCKETS.delete(id);
    return false;
  }
  return entry.count >= max;
}

export function hitRateLimit(
  namespace: string,
  key: string,
  windowMs: number = DEFAULT_WINDOW_MS
): void {
  const id = `${namespace}:${key}`;
  const now = Date.now();
  pruneBuckets(now);
  const entry = BUCKETS.get(id);
  if (!entry || isExpired(entry, now)) {
    BUCKETS.set(id, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
}

export function clearRateLimit(namespace: string, key: string): void {
  BUCKETS.delete(`${namespace}:${key}`);
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
