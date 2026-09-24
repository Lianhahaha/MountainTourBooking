import { NextRequest, NextResponse } from "next/server";
import type { BookingRequest } from "@/types";
import { saveBookingToSupabase } from "@/lib/supabase";
import { saveBookingToFile } from "@/lib/bookings-file";
import { getAllBookings } from "@/lib/bookings";
import { sendBookingEmails, generateBookingId } from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { reserveSessionSlots, releaseSessionSlots, getTrekSessionById } from "@/lib/trek-sessions-file";
import { getTripById, getPrivateTrip } from "@/data/trips";
import { todayInManila } from "@/lib/utils";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await getAllBookings();
  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  let booking: BookingRequest | undefined;
  let slotsReserved = false;
  try {
    const body = await request.json();

    booking = {
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

    // Waiver flags must be real booleans — truthy strings like "yes" would
    // otherwise pass the required check and get stored as-is.
    const missingRequired =
      !booking.tripTitle ||
      !booking.leadName ||
      !booking.phone ||
      !booking.email ||
      !booking.emergencyContactName ||
      !booking.emergencyContactPhone ||
      body.fitnessConfirmed !== true ||
      body.waiverAccepted !== true ||
      body.ageConfirmed !== true;

    if (missingRequired) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    booking.fitnessConfirmed = true;
    booking.waiverAccepted = true;
    booking.ageConfirmed = true;

    if (
      !Number.isInteger(booking.paxCount) ||
      booking.paxCount < 1 ||
      booking.paxCount > 50
    ) {
      return NextResponse.json(
        { error: "Number of participants must be between 1 and 50" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const textLimits: Array<[string, unknown, number, boolean]> = [
      ["tripTitle", booking.tripTitle, 200, false],
      ["leadName", booking.leadName, 100, false],
      ["phone", booking.phone, 30, false],
      ["email", booking.email, 254, false],
      ["emergencyContactName", booking.emergencyContactName, 100, false],
      ["emergencyContactPhone", booking.emergencyContactPhone, 30, false],
      ["notes", booking.notes, 5000, true],
      ["trekTime", booking.trekTime, 50, true],
      ["locationPreference", booking.locationPreference, 100, true],
    ];
    for (const [field, value, max, allowNull] of textLimits) {
      if (value === null && allowNull) continue;
      if (typeof value !== "string" || value.length > max) {
        return NextResponse.json(
          { error: `${field} must be a string of at most ${max} characters` },
          { status: 400 }
        );
      }
    }

    if (
      !Array.isArray(booking.participantNames) ||
      booking.participantNames.length > booking.paxCount ||
      booking.participantNames.some(
        (n) => typeof n !== "string" || n.length > 100 || n.trim().length === 0
      )
    ) {
      return NextResponse.json(
        { error: "Participant names must be non-empty strings (max 100 chars each)" },
        { status: 400 }
      );
    }

    if (booking.tripType !== "scheduled" && booking.tripType !== "private") {
      return NextResponse.json({ error: "Invalid trip type" }, { status: 400 });
    }

    // Resolve the trip server-side; never trust client-sent tripTitle/tripId.
    let resolvedTripTitle: string;
    if (booking.tripType === "scheduled") {
      if (!booking.sessionId) {
        return NextResponse.json({ error: "Please select a hiking day" }, { status: 400 });
      }
      const scheduledTrip = booking.tripId ? getTripById(booking.tripId) : undefined;
      if (!scheduledTrip || scheduledTrip.type !== "scheduled") {
        return NextResponse.json({ error: "Invalid trip selection" }, { status: 400 });
      }
      resolvedTripTitle = scheduledTrip.title;
    } else {
      if (booking.tripId && booking.tripId !== "private-custom") {
        return NextResponse.json({ error: "Invalid trip selection" }, { status: 400 });
      }
      resolvedTripTitle = getPrivateTrip().title;
    }
    booking.tripTitle = resolvedTripTitle;

    if (booking.tripType === "private") {
      if (booking.sessionId) {
        return NextResponse.json(
          { error: "Private bookings cannot use a hiking day session" },
          { status: 400 }
        );
      }
      if (!booking.preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(booking.preferredDate)) {
        return NextResponse.json(
          { error: "Please choose a preferred trek date" },
          { status: 400 }
        );
      }
      if (booking.preferredDate < todayInManila()) {
        return NextResponse.json(
          { error: "Preferred date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    let sessionPrice: number | undefined;

    if (booking.tripType === "scheduled") {
      const session = await getTrekSessionById(booking.sessionId!);
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

    if (booking.tripType === "private") {
      const privateTrip = getPrivateTrip();
      if (booking.paxCount > privateTrip.maxSlots) {
        return NextResponse.json(
          { error: `Private group size cannot exceed ${privateTrip.maxSlots}` },
          { status: 400 }
        );
      }
    }

    if (booking.sessionId && booking.tripType === "scheduled") {
      const reserve = await reserveSessionSlots(booking.sessionId, booking.paxCount);
      if (!reserve.ok) {
        return NextResponse.json(
          { error: reserve.error ?? "Not enough slots for this date" },
          { status: 400 }
        );
      }
      slotsReserved = true;
    }

    const supabaseResult = await saveBookingToSupabase(booking);
    if (!supabaseResult.ok) {
      const fileResult = await saveBookingToFile(booking);
      if (!fileResult.ok) {
        if (slotsReserved && booking.sessionId) {
          await releaseSessionSlots(booking.sessionId, booking.paxCount);
        }
        return NextResponse.json(
          { error: "Failed to save booking. Please try again or contact us directly." },
          { status: 500 }
        );
      }
    }
    slotsReserved = false;

    const emailResult = await sendBookingEmails(booking);
    if (!emailResult.ownerSent || !emailResult.clientSent) {
      console.warn("Booking emails incomplete for", booking.id, emailResult);
    }

    return NextResponse.json({ id: booking.id, status: "pending" });
  } catch (err) {
    console.error("Booking POST error:", err);
    // Release any slots reserved before the failure, otherwise a thrown error
    // after reservation permanently leaks capacity on that hiking day.
    if (slotsReserved && booking?.sessionId) {
      try {
        await releaseSessionSlots(booking.sessionId, booking.paxCount);
      } catch (releaseErr) {
        console.error("Failed to release slots after booking error:", releaseErr);
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
