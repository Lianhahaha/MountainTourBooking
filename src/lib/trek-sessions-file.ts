import { describeSupabaseError, getSupabase } from "@/lib/supabase";
import { readLocal, updateLocal } from "@/lib/local-store";
import type { TrekSession } from "@/types";
import { todayInManila } from "@/lib/utils";

const TABLE = "trek_sessions";
const LOCAL = "trek-sessions";
const MAX_ATTEMPTS = 6;

export function getSessionSlotsRemaining(session: TrekSession): number {
  return Math.max(0, session.maxSlots - session.bookedCount);
}

export function isSessionBookable(session: TrekSession): boolean {
  if (session.status === "cancelled") return false;
  const today = todayInManila();
  if (session.date < today) return false;
  return getSessionSlotsRemaining(session) > 0;
}

function rowToSession(row: Record<string, unknown>): TrekSession {
  const price = row.price;
  return {
    id: String(row.id),
    date: String(row.date),
    time: String(row.time),
    maxSlots: Number(row.max_slots),
    bookedCount: Number(row.booked_count),
    status: (row.status as TrekSession["status"]) ?? "open",
    ...(price === null || price === undefined ? {} : { price: Number(price) }),
    notes: typeof row.notes === "string" ? row.notes : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

function sessionToRow(session: TrekSession) {
  return {
    id: session.id,
    date: session.date,
    time: session.time,
    max_slots: session.maxSlots,
    booked_count: session.bookedCount,
    status: session.status,
    price: session.price ?? null,
    notes: session.notes ?? "",
    created_at: session.createdAt || new Date().toISOString(),
    updated_at: session.updatedAt || new Date().toISOString(),
  };
}

function sortSessions(sessions: TrekSession[]): TrekSession[] {
  return [...sessions].sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
  );
}

/**
 * Every hiking day. Throws when the store is unavailable so admin screens can
 * say so instead of showing a falsely empty schedule.
 */
export async function getAllTrekSessionsStrict(): Promise<TrekSession[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw new Error(describeSupabaseError(error.message));
    return (data ?? []).map(rowToSession);
  }
  return sortSessions(await readLocal<TrekSession[]>(LOCAL, []));
}

/**
 * Every hiking day, or none when the store is unavailable. Never invents
 * sample dates: a fake bookable date is worse than an honest empty list.
 */
export async function getAllTrekSessions(): Promise<TrekSession[]> {
  try {
    return await getAllTrekSessionsStrict();
  } catch (err) {
    console.error("Hiking days store unavailable, returning no trek sessions:", err);
    return [];
  }
}

/**
 * Public pages need to tell "no dates posted" apart from "the store is down",
 * so they do not tell visitors the schedule is empty during an outage.
 */
export async function getAvailableTrekSessionsResult(): Promise<{
  sessions: TrekSession[];
  error: string | null;
}> {
  try {
    const sessions = await getAllTrekSessionsStrict();
    return { sessions: sessions.filter(isSessionBookable), error: null };
  } catch (err) {
    console.error("Could not load hiking days for the public schedule:", err);
    return {
      sessions: [],
      error: "Live dates are temporarily unavailable. Please message us or request a private climb.",
    };
  }
}

/** Throws when the store is unavailable; returns undefined only for a real miss. */
export async function getTrekSessionById(id: string): Promise<TrekSession | undefined> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(describeSupabaseError(error.message));
    return data ? rowToSession(data) : undefined;
  }
  return (await readLocal<TrekSession[]>(LOCAL, [])).find((s) => s.id === id);
}

export async function sessionConflictExists(date: string, time: string, excludeId?: string): Promise<boolean> {
  const sessions = await getAllTrekSessionsStrict();
  const normalizedTime = time.trim().toLowerCase();
  return sessions.some(
    (s) =>
      s.id !== excludeId &&
      s.date === date.trim() &&
      s.time.trim().toLowerCase() === normalizedTime &&
      s.status !== "cancelled"
  );
}

