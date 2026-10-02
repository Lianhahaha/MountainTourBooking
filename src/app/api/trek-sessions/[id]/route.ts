import { NextRequest, NextResponse } from "next/server";
import type { TrekSession } from "@/types";
import {
  getTrekSessionById,
  deleteTrekSession,
  sessionConflictExists,
  updateTrekSession,
} from "@/lib/trek-sessions-file";
import { getAllBookingsResult, updateBookingStatus } from "@/lib/bookings";
import { sendBookingCancelledEmail } from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatDate, todayInManila } from "@/lib/utils";

/**
 * Edit a hiking day (date, time, slots, price, notes), or cancel it with
 * `{ status: "cancelled", reason? }`. Cancelling also cancels every active
 * booking on that day and emails each group.
 */
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
    return NextResponse.json({ error: "Hiking day not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.status !== undefined) {
    if (body.status !== "cancelled") {
      return NextResponse.json({ error: "Only cancelling a hiking day is supported" }, { status: 400 });
    }
    return cancelSession(existing, typeof body.reason === "string" ? body.reason.trim() : "");
  }

  return editSession(existing, body);
}

async function editSession(existing: TrekSession, body: Record<string, unknown>) {
  const today = todayInManila();
  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "Cancelled hiking days can't be edited." }, { status: 409 });
  }
  if (existing.date < today) {
    return NextResponse.json({ error: "Past hiking days can't be edited." }, { status: 409 });
  }

  const date = typeof body.date === "string" ? body.date.trim() : existing.date;
  const time = typeof body.time === "string" ? body.time.trim() : existing.time;
  const notes = typeof body.notes === "string" ? body.notes.trim() : existing.notes;
  const maxSlots = body.maxSlots === undefined ? existing.maxSlots : body.maxSlots;
  const price =
    body.price === null ? undefined : body.price === undefined ? existing.price : body.price;

  if (!date || !time) {
    return NextResponse.json({ error: "Date and time are required" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date must be in YYYY-MM-DD format" }, { status: 400 });
  }
  if (date < today) {
    return NextResponse.json({ error: "Date cannot be in the past" }, { status: 400 });
  }
  if (time.length > 50) {
    return NextResponse.json({ error: "Time must be at most 50 characters" }, { status: 400 });
  }
  if (notes.length > 1000) {
    return NextResponse.json({ error: "Notes must be at most 1000 characters" }, { status: 400 });
  }
  if (typeof maxSlots !== "number" || !Number.isInteger(maxSlots) || maxSlots < 1) {
    return NextResponse.json({ error: "Max slots must be a whole number of at least 1" }, { status: 400 });
  }
  if (price !== undefined && (typeof price !== "number" || !Number.isFinite(price) || price < 0)) {
    return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
  }

  const scheduleChanged =
    date !== existing.date || time.toLowerCase() !== existing.time.trim().toLowerCase();

  // Bookings keep their own copy of the date and time, and hikers were told
  // that schedule. Moving a booked day would silently strand them.
  if (scheduleChanged && existing.bookedCount > 0) {
    return NextResponse.json(
      {
        error: `${existing.bookedCount} people are booked on this day, so its date and time can't change. Add a new hiking day instead, or cancel this one to notify them.`,
      },
      { status: 409 }
    );
  }
  if (scheduleChanged && (await sessionConflictExists(date, time, existing.id))) {
    return NextResponse.json(
      { error: "Another hiking day already exists for this date and time" },
      { status: 409 }
    );
  }

  const result = await updateTrekSession(existing.id, (current) => {
    if (current.status === "cancelled") return { error: "Cancelled hiking days can't be edited." };
    if (scheduleChanged && current.bookedCount > 0) {
      return { error: "Someone just booked this day, so its date and time can't change." };
    }
    if (maxSlots < current.bookedCount) {
      return { error: `Max slots can't be lower than the ${current.bookedCount} people already booked.` };
    }
    const next: TrekSession = {
      ...current,
      date,
      time,
      notes,
      maxSlots,
      status: current.bookedCount >= maxSlots ? "full" : "open",
      updatedAt: new Date().toISOString(),
    };
    if (typeof price === "number") next.price = price;
    else delete next.price;
    return next;
  });

  if (!result.ok || !result.session) {
    return NextResponse.json({ error: result.error ?? "Update failed" }, { status: 409 });
  }
  return NextResponse.json(result.session);
}

async function cancelSession(existing: TrekSession, reason: string) {
  if (existing.status === "cancelled") {
    return NextResponse.json({ session: existing, cancelledBookings: 0, emailsSent: 0, failures: [] });
  }
  if (reason.length > 1000) {
    return NextResponse.json({ error: "Reason must be at most 1000 characters" }, { status: 400 });
  }

  // Read the bookings first. If we can't see them, we can't notify them, so
  // refuse rather than cancel the day behind the hikers' backs.
  const { bookings, error } = await getAllBookingsResult();
  if (error) {
    return NextResponse.json(
      { error: `${error} Nothing was cancelled. Try again in a moment.` },
      { status: 503 }
    );
  }

  const marked = await updateTrekSession(existing.id, (current) => ({
    ...current,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  }));
  if (!marked.ok || !marked.session) {
    return NextResponse.json({ error: marked.error ?? "Could not cancel the hiking day" }, { status: 500 });
  }

  const note =
    `Your hiking day on ${formatDate(existing.date)} (${existing.time}) has been cancelled.` +
    (reason ? `\n${reason}` : "");
  const affected = bookings.filter((b) => b.sessionId === existing.id && b.status !== "cancelled");

  let releasedPax = 0;
  let emailsSent = 0;
  const failures: { id: string; leadName: string; error: string }[] = [];

  for (const booking of affected) {
    const updated = await updateBookingStatus(booking.id, "cancelled", booking.status);
    if (!updated.ok || !updated.booking) {
      failures.push({ id: booking.id, leadName: booking.leadName, error: updated.error ?? "Update failed" });
      continue;
    }
    releasedPax += booking.paxCount;
    try {
      if (await sendBookingCancelledEmail(updated.booking, { ownerNote: note })) emailsSent += 1;
    } catch (err) {
      console.error("Failed to email cancelled booking", booking.id, err);
    }
  }

  // Cancelled bookings no longer hold slots on this day.
  const finalResult =
    releasedPax > 0
      ? await updateTrekSession(existing.id, (current) => ({
          ...current,
          bookedCount: Math.max(0, current.bookedCount - releasedPax),
          updatedAt: new Date().toISOString(),
        }))
      : marked;

  return NextResponse.json({
    session: finalResult.session ?? marked.session,
    cancelledBookings: affected.length - failures.length,
    emailsSent,
    failures,
  });
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
    return NextResponse.json({ error: "Hiking day not found" }, { status: 404 });
  }

  if (existing.bookedCount > 0) {
    return NextResponse.json(
      { error: "This hiking day has bookings, so it can't be deleted. Cancel it instead." },
      { status: 409 }
    );
  }

  const result = await deleteTrekSession(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
