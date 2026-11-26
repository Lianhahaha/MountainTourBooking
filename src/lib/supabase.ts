import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { BookingRequest } from "@/types";

let supabase: SupabaseClient | null = null;

/**
 * Turns PostgREST's "relation does not exist" into the one instruction the
 * owner can act on after a fresh deployment.
 */
export function describeSupabaseError(message: string): string {
  if (/does not exist|could not find the table|schema cache/i.test(message)) {
    return "The database tables are missing. Run supabase/schema.sql in the Supabase SQL editor, then try again.";
  }
  return message;
}

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  if (!serviceKey && process.env.NODE_ENV === "production") {
    console.warn(
      "Supabase is using the anon key. Writes will fail unless RLS policies allow them; set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!supabase) {
    // Server-only client: no browser session persistence or token refresh.
    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  return supabase;
}

export async function saveBookingToSupabase(
  booking: BookingRequest
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await client.from("booking_requests").insert({
    id: booking.id,
    trip_id: booking.tripId,
    session_id: booking.sessionId,
    trip_type: booking.tripType,
    trip_title: booking.tripTitle,
    preferred_date: booking.preferredDate,
    trek_time: booking.trekTime,
    location_preference: booking.locationPreference,
    pax_count: booking.paxCount,
    participant_names: booking.participantNames,
    lead_name: booking.leadName,
    phone: booking.phone,
    email: booking.email,
    emergency_contact_name: booking.emergencyContactName,
    emergency_contact_phone: booking.emergencyContactPhone,
    notes: booking.notes,
    fitness_confirmed: booking.fitnessConfirmed,
    waiver_accepted: booking.waiverAccepted,
    age_confirmed: booking.ageConfirmed,
    estimated_total: booking.estimatedTotal,
    status: booking.status,
    created_at: booking.createdAt,
  });

  if (error) return { ok: false, error: describeSupabaseError(error.message) };
  return { ok: true };
}

export async function saveContactToSupabase(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await client.from("contact_messages").insert({
    ...data,
    created_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: describeSupabaseError(error.message) };
  return { ok: true };
}
