import { NextRequest, NextResponse } from "next/server";
import type { BookingStatus } from "@/types";
import { getBookingById, updateBookingStatus } from "@/lib/bookings";
import {
  sendBookingApprovedEmail,
  sendBookingCancelledEmail,
} from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getTripById } from "@/data/trips";
import {
  getTrekSessionById,
  releaseSessionSlots,
  reserveSessionSlots,
} from "@/lib/trek-sessions-file";
import { formatDate, todayInManila } from "@/lib/utils";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const status = body.status as BookingStatus;
  const ownerNote = typeof body.ownerNote === "string" ? body.ownerNote.trim() : "";
  const expectedStatus = STATUSES.includes(body.expectedStatus as BookingStatus)
    ? (body.expectedStatus as BookingStatus)
    : undefined;

  if (status !== "confirmed" && status !== "cancelled") {
    return NextResponse.json({ error: "Status must be confirmed or cancelled" }, { status: 400 });
  }
  if (ownerNote.length > 1000) {
    return NextResponse.json({ error: "Message must be at most 1000 characters" }, { status: 400 });
  }

  const existing = await getBookingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // The owner acted on what their screen showed. If the booking has moved on
  // (another device, another tab), refuse instead of overriding it.
  if (expectedStatus && existing.status !== expectedStatus) {
    return NextResponse.json(
      {
        error: `This booking is already ${existing.status}. Refresh to see its current status.`,
        booking: existing,
      },
      { status: 409 }
    );
  }
  if (existing.status === status) {
    return NextResponse.json({ booking: existing, emailSent: false, unchanged: true });
  }

  // Never confirm a trek that can no longer happen.
  if (status === "confirmed") {
    const today = todayInManila();
    if (existing.sessionId) {
      const session = await getTrekSessionById(existing.sessionId);
      if (!session) {
        return NextResponse.json({ error: "This hiking day no longer exists." }, { status: 409 });
      }
      if (session.status === "cancelled") {
        return NextResponse.json({ error: "This hiking day was cancelled. Decline the booking instead." }, { status: 409 });
      }
      if (session.date < today) {
        return NextResponse.json({ error: "This hiking day has already passed." }, { status: 409 });
      }
    } else if (existing.preferredDate && existing.preferredDate < today) {
      return NextResponse.json({ error: "The requested date has already passed." }, { status: 409 });
    }
  }

  const result = await updateBookingStatus(id, status, existing.status);
  if (!result.ok || !result.booking) {
    return NextResponse.json(
      { error: result.error ?? "Update failed" },
      { status: result.conflict ? 409 : 500 }
    );
  }
  const booking = result.booking;
  let warning: string | undefined;

  // Slots are reserved when a booking is created (pending) and stay reserved
  // while it is active. Release on cancel; re-reserve when a cancelled booking
  // is confirmed again.
  if (booking.sessionId) {
    if (status === "cancelled") {
      const release = await releaseSessionSlots(booking.sessionId, booking.paxCount);
      if (!release.ok) {
        console.error("Failed to release slots for cancelled booking", booking.id, release.error);
        warning = `Booking cancelled, but its ${booking.paxCount} slot(s) could not be released. Check the hiking day's booked count.`;
      }
    } else if (existing.status === "cancelled") {
      const reserve = await reserveSessionSlots(booking.sessionId, booking.paxCount);
      if (!reserve.ok) {
        await updateBookingStatus(id, "cancelled", "confirmed");
        return NextResponse.json(
          { error: reserve.error ?? "Not enough slots to re-confirm this booking" },
          { status: 409 }
        );
      }
    }
  }

  const trip = booking.tripId ? getTripById(booking.tripId) : undefined;
  const scheduledDate = booking.preferredDate ? formatDate(booking.preferredDate) : "To be confirmed";

  // Email is best-effort: the status change already committed. Report the
  // real outcome so the owner knows whether to follow up by SMS.
  let emailSent = false;
  try {
    emailSent =
      status === "confirmed"
        ? await sendBookingApprovedEmail(booking, {
            scheduledDate,
            meetupPoint: trip?.meetupPoint ?? "We will confirm the meet-up point via SMS or email",
            meetupTime: booking.trekTime ?? trip?.time ?? "To be confirmed",
            ownerNote: ownerNote || undefined,
          })
        : await sendBookingCancelledEmail(booking, { ownerNote: ownerNote || undefined });
  } catch (err) {
    console.error("Failed to send status email for booking", booking.id, err);
  }

  return NextResponse.json({ booking, emailSent, warning });
}
