import { NextRequest, NextResponse } from "next/server";
import { saveContactToSupabase } from "@/lib/supabase";
import { saveContactToFile } from "@/lib/bookings-file";
import { sendContactEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
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

    try {
      await sendContactEmail({ name, email, phone, message });
    } catch (err) {
      console.error("Contact email failed:", err);
      return NextResponse.json(
        { error: "Message saved, but email notification failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
