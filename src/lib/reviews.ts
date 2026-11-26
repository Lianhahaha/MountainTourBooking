import { randomUUID } from "node:crypto";
import { describeSupabaseError, getSupabase } from "@/lib/supabase";
import { readLocal, updateLocal } from "@/lib/local-store";

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

export type ReviewStatus = Review["status"];

const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "rejected"];
const MAX_PUBLIC_REVIEWS = 100;

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

function rowToReview(row: Record<string, unknown>): Review {
  const rating = Number(row.rating);
  return {
    id: String(row.id),
    bookingId: typeof row.booking_id === "string" ? row.booking_id : "",
    leadName: typeof row.lead_name === "string" ? row.lead_name : "",
    tripTitle: typeof row.trip_title === "string" ? row.trip_title : "",
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0,
    comment: typeof row.comment === "string" ? row.comment : "",
    status: isReviewStatus(row.status) ? row.status : "pending",
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
  };
}

function newestFirst(a: Review, b: Review): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export async function saveReview(
  review: Omit<Review, "id" | "status" | "createdAt">
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from("reviews").insert({
      id: randomUUID(),
      booking_id: review.bookingId,
      lead_name: review.leadName,
      trip_title: review.tripTitle,
      rating: review.rating,
      comment: review.comment,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    return error ? { ok: false, error: describeSupabaseError(error.message) } : { ok: true };
  }

  try {
    await updateLocal<Review[]>("reviews", [], (current) => [
      {
        ...review,
        id: randomUUID(),
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getApprovedReviews(): Promise<Review[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(MAX_PUBLIC_REVIEWS);
    if (error) {
      console.error("Could not load approved reviews:", error.message);
      return [];
    }
    return (data ?? []).map(rowToReview);
  }

  try {
    const reviews = await readLocal<Review[]>("reviews", []);
    return reviews.filter((r) => r.status === "approved").sort(newestFirst).slice(0, MAX_PUBLIC_REVIEWS);
  } catch (err) {
    console.error("Local reviews unavailable, returning no reviews:", err);
    return [];
  }
}

/**
 * Every review, newest first. Throws when the store is unavailable so the
 * owner dashboard can say so instead of showing an empty list.
 */
export async function getAllReviewsStrict(): Promise<Review[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(describeSupabaseError(error.message));
    return (data ?? []).map(rowToReview);
  }
  return (await readLocal<Review[]>("reviews", [])).sort(newestFirst);
}

/** Every review, newest first, or none when the store is unavailable. */
export async function getAllReviews(): Promise<Review[]> {
  try {
    return await getAllReviewsStrict();
  } catch (e) {
    console.error("Reviews store unavailable, returning no reviews:", e);
    return [];
  }
}

/** Dashboard badge count without loading every review. */
export async function getPendingReviewCount(): Promise<number> {
  const client = getSupabase();
  if (client) {
    const { count, error } = await client
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) {
      console.error("Could not count pending reviews:", error.message);
      return 0;
    }
    return count ?? 0;
  }

  try {
    return (await readLocal<Review[]>("reviews", [])).filter((r) => r.status === "pending").length;
  } catch {
    return 0;
  }
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("reviews")
      .update({ status })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: describeSupabaseError(error.message) };
    if (!data) return { ok: false, error: "Review not found" };
    return { ok: true };
  }

  try {
    let found = false;
    await updateLocal<Review[]>("reviews", [], (current) =>
      current.map((review) => {
        if (review.id !== id) return review;
        found = true;
        return { ...review, status };
      })
    );
    return found ? { ok: true } : { ok: false, error: "Review not found" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
