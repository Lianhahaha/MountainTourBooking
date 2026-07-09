import { NextRequest, NextResponse } from "next/server";
import {
  getAllTrekSessions,
  saveTrekSession,
  slugifySessionDate,
} from "@/lib/trek-sessions-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { TrekSession } from "@/types";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dates, time, maxSlots, notes, price } = body as {
      dates?: string[];
      time?: string;
      maxSlots?: number;
      maxSlots?: number;
      price?: number;
      notes?: string;
    };

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: "Select at least one date" }, { status: 400 });
    }

    if (!time?.trim() || !maxSlots || maxSlots < 1) {
      return NextResponse.json(
        { error: "Time and max slots are required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const existing = await getAllTrekSessions();
    // Build a set of "date|normalizedTime" keys for all non-cancelled sessions
    const normalizedTime = time.trim().toLowerCase();
    const existingKeys = new Set(
      existing
        .filter((s) => s.status !== "cancelled")
        .map((s) => `${s.date}|${s.time.trim().toLowerCase()}`)
    );

    const created: TrekSession[] = [];
    const skipped: { date: string; reason: string }[] = [];
    const now = new Date().toISOString();
    const trimmedTime = time.trim();
    const trimmedNotes = notes?.trim() ?? "";

    for (const rawDate of dates) {
      const date = rawDate.trim();
      if (!date) continue;

      if (date < today) {
        skipped.push({ date, reason: "Date is in the past" });
        continue;
      }

      const conflictKey = `${date}|${normalizedTime}`;
      if (existingKeys.has(conflictKey)) {
        skipped.push({ date, reason: "Already scheduled for this time" });
        continue;
      }

      const id = slugifySessionDate(date, trimmedTime);

      const session: TrekSession = {
        id,
        date,
        time: trimmedTime,
        maxSlots,
        bookedCount: 0,
        status: "open",
        price: typeof price === "number" ? price : undefined,
        notes: trimmedNotes,
        createdAt: now,
        updatedAt: now,
      };

      const result = await saveTrekSession(session);
      if (!result.ok) {
        skipped.push({ date, reason: result.error ?? "Failed to save" });
        continue;
      }

      existingKeys.add(conflictKey);
      created.push(session);
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: "No hiking days were added", skipped },
        { status: 400 }
      );
    }

    return NextResponse.json({ created, skipped }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
