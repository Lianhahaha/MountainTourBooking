import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { BookingRequest } from "@/types";

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!supabase) {
    supabase = createClient(url, key);
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
    trip_type: booking.tripType,
    trip_title: booking.tripTitle,
    preferred_date: booking.preferredDate,
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

  if (error) return { ok: false, error: error.message };
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

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
