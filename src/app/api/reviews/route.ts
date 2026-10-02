import { NextRequest, NextResponse } from "next/server";
import { getAllReviewsStrict, isReviewStatus, updateReviewStatus } from "@/lib/reviews";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * Owner dashboard: every review, newest first.
 * 200 { reviews, error: null } · 401/500 { reviews: [], error }
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ reviews: [], error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviews = await getAllReviewsStrict();
    return NextResponse.json(
      { reviews, error: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("Could not load reviews:", e);
    return NextResponse.json(
      { reviews: [], error: "Couldn't reach the reviews database." },
      { status: 500 }
    );
  }
}

/**
 * Owner dashboard: set any status, including back to "pending" (used by Undo,
 * which /api/reviews/approve cannot do).
 * Body { id, status: "pending" | "approved" | "rejected" } → { ok } / { ok: false, error }
 */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const { id, status } = (body ?? {}) as { id?: unknown; status?: unknown };
  if (typeof id !== "string" || !id || !isReviewStatus(status)) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const result = await updateReviewStatus(id, status);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
