import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export interface Review {
  id: string;
  bookingId: string;
  leadName: string;
  tripTitle: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export async function saveReview(
  review: Omit<Review, "id" | "status" | "createdAt">
): Promise<{ ok: boolean; error?: string }> {
  try {
    await addDoc(collection(db, "reviews"), {
      ...review,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getApprovedReviews(): Promise<Review[]> {
  try {
    // Avoid where + orderBy together: that needs a composite index which may
    // not exist (query would always fail). Filter then sort in memory instead.
    const q = query(collection(db, "reviews"), where("status", "==", "approved"));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Review))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  } catch (e) {
    console.error("Firestore unavailable, returning no reviews:", e);
    return [];
  }
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  } catch (e) {
    console.error("Firestore unavailable, returning no reviews:", e);
    return [];
  }
}

export async function updateReviewStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, "reviews", id), { status });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
