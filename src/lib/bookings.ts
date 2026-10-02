import type { BookingRequest, BookingStatus } from "@/types";
import { getSupabase } from "@/lib/supabase";
import { getBookingsFromFileStrict, updateBookingStatusInFile } from "@/lib/bookings-file";

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
    if (error) throw new Error(error.message);
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
 * Reads bookings from every store. New bookings go to Supabase and fall back
 * to Firestore when Supabase is down, so both stores are read and merged
 * (Supabase wins on duplicate ids). A failed read is reported, never hidden.
 */
export async function getAllBookingsResult(): Promise<BookingsResult> {
  const errors: string[] = [];
  const byId = new Map<string, BookingRequest>();

  const [firestore, supabase] = await Promise.allSettled([
    getBookingsFromFileStrict(),
    getSupabase() ? getSupabaseBookings() : Promise.resolve([] as BookingRequest[]),
  ]);

  if (firestore.status === "fulfilled") {
    for (const b of firestore.value) byId.set(b.id, b);
  } else {
    console.error("Firestore bookings read failed:", firestore.reason);
    errors.push("Firestore");
  }
  if (supabase.status === "fulfilled") {
    for (const b of supabase.value) byId.set(b.id, b);
  } else {
    console.error("Supabase bookings read failed:", supabase.reason);
    errors.push("Supabase");
  }

  const bookings = [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return {
    bookings,
    error: errors.length ? `Could not read bookings from ${errors.join(" and ")}. The list may be incomplete.` : null,
  };
}

export async function getAllBookings(): Promise<BookingRequest[]> {
  return (await getAllBookingsResult()).bookings;
}

export async function getBookingById(id: string): Promise<BookingRequest | undefined> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from("booking_requests").select("*").eq("id", id).maybeSingle();
    if (!error && data) return rowToBooking(data);
  }

  try {
    return (await getBookingsFromFileStrict()).find((b) => b.id === id);
  } catch {
    return undefined;
  }
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

    if (error) return { ok: false, error: error.message };
    if (data) return { ok: true, booking: rowToBooking(data) };

    // No row updated: either the status moved on, or the booking lives in Firestore.
    const { data: existing } = await client.from("booking_requests").select("id").eq("id", id).maybeSingle();
    if (existing) {
      return {
        ok: false,
        conflict: true,
        error: "This booking was already updated. Refresh to see its current status.",
      };
    }
  }

  const result = await updateBookingStatusInFile(id, status, expectedStatus);
  return { ok: result.ok, booking: result.booking, error: result.error, conflict: result.conflict };
}
