import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE = "laagta_admin";

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Tamper-proof session token derived from the admin password. */
export function createAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return "";
  return createHmac("sha256", secret).update("laagta-admin-session").digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expected = createAdminToken();
  if (!expected || token.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;

  // Constant-time compare so response time does not leak password prefix.
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    // Still perform a compare of equal-length buffers to keep timing uniform.
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

// Simple in-memory rate limit: max 10 failed attempts per IP per 15 minutes.
const FAILED_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000;

/** Drop expired entries (and oldest overflow) so the map cannot grow forever. */
function pruneFailedAttempts(now: number): void {
  for (const [ip, entry] of FAILED_ATTEMPTS) {
    if (now > entry.resetAt) FAILED_ATTEMPTS.delete(ip);
  }
  if (FAILED_ATTEMPTS.size > MAX_TRACKED_IPS) {
    const excess = FAILED_ATTEMPTS.size - MAX_TRACKED_IPS;
    let removed = 0;
    for (const ip of FAILED_ATTEMPTS.keys()) {
      if (removed >= excess) break;
      FAILED_ATTEMPTS.delete(ip);
      removed++;
    }
  }
}

export function isLoginRateLimited(ip: string): boolean {
  const entry = FAILED_ATTEMPTS.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    FAILED_ATTEMPTS.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  pruneFailedAttempts(now);
  const entry = FAILED_ATTEMPTS.get(ip);
  if (!entry || now > entry.resetAt) {
    FAILED_ATTEMPTS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearFailedLogins(ip: string): void {
  FAILED_ATTEMPTS.delete(ip);
}

export { ADMIN_COOKIE };
