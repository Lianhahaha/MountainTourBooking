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

    const supabaseResult = await saveContactToSupabase({ name, email, phone, message });
    if (!supabaseResult.ok) {
      const fileResult = await saveContactToFile({ name, email, phone, message });
      if (!fileResult.ok) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
      }
    }

    await sendContactEmail({ name, email, phone, message });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
