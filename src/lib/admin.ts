/**
 * Pure helpers shared by the owner dashboard (server and client).
 * All calendar logic is in Asia/Manila, the business timezone.
 */
import type { BookingRequest, TrekSession } from "@/types";

const MANILA = "Asia/Manila";

/** Hours elapsed since an ISO timestamp. */
export function hoursSince(iso: string, now: number = Date.now()): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (now - t) / 3_600_000);
}

/** Compact age, e.g. "12m ago", "26h ago", "3d ago". */
export function ageLabel(iso: string, now: number = Date.now()): string {
  const h = hoursSince(iso, now);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 48) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Reply urgency against the 24–48 hour promise made to hikers. */
export function ageTone(iso: string, now: number = Date.now()): "ok" | "warn" | "late" {
  const h = hoursSince(iso, now);
  if (h >= 48) return "late";
  if (h >= 24) return "warn";
  return "ok";
}

/** "Oct 2, 3:15 PM" in Manila time. */
export function formatManilaDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", {
    timeZone: MANILA,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Sat, Oct 12" for a YYYY-MM-DD date (calendar date, no timezone shift). */
export function formatShortDate(date: string | null | undefined): string {
  if (!date) return "Date to confirm";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
}

/** YYYY-MM-DD plus `days`, as a calendar date. */
export function addDaysISO(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's long label in Manila, e.g. "Friday, October 2". */
export function todayLabelManila(now: Date = new Date()): string {
  return now.toLocaleDateString("en-PH", {
    timeZone: MANILA,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function isActive(b: BookingRequest): boolean {
  return b.status !== "cancelled";
}

/** The trek date a booking is for (session date for group treks, requested date for private). */
export function trekDateOf(b: BookingRequest, sessions?: Map<string, TrekSession>): string | null {
  if (b.sessionId && sessions?.has(b.sessionId)) return sessions.get(b.sessionId)!.date;
  return b.preferredDate ?? null;
}

/** Confirmed and pending ("held") pax on a hiking day. Pending bookings already hold slots. */
export function sessionPax(sessionId: string, bookings: BookingRequest[]): { confirmed: number; held: number } {
  let confirmed = 0;
  let held = 0;
  for (const b of bookings) {
    if (b.sessionId !== sessionId) continue;
    if (b.status === "confirmed") confirmed += b.paxCount || 0;
    else if (b.status === "pending") held += b.paxCount || 0;
  }
  return { confirmed, held };
}

export function safeTotal(b: BookingRequest): number {
  return Number.isFinite(b.estimatedTotal) ? b.estimatedTotal : 0;
}

/** Digits-and-plus only, for tel:/sms: links. */
export function phoneHref(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** Plain-text roster for copying into SMS or notes. */
export function rosterText(session: TrekSession, bookings: BookingRequest[]): string {
  const active = bookings.filter((b) => b.sessionId === session.id && isActive(b));
  const pax = active.reduce((n, b) => n + (b.paxCount || 0), 0);
  const lines = [
    `${formatShortDate(session.date)} · ${session.time} · ${pax} pax`,
    ...active.map((b, i) => {
      const names = [b.leadName, ...(b.participantNames ?? []).filter(Boolean)].join(", ");
      return `${i + 1}. ${b.leadName} (${b.paxCount} pax, ${b.status}) · ${b.phone} · Emergency: ${b.emergencyContactName} ${b.emergencyContactPhone}${names !== b.leadName ? ` · Group: ${names}` : ""}`;
    }),
  ];
  return lines.join("\n");
}