export async function saveTrekSession(session: TrekSession): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from(TABLE).upsert(sessionToRow(session), { onConflict: "id" });
    return error ? { ok: false, error: describeSupabaseError(error.message) } : { ok: true };
  }

  try {
    await updateLocal<TrekSession[]>(LOCAL, [], (current) => {
      const index = current.findIndex((s) => s.id === session.id);
      if (index === -1) return sortSessions([...current, session]);
      const next = [...current];
      next[index] = session;
      return sortSessions(next);
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

type SessionUpdate = TrekSession | { error: string };

/**
 * Compares the version the caller read with the row it is about to write.
 * A concurrent writer makes the update match nothing, and the caller retries.
 */
async function updateSessionRow(
  current: TrekSession,
  next: TrekSession
): Promise<{ ok: boolean; session?: TrekSession; retry?: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Supabase is not configured" };

  const stamp = new Date().toISOString();
  const { data, error } = await client
    .from(TABLE)
    .update(sessionToRow({ ...next, updatedAt: stamp }))
    .eq("id", current.id)
    .eq("updated_at", current.updatedAt)
    .eq("booked_count", current.bookedCount)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: describeSupabaseError(error.message) };
  if (!data) return { ok: false, retry: true };
  return { ok: true, session: rowToSession(data) };
}

async function updateLocalSession(
  id: string,
  apply: (current: TrekSession) => SessionUpdate
): Promise<{ ok: boolean; session?: TrekSession; error?: string }> {
  try {
    let updated: TrekSession | undefined;
    await updateLocal<TrekSession[]>(LOCAL, [], (sessions) => {
      const index = sessions.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Hiking day not found");
      const next = apply(sessions[index]);
      if ("error" in next) throw new Error(next.error);
      updated = { ...next, updatedAt: new Date().toISOString() };
      const copy = [...sessions];
      copy[index] = updated;
      return sortSessions(copy);
    });
    return updated ? { ok: true, session: updated } : { ok: false, error: "Hiking day not found" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update hiking day" };
  }
}

/**
 * Read-modify-write a hiking day so an edit can never overwrite a booking
 * count that changed in the meantime. `apply` receives the current session and
 * returns the next one, or an error message.
 */
export async function updateTrekSession(
  id: string,
  apply: (current: TrekSession) => SessionUpdate
): Promise<{ ok: boolean; session?: TrekSession; error?: string }> {
  if (!getSupabase()) return updateLocalSession(id, apply);

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await getTrekSessionById(id);
      if (!current) return { ok: false, error: "Hiking day not found" };
      const next = apply(current);
      if ("error" in next) return { ok: false, error: next.error };

      const result = await updateSessionRow(current, next);
      if (result.ok) return { ok: true, session: result.session };
      if (!result.retry) return { ok: false, error: result.error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update hiking day" };
  }

  return { ok: false, error: "This hiking day kept changing. Try again." };
}

export async function deleteTrekSession(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from(TABLE).delete().eq("id", id);
    return error ? { ok: false, error: describeSupabaseError(error.message) } : { ok: true };
  }

  try {
    await updateLocal<TrekSession[]>(LOCAL, [], (current) => current.filter((s) => s.id !== id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function reserveSessionSlots(
  sessionId: string,
  paxCount: number
): Promise<{ ok: boolean; session?: TrekSession; error?: string }> {
  if (!getSupabase()) return reserveLocalSlots(sessionId, paxCount);

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await getTrekSessionById(sessionId);
      if (!current) return { ok: false, error: "Session not found" };
      if (!isSessionBookable(current)) return { ok: false, error: "Session not available" };
      if (getSessionSlotsRemaining(current) < paxCount) {
        return { ok: false, error: "Not enough slots for this date" };
      }

      const bookedCount = current.bookedCount + paxCount;
      const next: TrekSession = {
        ...current,
        bookedCount,
        status: bookedCount >= current.maxSlots ? "full" : "open",
      };
      const result = await updateSessionRow(current, next);
      if (result.ok) return { ok: true, session: result.session };
      if (!result.retry) return { ok: false, error: result.error };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reserve slots",
    };
  }

  return { ok: false, error: "This hiking day kept changing. Try again." };
}

async function reserveLocalSlots(
  sessionId: string,
  paxCount: number
): Promise<{ ok: boolean; session?: TrekSession; error?: string }> {
  try {
    let updated: TrekSession | undefined;
    await updateLocal<TrekSession[]>(LOCAL, [], (sessions) => {
      const index = sessions.findIndex((s) => s.id === sessionId);
      if (index === -1) throw new Error("Session not found");
      const current = sessions[index];
      if (!isSessionBookable(current)) throw new Error("Session not available");
      if (getSessionSlotsRemaining(current) < paxCount) {
        throw new Error("Not enough slots for this date");
      }
      const bookedCount = current.bookedCount + paxCount;
      updated = {
        ...current,
        bookedCount,
        status: bookedCount >= current.maxSlots ? "full" : "open",
        updatedAt: new Date().toISOString(),
      };
      const copy = [...sessions];
      copy[index] = updated;
      return sortSessions(copy);
    });
    return updated ? { ok: true, session: updated } : { ok: false, error: "Session not found" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reserve slots",
    };
  }
}

export async function releaseSessionSlots(
  sessionId: string,
  paxCount: number
): Promise<{ ok: boolean; error?: string }> {
  if (paxCount <= 0) return { ok: true };
  if (!getSupabase()) return releaseLocalSlots(sessionId, paxCount);

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await getTrekSessionById(sessionId);
      if (!current) return { ok: false, error: "Session not found" };
      if (current.bookedCount === 0) return { ok: true };

      const bookedCount = Math.max(0, current.bookedCount - paxCount);
      const next: TrekSession = {
        ...current,
        bookedCount,
        status:
          current.status === "cancelled"
            ? "cancelled"
            : bookedCount >= current.maxSlots
              ? "full"
              : "open",
      };
      const result = await updateSessionRow(current, next);
      if (result.ok) return { ok: true };
      if (!result.retry) return { ok: false, error: result.error };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to release slots",
    };
  }

  return { ok: false, error: "This hiking day kept changing. Try again." };
}

async function releaseLocalSlots(
  sessionId: string,
  paxCount: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateLocal<TrekSession[]>(LOCAL, [], (sessions) => {
      const index = sessions.findIndex((s) => s.id === sessionId);
      if (index === -1) throw new Error("Session not found");
      const current = sessions[index];
      if (current.bookedCount === 0) return sessions;
      const bookedCount = Math.max(0, current.bookedCount - paxCount);
      const next = {
        ...current,
        bookedCount,
        status: (current.status === "cancelled"
          ? "cancelled"
          : bookedCount >= current.maxSlots
            ? "full"
            : "open") as TrekSession["status"],
        updatedAt: new Date().toISOString(),
      };
      const copy = [...sessions];
      copy[index] = next;
      return sortSessions(copy);
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to release slots",
    };
  }
}

export function slugifySessionDate(date: string, time: string): string {
  const t = time.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `session-${date}-${t}`;
}
