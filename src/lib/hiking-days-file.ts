import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { HikingDay } from "@/data/hiking-days";
import { seedHikingDays } from "@/data/hiking-days";

const COLLECTION = "hiking_days";

export async function getAllHikingDays(): Promise<HikingDay[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const days: HikingDay[] = [];
  snapshot.forEach((doc) => {
    days.push(doc.data() as HikingDay);
  });
  
  if (days.length === 0) {
    // Seed on first use
    for (const day of seedHikingDays) {
      await setDoc(doc(db, COLLECTION, day.id), day);
    }
    return seedHikingDays;
  }
  
  return days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getHikingDayById(id: string): Promise<HikingDay | undefined> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as HikingDay) : undefined;
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
