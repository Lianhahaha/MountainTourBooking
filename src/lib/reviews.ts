import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
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

export type ReviewStatus = Review["status"];

const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "rejected"];

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

/** Coerce a stored document into a well-formed Review (old or hand-edited docs may lack fields). */
function toReview(id: string, data: Record<string, unknown>): Review {
  const rating = Number(data.rating);
  return {
    id,
    bookingId: typeof data.bookingId === "string" ? data.bookingId : "",
    leadName: typeof data.leadName === "string" ? data.leadName : "",
    tripTitle: typeof data.tripTitle === "string" ? data.tripTitle : "",
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0,
    comment: typeof data.comment === "string" ? data.comment : "",
    status: isReviewStatus(data.status) ? data.status : "pending",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
  };
}

/**
 * Every review, newest first. Throws when Firestore is unavailable so the
 * owner dashboard can say so instead of showing an empty list.
 */
export async function getAllReviewsStrict(): Promise<Review[]> {
  // No orderBy: Firestore drops documents missing the ordered field. Sort in memory.
  const snap = await getDocs(collection(db, "reviews"));
  return snap.docs
    .map((d) => toReview(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Every review, newest first, or none when Firestore is unavailable. */
export async function getAllReviews(): Promise<Review[]> {
  try {
    return await getAllReviewsStrict();
  } catch (e) {
    console.error("Firestore unavailable, returning no reviews:", e);
    return [];
  }
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, "reviews", id), { status });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
