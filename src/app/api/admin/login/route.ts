import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createAdminToken,
  isLoginRateLimited,
  recordFailedLogin,
  clearFailedLogins,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_PASSWORD in .env.local" },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isLoginRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    if (!verifyAdminPassword(password)) {
      recordFailedLogin(ip);
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    clearFailedLogins(ip);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
