import { NextRequest, NextResponse } from "next/server";
import type { BookingRequest } from "@/types";
import { saveBookingToSupabase } from "@/lib/supabase";
import { saveBookingToFile } from "@/lib/bookings-file";
import { getAllBookings } from "@/lib/bookings";
import { sendBookingEmails, generateBookingId } from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { reserveSessionSlots, getTrekSessionById } from "@/lib/trek-sessions-file";
import { getTripById, getPrivateTrip } from "@/data/trips";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await getAllBookings();
  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const booking: BookingRequest = {
      id: generateBookingId(),
      tripId: body.tripId ?? null,
      sessionId: body.sessionId ?? null,
      tripType: body.tripType,
      tripTitle: body.tripTitle,
      preferredDate: body.preferredDate ?? null,
      trekTime: body.trekTime ?? null,
      locationPreference: body.locationPreference ?? null,
      paxCount: body.paxCount,
      participantNames: body.participantNames ?? [],
      leadName: body.leadName,
      phone: body.phone,
      email: body.email,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      notes: body.notes ?? "",
      fitnessConfirmed: body.fitnessConfirmed,
      waiverAccepted: body.waiverAccepted,
      ageConfirmed: body.ageConfirmed,
      // Never trust the client-sent total — overwritten with the server price below.
      estimatedTotal: 0,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    if (
      !booking.tripTitle ||
      !booking.leadName ||
      !booking.phone ||
      !booking.email ||
      !booking.emergencyContactName ||
      !booking.emergencyContactPhone ||
      !booking.fitnessConfirmed ||
      !booking.waiverAccepted ||
      !booking.ageConfirmed
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let sessionPrice: number | undefined;

    if (booking.tripType === "scheduled") {
      if (!booking.sessionId) {
        return NextResponse.json({ error: "Please select a hiking day" }, { status: 400 });
      }
      const session = await getTrekSessionById(booking.sessionId);
      if (!session) {
        return NextResponse.json({ error: "Selected hiking day not found" }, { status: 400 });
      }
      booking.preferredDate = session.date;
      booking.trekTime = session.time;
      sessionPrice = session.price;
    }

    // Compute the total from trip/session price data on the server.
    const trip = booking.tripId
      ? getTripById(booking.tripId)
      : booking.tripType === "private"
        ? getPrivateTrip()
        : undefined;
    const unitPrice = sessionPrice ?? trip?.price ?? 0;
    booking.estimatedTotal = Math.round(unitPrice * Number(booking.paxCount) || 0);

    if (booking.sessionId) {
      const reserve = await reserveSessionSlots(booking.sessionId, booking.paxCount);
      if (!reserve.ok) {
        return NextResponse.json(
          { error: reserve.error ?? "Not enough slots for this date" },
          { status: 400 }
        );
      }
    }

    const supabaseResult = await saveBookingToSupabase(booking);
    if (!supabaseResult.ok) {
      const fileResult = await saveBookingToFile(booking);
      if (!fileResult.ok) {
        if (booking.sessionId) {
          const { releaseSessionSlots } = await import("@/lib/trek-sessions-file");
          await releaseSessionSlots(booking.sessionId, booking.paxCount);
        }
        return NextResponse.json(
          { error: "Failed to save booking. Please try again or contact us directly." },
          { status: 500 }
        );
      }
    }

    await sendBookingEmails(booking);

    return NextResponse.json({ id: booking.id, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
