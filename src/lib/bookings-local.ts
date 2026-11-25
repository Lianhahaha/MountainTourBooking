import { randomUUID } from "node:crypto";
import type { BookingRequest, BookingStatus } from "@/types";
import { readLocal, updateLocal } from "@/lib/local-store";

const BOOKINGS = "bookings";
const CONTACTS = "contacts";

function newestFirst(bookings: BookingRequest[]): BookingRequest[] {
  return [...bookings].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** Reads every local booking. Throws when the local store is unavailable. */
export async function getBookingsFromLocalStrict(): Promise<BookingRequest[]> {
  return newestFirst(await readLocal<BookingRequest[]>(BOOKINGS, []));
}

/**
 * Atomically moves a local booking to `status`, but only if it is still in
 * `expectedStatus` (when given).
 */
export async function updateBookingStatusInLocal(
  id: string,
  status: BookingStatus,
  expectedStatus?: BookingStatus
): Promise<{ ok: boolean; booking?: BookingRequest; error?: string; conflict?: boolean; notFound?: boolean }> {
  try {
    let result: { ok: boolean; booking?: BookingRequest; error?: string; conflict?: boolean; notFound?: boolean } = {
      ok: false,
      notFound: true,
      error: "Booking not found",
    };

    await updateLocal<BookingRequest[]>(BOOKINGS, [], (current) => {
      const index = current.findIndex((b) => b.id === id);
      if (index === -1) return current;
      const booking = current[index];
      if (expectedStatus && booking.status !== expectedStatus) {
        result = {
          ok: false,
          conflict: true,
          error: "This booking was already updated. Refresh to see its current status.",
        };
        return current;
      }
      const next = { ...booking, status };
      result = { ok: true, booking: next };
      const copy = [...current];
      copy[index] = next;
      return newestFirst(copy);
    });

    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function saveBookingToLocal(booking: BookingRequest): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateLocal<BookingRequest[]>(BOOKINGS, [], (current) => {
      const index = current.findIndex((b) => b.id === booking.id);
      if (index === -1) return newestFirst([...current, booking]);
      const copy = [...current];
      copy[index] = booking;
      return newestFirst(copy);
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function saveContactToLocal(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateLocal<unknown[]>(CONTACTS, [], (current) => [
      { ...data, id: randomUUID(), createdAt: new Date().toISOString() },
      ...current,
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
