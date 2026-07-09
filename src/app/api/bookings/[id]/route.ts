import { NextRequest, NextResponse } from "next/server";
import type { BookingStatus } from "@/types";
import { getBookingById, updateBookingStatus } from "@/lib/bookings";
import {
  sendBookingApprovedEmail,
  sendBookingCancelledEmail,
} from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getTripById } from "@/data/trips";
import { releaseSessionSlots } from "@/lib/trek-sessions-file";
import { formatDate } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getBookingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const status = body.status as BookingStatus;
    const ownerNote = (body.ownerNote as string | undefined)?.trim();

    if (status !== "confirmed" && status !== "cancelled") {
      return NextResponse.json(
        { error: "Status must be confirmed or cancelled" },
        { status: 400 }
      );
    }

    if (existing.status === status) {
      return NextResponse.json({ booking: existing });
    }

    const result = await updateBookingStatus(id, status);
    if (!result.ok || !result.booking) {
      return NextResponse.json({ error: result.error ?? "Update failed" }, { status: 500 });
    }

    if (
      status === "cancelled" &&
      result.booking.sessionId &&
      existing.status === "pending"
    ) {
      await releaseSessionSlots(result.booking.sessionId, result.booking.paxCount);
    }

    const trip = result.booking.tripId ? getTripById(result.booking.tripId) : undefined;
    const scheduledDate = result.booking.preferredDate
      ? formatDate(result.booking.preferredDate)
      : "To be confirmed";

    if (status === "confirmed") {
      await sendBookingApprovedEmail(result.booking, {
        scheduledDate,
        meetupPoint: trip?.meetupPoint ?? "We will confirm the meet-up point via SMS or email",
        meetupTime: result.booking.trekTime ?? trip?.time ?? "To be confirmed",
        ownerNote,
      });
    } else {
      await sendBookingCancelledEmail(result.booking, { ownerNote });
    }

    return NextResponse.json({ booking: result.booking });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
