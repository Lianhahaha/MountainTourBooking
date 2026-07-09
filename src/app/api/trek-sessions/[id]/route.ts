import { NextRequest, NextResponse } from "next/server";
import {
  getTrekSessionById,
  saveTrekSession,
  deleteTrekSession,
  sessionConflictExists,
} from "@/lib/trek-sessions-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getTrekSessionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = {
      ...existing,
      date: body.date?.trim() ?? existing.date,
      time: body.time?.trim() ?? existing.time,
      maxSlots: body.maxSlots ?? existing.maxSlots,
      notes: body.notes?.trim() ?? existing.notes,
      status: body.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    if (updated.maxSlots < updated.bookedCount) {
      return NextResponse.json(
        { error: `Max slots cannot be less than current bookings (${updated.bookedCount})` },
        { status: 400 }
      );
    }

    if (updated.maxSlots < 1) {
      return NextResponse.json({ error: "Max slots must be at least 1" }, { status: 400 });
    }

    if (!updated.date || !updated.time) {
      return NextResponse.json({ error: "Date and time are required" }, { status: 400 });
    }

    // Block if another active session already occupies the new date + time
    if (await sessionConflictExists(updated.date, updated.time, id)) {
      return NextResponse.json(
        { error: "Another hiking day already exists for this date and time" },
        { status: 409 }
      );
    }

    if (updated.bookedCount >= updated.maxSlots) {
      updated.status = "full";
    } else if (updated.status === "full" && updated.bookedCount < updated.maxSlots) {
      updated.status = "open";
    }

    const result = await saveTrekSession(updated);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteTrekSession(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
