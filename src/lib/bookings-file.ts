import { db } from "@/lib/firebase";
import { collection, doc, getDocs, runTransaction, setDoc } from "firebase/firestore";
import type { BookingRequest, BookingStatus } from "@/types";

const COLLECTION = "booking_requests";

function sortNewestFirst(bookings: BookingRequest[]): BookingRequest[] {
  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Reads every Firestore booking. Throws on failure so callers can tell "none" from "unavailable". */
export async function getBookingsFromFileStrict(): Promise<BookingRequest[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const bookings: BookingRequest[] = [];
  snapshot.forEach((d) => {
    bookings.push(d.data() as BookingRequest);
  });
  return sortNewestFirst(bookings);
}

export async function getBookingsFromFile(): Promise<BookingRequest[]> {
  try {
    return await getBookingsFromFileStrict();
  } catch (err) {
    console.error("Firestore unavailable, returning no bookings:", err);
    return [];
  }
}

/**
 * Atomically moves a Firestore booking to `status`, but only if it is still in
 * `expectedStatus` (when given). Two devices acting at once cannot both win.
 */
export async function updateBookingStatusInFile(
  id: string,
  status: BookingStatus,
  expectedStatus?: BookingStatus
): Promise<{ ok: boolean; booking?: BookingRequest; error?: string; conflict?: boolean; notFound?: boolean }> {
  try {
    const booking = await runTransaction(db, async (tx) => {
      const ref = doc(db, COLLECTION, id);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("NOT_FOUND");
      const current = snap.data() as BookingRequest;
      if (expectedStatus && current.status !== expectedStatus) throw new Error("CONFLICT");
      const next: BookingRequest = { ...current, status };
      tx.set(ref, next);
      return next;
    });
    return { ok: true, booking };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "NOT_FOUND") return { ok: false, notFound: true, error: "Booking not found" };
    if (message === "CONFLICT") {
      return { ok: false, conflict: true, error: "This booking was already updated. Refresh to see its current status." };
    }
    return { ok: false, error: message };
  }
}

export async function saveBookingToFile(booking: BookingRequest): Promise<{ ok: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTION, booking.id), booking);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function saveContactToFile(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    // Date.now() collides for messages in the same millisecond — use a UUID.
    const id = crypto.randomUUID();
    await setDoc(doc(db, "contact_messages", id), { ...data, createdAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
