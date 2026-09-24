import { NextRequest, NextResponse } from "next/server";
import {
  getTrekSessionById,
  saveTrekSession,
  deleteTrekSession,
  sessionConflictExists,
} from "@/lib/trek-sessions-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { todayInManila } from "@/lib/utils";

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

    if (
      body.status !== undefined &&
      body.status !== "open" &&
      body.status !== "full" &&
      body.status !== "cancelled"
    ) {
      return NextResponse.json(
        { error: "Status must be open, full, or cancelled" },
        { status: 400 }
      );
    }

    if (
      body.price !== undefined &&
      body.price !== null &&
      (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0)
    ) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    const updated = {
      ...existing,
      date: body.date?.trim() ?? existing.date,
      time: body.time?.trim() ?? existing.time,
      maxSlots: body.maxSlots ?? existing.maxSlots,
      notes: body.notes?.trim() ?? existing.notes,
      price: body.price === null ? undefined : (body.price !== undefined ? body.price : existing.price),
      status: body.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    if (updated.maxSlots < updated.bookedCount) {
      return NextResponse.json(
        { error: `Max slots cannot be less than current bookings (${updated.bookedCount})` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(updated.maxSlots) || updated.maxSlots < 1) {
      return NextResponse.json({ error: "Max slots must be a whole number of at least 1" }, { status: 400 });
    }

    if (!updated.date || !updated.time) {
      return NextResponse.json({ error: "Date and time are required" }, { status: 400 });
    }

    const today = todayInManila();
    if (updated.date < today) {
      return NextResponse.json({ error: "Date cannot be in the past" }, { status: 400 });
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
  } catch (err) {
    console.error("Trek session PATCH error:", err);
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
  const existing = await getTrekSessionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.bookedCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a hiking day with active bookings. Cancel it instead." },
      { status: 400 }
    );
  }

  const result = await deleteTrekSession(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
