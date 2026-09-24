import { NextRequest, NextResponse } from "next/server";
import {
  getAllTrekSessions,
  saveTrekSession,
  slugifySessionDate,
} from "@/lib/trek-sessions-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { todayInManila } from "@/lib/utils";
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
      price?: number;
      notes?: string;
    };

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: "Select at least one date" }, { status: 400 });
    }

    if (!time?.trim() || !maxSlots || !Number.isInteger(maxSlots) || maxSlots < 1) {
      return NextResponse.json(
        { error: "Time and max slots (whole number ≥ 1) are required" },
        { status: 400 }
      );
    }

    if (
      price !== undefined &&
      price !== null &&
      (typeof price !== "number" || !Number.isFinite(price) || price < 0)
    ) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }

    const today = todayInManila();
    const existing = await getAllTrekSessions();
    // Build a set of "date|normalizedTime" keys for all non-cancelled sessions
    const normalizedTime = time.trim().toLowerCase();
    const existingKeys = new Set(
      existing
        .filter((s) => s.status !== "cancelled")
        .map((s) => `${s.date}|${s.time.trim().toLowerCase()}`)
    );
    // Slug IDs can collide when different time strings normalize the same,
    // which would overwrite an active session document. Cancelled docs may be
    // overwritten (re-adding that slot).
    const existingIds = new Set(
      existing.filter((s) => s.status !== "cancelled").map((s) => s.id)
    );

    const created: TrekSession[] = [];
    const skipped: { date: string; reason: string }[] = [];
    const now = new Date().toISOString();
    const trimmedTime = time.trim();
    const trimmedNotes = notes?.trim() ?? "";

    for (const rawDate of dates) {
      const date = typeof rawDate === "string" ? rawDate.trim() : "";
      if (!date) continue;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        skipped.push({ date, reason: "Invalid date format" });
        continue;
      }

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
      if (existingIds.has(id)) {
        skipped.push({ date, reason: "Already scheduled for this time" });
        continue;
      }

      const session: TrekSession = {
        id,
        date,
        time: trimmedTime,
        maxSlots,
        bookedCount: 0,
        status: "open",
        ...(typeof price === "number" ? { price } : {}),
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
      existingIds.add(id);
      created.push(session);
    }

    if (created.length === 0) {
      console.error("Bulk add failed. Skipped reasons:", skipped);
      const reasons = Array.from(new Set(skipped.map((s) => s.reason))).join(", ");
      return NextResponse.json(
        { error: `No hiking days were added. Reasons: ${reasons}`, skipped },
        { status: 400 }
      );
    }

    return NextResponse.json({ created, skipped }, { status: 201 });
  } catch (err) {
    console.error("Trek session bulk POST error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
