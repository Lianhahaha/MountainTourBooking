import type { BookingRequest, BookingStatus } from "@/types";
import { describeSupabaseError, getSupabase, saveBookingToSupabase } from "@/lib/supabase";
import {
  getBookingsFromLocalStrict,
  saveBookingToLocal,
  updateBookingStatusInLocal,
} from "@/lib/bookings-local";

const PAGE_SIZE = 1000;

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

/** Every Supabase booking, paging past Supabase's 1,000-row default limit. */
async function getSupabaseBookings(): Promise<BookingRequest[]> {
  const client = getSupabase();
  if (!client) return [];
  const all: BookingRequest[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(describeSupabaseError(error.message));
    all.push(...(data ?? []).map(rowToBooking));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return all;
}

export interface BookingsResult {
  bookings: BookingRequest[];
  /** Set when a store could not be read; the list may be incomplete. */
  error: string | null;
}

/**
 * Reads bookings from Supabase, or from the local JSON store when Supabase is
 * not configured (local development). A failed read is reported, never hidden.
 */
export async function getAllBookingsResult(): Promise<BookingsResult> {
  if (getSupabase()) {
    try {
      return { bookings: await getSupabaseBookings(), error: null };
    } catch (err) {
      console.error("Supabase bookings read failed:", err);
      return {
        bookings: [],
        error: "Could not read bookings from the database. The list may be incomplete.",
      };
    }
  }

  try {
    return { bookings: await getBookingsFromLocalStrict(), error: null };
  } catch (err) {
    console.error("Local bookings read failed:", err);
    return {
      bookings: [],
      error: "Could not read bookings from the local store. Configure Supabase for production.",
    };
  }
}

export async function getBookingById(id: string): Promise<BookingRequest | undefined> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from("booking_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(describeSupabaseError(error.message));
    return data ? rowToBooking(data) : undefined;
  }

  const bookings = await getBookingsFromLocalStrict();
  return bookings.find((b) => b.id === id);
}

/**
 * Moves a booking to `status` only if it is still in `expectedStatus`.
 * Works on whichever store holds the booking.
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  expectedStatus?: BookingStatus
): Promise<{ ok: boolean; booking?: BookingRequest; error?: string; conflict?: boolean }> {
  const client = getSupabase();
  if (client) {
    let query = client.from("booking_requests").update({ status }).eq("id", id);
    if (expectedStatus) query = query.eq("status", expectedStatus);
    const { data, error } = await query.select("*").maybeSingle();

    if (error) return { ok: false, error: describeSupabaseError(error.message) };
    if (data) return { ok: true, booking: rowToBooking(data) };

    // No row updated: either the status moved on, or the booking is missing.
    const { data: existing } = await client.from("booking_requests").select("id").eq("id", id).maybeSingle();
    if (existing) {
      return {
        ok: false,
        conflict: true,
        error: "This booking was already updated. Refresh to see its current status.",
      };
    }
    return { ok: false, error: "Booking not found" };
  }

  return updateBookingStatusInLocal(id, status, expectedStatus);
}

/** Stores a new booking, using the local store only when Supabase is absent. */
export async function saveBooking(booking: BookingRequest): Promise<{ ok: boolean; error?: string }> {
  if (getSupabase()) return saveBookingToSupabase(booking);
  return saveBookingToLocal(booking);
}
