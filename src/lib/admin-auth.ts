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
  if (!expected) return false;
  return password === expected;
}

export { ADMIN_COOKIE };
