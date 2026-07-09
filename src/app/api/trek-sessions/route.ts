import { NextRequest, NextResponse } from "next/server";
import {
  getAllTrekSessions,
  getAvailableTrekSessions,
  saveTrekSession,
  slugifySessionDate,
  sessionConflictExists,
} from "@/lib/trek-sessions-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { TrekSession } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await isAdminAuthenticated();
  const { searchParams } = new URL(request.url);
  const availableOnly = searchParams.get("available") === "true";

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
      maxSlots?: number;
      price?: number;
      notes?: string;
    };

    if (!date?.trim() || !time?.trim() || !maxSlots || maxSlots < 1) {
      return NextResponse.json(
        { error: "Date, time, and max slots are required" },
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
      price: typeof price === "number" ? price : undefined,
      notes: notes?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await saveTrekSession(session);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
