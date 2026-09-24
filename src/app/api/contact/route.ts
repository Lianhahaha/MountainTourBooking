import { NextRequest, NextResponse } from "next/server";
import { saveContactToSupabase } from "@/lib/supabase";
import { saveContactToFile } from "@/lib/bookings-file";
import { sendContactEmail } from "@/lib/email";
import { isRateLimited, hitRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (isRateLimited("contact", ip, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 }
    );
  }
  hitRateLimit("contact", ip, 5, 10 * 60 * 1000);

  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !phone || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json({ error: "Invalid field types" }, { status: 400 });
    }

    const limits: Array<[string, string, number]> = [
      ["name", name, 100],
      ["email", email, 254],
      ["phone", phone, 30],
      ["message", message, 5000],
    ];
    for (const [field, value, max] of limits) {
      if (value.length > max) {
        return NextResponse.json(
          { error: `${field} must be at most ${max} characters` },
          { status: 400 }
        );
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const supabaseResult = await saveContactToSupabase({ name, email, phone, message });
    if (!supabaseResult.ok) {
      const fileResult = await saveContactToFile({ name, email, phone, message });
      if (!fileResult.ok) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
      }
    }

    // The message is already persisted at this point — an email failure must
    // not surface as a 500, or the client shows an error and resubmits a
    // duplicate message.
    let emailSent = false;
    try {
      emailSent = await sendContactEmail({ name, email, phone, message });
    } catch (err) {
      console.error("Contact email failed:", err);
    }
    if (!emailSent) {
      console.warn("Contact email not sent (missing key or provider error)");
    }

    return NextResponse.json({ ok: true, emailSent });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
