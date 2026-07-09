import { promises as fs } from "fs";
import path from "path";
import type { TrekSession } from "@/types";
import { seedTrekSessions } from "@/data/trek-sessions";

const SESSIONS_FILE = path.join(process.cwd(), "data", "trek-sessions.json");

async function ensureSessionsFile(): Promise<TrekSession[]> {
  const dir = path.dirname(SESSIONS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    const raw = await fs.readFile(SESSIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as TrekSession[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* seed on first use */
  }
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(seedTrekSessions, null, 2), "utf-8");
  return seedTrekSessions;
}

export function getSessionSlotsRemaining(session: TrekSession): number {
  return Math.max(0, session.maxSlots - session.bookedCount);
}

export function isSessionBookable(session: TrekSession): boolean {
  if (session.status === "cancelled") return false;
  const today = new Date().toISOString().slice(0, 10);
  if (session.date < today) return false;
  return getSessionSlotsRemaining(session) > 0;
}

export async function getAllTrekSessions(): Promise<TrekSession[]> {
  const sessions = await ensureSessionsFile();
  return sessions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getAvailableTrekSessions(): Promise<TrekSession[]> {
  const sessions = await getAllTrekSessions();
  return sessions.filter(isSessionBookable);
}

export async function getTrekSessionById(id: string): Promise<TrekSession | undefined> {
  const sessions = await getAllTrekSessions();
  return sessions.find((s) => s.id === id);
}

/**
 * Returns true if a non-cancelled session already exists for the given
 * date + time combination.  Pass `excludeId` when editing so the session
 * being edited is not compared against itself.
 */
export async function sessionConflictExists(
  date: string,
  time: string,
  excludeId?: string
): Promise<boolean> {
  const sessions = await getAllTrekSessions();
  const normalizedTime = time.trim().toLowerCase();
  return sessions.some(
    (s) =>
      s.id !== excludeId &&
      s.date === date.trim() &&
      s.time.trim().toLowerCase() === normalizedTime &&
      s.status !== "cancelled"
  );
}

export async function saveTrekSession(
  session: TrekSession
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sessions = await ensureSessionsFile();
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save session",
    };
  }
}

export async function deleteTrekSession(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sessions = await ensureSessionsFile();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === sessions.length) {
      return { ok: false, error: "Session not found" };
    }
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete session",
    };
  }
}

export async function reserveSessionSlots(
  sessionId: string,
  paxCount: number
): Promise<{ ok: boolean; session?: TrekSession; error?: string }> {
  const session = await getTrekSessionById(sessionId);
  if (!session) return { ok: false, error: "Session not found" };
  if (!isSessionBookable(session)) return { ok: false, error: "Session not available" };
  if (getSessionSlotsRemaining(session) < paxCount) {
    return { ok: false, error: "Not enough slots for this date" };
  }

  const updated: TrekSession = {
    ...session,
    bookedCount: session.bookedCount + paxCount,
    status:
      session.bookedCount + paxCount >= session.maxSlots ? "full" : session.status,
    updatedAt: new Date().toISOString(),
  };

  const result = await saveTrekSession(updated);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, session: updated };
}

export async function releaseSessionSlots(
  sessionId: string,
  paxCount: number
): Promise<{ ok: boolean; error?: string }> {
  const session = await getTrekSessionById(sessionId);
  if (!session) return { ok: false, error: "Session not found" };

  const updated: TrekSession = {
    ...session,
    bookedCount: Math.max(0, session.bookedCount - paxCount),
    status: session.status === "full" ? "open" : session.status,
    updatedAt: new Date().toISOString(),
  };

  return saveTrekSession(updated);
}

export function slugifySessionDate(date: string, time: string): string {
  const t = time.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `session-${date}-${t}`;
}
