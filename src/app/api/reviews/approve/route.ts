import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus } from "@/lib/reviews";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!(await isAdminAuthenticated())) {
    // Form posts from the admin UI should bounce to login, not show raw JSON.
    if (!isJson) {
      return new NextResponse(null, {
        status: 302,
        headers: { Location: "/admin/login" },
      });
    }
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let id: string | undefined;
  let status: string | undefined;

  if (isJson) {
    const body = await req.json();
    id = body.id;
    status = body.status;
  } else {
    const formData = await req.formData();
    id = formData.get("id") as string | null ?? undefined;
    status = formData.get("status") as string | null ?? undefined;
  }

  if (!id || (status !== "approved" && status !== "rejected")) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const result = await updateReviewStatus(id, status);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  // For form submissions (from the admin UI), redirect back to the reviews page
  if (!isJson) {
    return new NextResponse(null, {
      status: 302,
      headers: { Location: "/admin/reviews" },
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
