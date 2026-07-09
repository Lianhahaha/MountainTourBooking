import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { TrekSession } from "@/types";
import { seedTrekSessions } from "@/data/trek-sessions";

const COLLECTION = "trek_sessions";

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
  const snapshot = await getDocs(collection(db, COLLECTION));
  const sessions: TrekSession[] = [];
  snapshot.forEach((doc) => {
    sessions.push(doc.data() as TrekSession);
  });
  
  if (sessions.length === 0) {
    for (const s of seedTrekSessions) {
      await setDoc(doc(db, COLLECTION, s.id), s);
    }
    return seedTrekSessions;
  }
  
  return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getAvailableTrekSessions(): Promise<TrekSession[]> {
  const sessions = await getAllTrekSessions();
  return sessions.filter(isSessionBookable);
}

export async function getTrekSessionById(id: string): Promise<TrekSession | undefined> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? (snap.data() as TrekSession) : undefined;
}

export async function sessionConflictExists(date: string, time: string, excludeId?: string): Promise<boolean> {
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

export async function saveTrekSession(session: TrekSession): Promise<{ ok: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTION, session.id), session);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteTrekSession(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function reserveSessionSlots(sessionId: string, paxCount: number): Promise<{ ok: boolean; session?: TrekSession; error?: string }> {
  const session = await getTrekSessionById(sessionId);
  if (!session) return { ok: false, error: "Session not found" };
  if (!isSessionBookable(session)) return { ok: false, error: "Session not available" };
  if (getSessionSlotsRemaining(session) < paxCount) {
    return { ok: false, error: "Not enough slots for this date" };
  }

  const updated: TrekSession = {
    ...session,
    bookedCount: session.bookedCount + paxCount,
    status: session.bookedCount + paxCount >= session.maxSlots ? "full" : session.status,
    updatedAt: new Date().toISOString(),
  };

  const result = await saveTrekSession(updated);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, session: updated };
}

export async function releaseSessionSlots(sessionId: string, paxCount: number): Promise<{ ok: boolean; error?: string }> {
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
