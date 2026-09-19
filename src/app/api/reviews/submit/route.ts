import { NextRequest, NextResponse } from "next/server";
import { saveReview } from "@/lib/reviews";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookingId, leadName, tripTitle, rating, comment } = body;

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    !comment ||
    !leadName
  ) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const result = await saveReview({ bookingId, leadName, tripTitle, rating, comment });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
