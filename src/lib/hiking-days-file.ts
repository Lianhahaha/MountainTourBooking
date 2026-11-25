import { getSupabase } from "@/lib/supabase";
import { readLocal, updateLocal } from "@/lib/local-store";
import type { HikingDay, HikingDayPhoto } from "@/data/hiking-days";

const TABLE = "hiking_days";
const LOCAL = "hiking-days";

function rowToDay(row: Record<string, unknown>): HikingDay {
  const photos = Array.isArray(row.photos) ? (row.photos as HikingDayPhoto[]) : [];
  return {
    id: String(row.id),
    title: typeof row.title === "string" ? row.title : "",
    summary: typeof row.summary === "string" ? row.summary : "",
    date: typeof row.date === "string" ? row.date : "",
    photos: photos.filter(
      (photo) => photo && typeof photo.id === "string" && typeof photo.src === "string"
    ),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

function dayToRow(day: HikingDay) {
  return {
    id: day.id,
    title: day.title,
    summary: day.summary,
    date: day.date,
    photos: day.photos,
    created_at: day.createdAt,
    updated_at: day.updatedAt,
  };
}

function newestFirst(days: HikingDay[]): HikingDay[] {
  return [...days].sort((a, b) => b.date.localeCompare(a.date));
}

/** Every album. Throws when the store is unavailable so admin screens can say so. */
export async function getAllHikingDaysStrict(): Promise<HikingDay[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from(TABLE).select("*").order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDay);
  }
  return newestFirst(await readLocal<HikingDay[]>(LOCAL, []));
}

/**
 * Every album, or none when the store is unavailable. Sample albums are not
 * written back when the owner deletes the last one.
 */
export async function getAllHikingDays(): Promise<HikingDay[]> {
  return (await getAllHikingDaysResult()).days;
}

/** Tells "no albums yet" apart from "the store is down" on the public page. */
export async function getAllHikingDaysResult(): Promise<{
  days: HikingDay[];
  error: string | null;
}> {
  try {
    return { days: await getAllHikingDaysStrict(), error: null };
  } catch (err) {
    console.error("Albums store unavailable, returning no hike albums:", err);
    return {
      days: [],
      error: "Photo albums are temporarily unavailable. Please check back soon.",
    };
  }
}

/** Throws when the store itself is unavailable; returns undefined only for a real miss. */
export async function getHikingDayById(id: string): Promise<HikingDay | undefined> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToDay(data) : undefined;
  }
  return (await readLocal<HikingDay[]>(LOCAL, [])).find((day) => day.id === id);
}

export async function saveHikingDay(day: HikingDay): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from(TABLE).upsert(dayToRow(day), { onConflict: "id" });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  try {
    await updateLocal<HikingDay[]>(LOCAL, [], (current) => {
      const index = current.findIndex((d) => d.id === day.id);
      if (index === -1) return newestFirst([...current, day]);
      const next = [...current];
      next[index] = day;
      return newestFirst(next);
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export async function deleteHikingDay(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from(TABLE).delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  try {
    await updateLocal<HikingDay[]>(LOCAL, [], (current) => current.filter((day) => day.id !== id));
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
