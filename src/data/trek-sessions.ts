import type { TrekSession } from "@/types";

/** YYYY-MM-DD for `days` from now (Asia/Manila business date is handled by callers; seed is best-effort). */
function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seedSession(daysFromNow: number, time: string, notes: string): TrekSession {
  const date = isoDaysFromNow(daysFromNow);
  return {
    id: `session-${date}-${time.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
    date,
    time,
    maxSlots: 12,
    bookedCount: 0,
    status: "open",
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Seeds are generated relative to today so a fresh install always has
// bookable dates (hardcoded dates went stale and left the site empty).
export const seedTrekSessions: TrekSession[] = [
  seedSession(30, "6:00 AM", "Sta. Cruz trail jump-off. Meet at DENR checkpoint."),
  seedSession(60, "5:30 AM", ""),
];
