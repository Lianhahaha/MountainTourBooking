import { NextRequest, NextResponse } from "next/server";
import { saveReview } from "@/lib/reviews";
import { isRateLimited, hitRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (isRateLimited("reviews", ip, 5)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }
  hitRateLimit("reviews", ip, 10 * 60 * 1000);

  try {
    const body = await req.json();
    const { bookingId, leadName, tripTitle, rating, comment } = body;

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof comment !== "string" ||
      !comment.trim() ||
      comment.length > 2000 ||
      typeof leadName !== "string" ||
      !leadName.trim() ||
      leadName.length > 100 ||
      (bookingId !== undefined &&
        (typeof bookingId !== "string" || bookingId.length > 100)) ||
      (tripTitle !== undefined &&
        (typeof tripTitle !== "string" || tripTitle.length > 200))
    ) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
    }

    const result = await saveReview({
      bookingId: bookingId ?? "",
      leadName: leadName.trim(),
      tripTitle: tripTitle ?? "",
      rating,
      comment: comment.trim(),
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Review submit error:", err);
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
