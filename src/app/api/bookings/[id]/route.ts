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
  releaseSessionSlots,
  reserveSessionSlots,
} from "@/lib/trek-sessions-file";
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

    const result = await updateBookingStatus(id, status, existing.status);
    if (!result.ok || !result.booking) {
      return NextResponse.json({ error: result.error ?? "Update failed" }, { status: 500 });
    }

    // Slots are reserved when a booking is first created (pending) and stay
    // reserved while the booking is active. Release on any transition into
    // cancelled from an active status; re-reserve when a cancelled booking
    // is confirmed again.
    if (result.booking.sessionId) {
      if (status === "cancelled" && existing.status !== "cancelled") {
        const release = await releaseSessionSlots(
          result.booking.sessionId,
          result.booking.paxCount
        );
        if (!release.ok) {
          // Do not fail the status change (already committed), but make the
          // leaked capacity visible in logs so it can be corrected.
          console.error(
            "Failed to release slots for cancelled booking",
            result.booking.id,
            release.error
          );
        }
      } else if (status === "confirmed" && existing.status === "cancelled") {
        const reserve = await reserveSessionSlots(
          result.booking.sessionId,
          result.booking.paxCount
        );
        if (!reserve.ok) {
          await updateBookingStatus(id, "cancelled");
          return NextResponse.json(
            { error: reserve.error ?? "Not enough slots to re-confirm this booking" },
            { status: 400 }
          );
        }
      }
    }

    const trip = result.booking.tripId ? getTripById(result.booking.tripId) : undefined;
    const scheduledDate = result.booking.preferredDate
      ? formatDate(result.booking.preferredDate)
      : "To be confirmed";

    // Email is best-effort: the status change already committed, so a Resend
    // failure must not roll back or surface as a 500 to the admin.
    try {
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
    } catch (err) {
      console.error("Failed to send status email for booking", result.booking.id, err);
    }

    return NextResponse.json({ booking: result.booking });
  } catch (err) {
    console.error("Booking PATCH error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
