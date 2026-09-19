import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus } from "@/lib/reviews";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();

  if (!id || (status !== "approved" && status !== "rejected")) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const result = await updateReviewStatus(id, status);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
