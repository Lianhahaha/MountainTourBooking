import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { HikingDay } from "@/data/hiking-days";

const COLLECTION = "hiking_days";

/** Every album. Throws when Firestore is unavailable so admin screens can say so. */
export async function getAllHikingDaysStrict(): Promise<HikingDay[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const days: HikingDay[] = [];
  snapshot.forEach((d) => {
    days.push(d.data() as HikingDay);
  });
  return days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Every album, or none when Firestore is unavailable. Sample albums are not
 * written back when the owner deletes the last one.
 */
export async function getAllHikingDays(): Promise<HikingDay[]> {
  try {
    return await getAllHikingDaysStrict();
  } catch (err) {
    console.error("Firestore unavailable, returning no hike albums:", err);
    return [];
  }
}

export async function getHikingDayById(id: string): Promise<HikingDay | undefined> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? (snap.data() as HikingDay) : undefined;
  } catch (err) {
    console.error("Firestore unavailable, could not look up hike album:", err);
    return undefined;
  }
}

export async function saveHikingDay(day: HikingDay): Promise<{ ok: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTION, day.id), day);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export async function deleteHikingDay(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete" };
  }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
