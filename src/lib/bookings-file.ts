import { promises as fs } from "fs";
import path from "path";
import type { BookingRequest } from "@/types";

const BOOKINGS_FILE = path.join(process.cwd(), "data", "bookings.json");

async function ensureBookingsFile() {
  const dir = path.dirname(BOOKINGS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(BOOKINGS_FILE);
  } catch {
    await fs.writeFile(BOOKINGS_FILE, "[]", "utf-8");
  }
}

export async function getBookingsFromFile(): Promise<BookingRequest[]> {
  try {
    await ensureBookingsFile();
    const raw = await fs.readFile(BOOKINGS_FILE, "utf-8");
    const bookings: BookingRequest[] = JSON.parse(raw);
    return bookings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function updateBookingInFile(
  id: string,
  updates: Partial<Pick<BookingRequest, "status">>
): Promise<{ ok: boolean; booking?: BookingRequest; error?: string }> {
  try {
    await ensureBookingsFile();
    const raw = await fs.readFile(BOOKINGS_FILE, "utf-8");
    const bookings: BookingRequest[] = JSON.parse(raw);
    const index = bookings.findIndex((b) => b.id === id);
    if (index < 0) {
      return { ok: false, error: "Booking not found" };
    }
    bookings[index] = { ...bookings[index], ...updates };
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
    return { ok: true, booking: bookings[index] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update booking",
    };
  }
}

export async function saveBookingToFile(
  booking: BookingRequest
): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureBookingsFile();
    const raw = await fs.readFile(BOOKINGS_FILE, "utf-8");
    const bookings: BookingRequest[] = JSON.parse(raw);
    bookings.push(booking);
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save booking",
    };
  }
}

export async function saveContactToFile(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const contactsFile = path.join(process.cwd(), "data", "contacts.json");
  try {
    const dir = path.dirname(contactsFile);
    await fs.mkdir(dir, { recursive: true });
    let contacts: unknown[] = [];
    try {
      const raw = await fs.readFile(contactsFile, "utf-8");
      contacts = JSON.parse(raw);
    } catch {
      contacts = [];
    }
    contacts.push({ ...data, createdAt: new Date().toISOString() });
    await fs.writeFile(contactsFile, JSON.stringify(contacts, null, 2), "utf-8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save contact",
    };
  }
}
