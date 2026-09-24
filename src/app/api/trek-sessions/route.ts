import { NextRequest, NextResponse } from "next/server";
import {
  getAllTrekSessions,
  getAvailableTrekSessions,
  saveTrekSession,
  slugifySessionDate,
  sessionConflictExists,
} from "@/lib/trek-sessions-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { todayInManila } from "@/lib/utils";
import type { TrekSession } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await isAdminAuthenticated();
  const { searchParams } = new URL(request.url);
  const availableOnly = searchParams.get("available") === "true";

  // Full list (no available=true) is only used by the admin panel.
  if (!availableOnly && !admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (admin && !availableOnly) {
    const sessions = await getAllTrekSessions();
    return NextResponse.json(sessions);
  }

  const sessions = await getAvailableTrekSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, time, maxSlots, notes, price } = body as {
      date?: string;
      time?: string;
      maxSlots?: number;
      price?: number;
      notes?: string;
    };

    if (!date?.trim() || !time?.trim() || !maxSlots || !Number.isInteger(maxSlots) || maxSlots < 1) {
      return NextResponse.json(
        { error: "Date, time, and max slots (whole number ≥ 1) are required" },
        { status: 400 }
      );
    }

    const today = todayInManila();
    if (date.trim() < today) {
      return NextResponse.json(
        { error: "Date cannot be in the past" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = slugifySessionDate(date, time);

    // Block if any active session already uses this date + time
    if (await sessionConflictExists(date.trim(), time.trim())) {
      return NextResponse.json(
        { error: "A hiking day already exists for this date and time" },
        { status: 409 }
      );
    }

    const session: TrekSession = {
      id,
      date: date.trim(),
      time: time.trim(),
      maxSlots,
      bookedCount: 0,
      status: "open",
      ...(typeof price === "number" ? { price } : {}),
      notes: notes?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await saveTrekSession(session);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("Trek session POST error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
