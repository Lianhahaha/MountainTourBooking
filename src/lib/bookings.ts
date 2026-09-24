import type { BookingRequest, BookingStatus } from "@/types";
import { getSupabase } from "@/lib/supabase";
import { getBookingsFromFile, updateBookingInFile } from "@/lib/bookings-file";

function rowToBooking(row: Record<string, unknown>): BookingRequest {
  return {
    id: row.id as string,
    tripId: (row.trip_id as string) ?? null,
    sessionId: (row.session_id as string) ?? null,
    tripType: row.trip_type as BookingRequest["tripType"],
    tripTitle: row.trip_title as string,
    preferredDate: (row.preferred_date as string) ?? null,
    trekTime: (row.trek_time as string) ?? null,
    locationPreference: (row.location_preference as string) ?? null,
    paxCount: row.pax_count as number,
    participantNames: (row.participant_names as string[]) ?? [],
    leadName: row.lead_name as string,
    phone: row.phone as string,
    email: row.email as string,
    emergencyContactName: row.emergency_contact_name as string,
    emergencyContactPhone: row.emergency_contact_phone as string,
    notes: (row.notes as string) ?? "",
    fitnessConfirmed: row.fitness_confirmed as boolean,
    waiverAccepted: row.waiver_accepted as boolean,
    ageConfirmed: row.age_confirmed as boolean,
    estimatedTotal: Number(row.estimated_total),
    status: row.status as BookingStatus,
    createdAt: row.created_at as string,
  };
}

export async function getAllBookings(): Promise<BookingRequest[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // An empty table is a valid result — only fall back on actual errors.
    if (!error && data) {
      return data.map(rowToBooking);
    }
  }

  return getBookingsFromFile();
}

export async function getBookingById(id: string): Promise<BookingRequest | undefined> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("booking_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) return rowToBooking(data);
  }

  const bookings = await getBookingsFromFile();
  return bookings.find((b) => b.id === id);
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  expectedStatus?: BookingStatus
): Promise<{ ok: boolean; booking?: BookingRequest; error?: string }> {
  const client = getSupabase();
  if (client) {
    let query = client
      .from("booking_requests")
      .update({ status })
      .eq("id", id);
    if (expectedStatus) {
      query = query.eq("status", expectedStatus);
    }
    const { data, error } = await query.select("*").maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data) {
      return {
        ok: false,
        error: expectedStatus
          ? "Booking status changed by another request"
          : "Booking not found",
      };
    }
    return { ok: true, booking: rowToBooking(data) };
  }

  if (expectedStatus) {
    const current = (await getBookingsFromFile()).find((b) => b.id === id);
    if (!current) {
      return { ok: false, error: "Booking not found" };
    }
    if (current.status !== expectedStatus) {
      return { ok: false, error: "Booking status changed by another request" };
    }
  }

  const result = await updateBookingInFile(id, { status });
  if (!result.ok || !result.booking) {
    return { ok: false, error: result.error ?? "Booking not found" };
  }
  return { ok: true, booking: result.booking };
}
