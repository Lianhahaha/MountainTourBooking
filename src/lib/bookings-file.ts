import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { BookingRequest } from "@/types";

const COLLECTION = "booking_requests";

export async function getBookingsFromFile(): Promise<BookingRequest[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const bookings: BookingRequest[] = [];
    snapshot.forEach((doc) => {
      bookings.push(doc.data() as BookingRequest);
    });
    return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function updateBookingInFile(
  id: string,
  updates: Partial<Pick<BookingRequest, "status">>
): Promise<{ ok: boolean; booking?: BookingRequest; error?: string }> {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return { ok: true, booking: snap.data() as BookingRequest };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
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
    const id = Date.now().toString();
    await setDoc(doc(db, "contact_messages", id), { ...data, createdAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
