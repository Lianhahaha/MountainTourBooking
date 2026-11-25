"use client";

import { Fragment, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BookingRequest, BookingStatus, TrekSession } from "@/types";
import { Box, BoxHeader } from "@/components/Box";
import { Icon } from "@/components/Icon";
import {
  CountPill,
  EmptyState,
  Notice,
  PageHeader,
  SkeletonRows,
  StatusPill,
} from "@/components/admin/ui";
import {
  ageLabel,
  ageTone,
  formatManilaDateTime,
  formatShortDate,
  phoneHref,
  safeTotal,
  trekDateOf,
} from "@/lib/admin";
import { cn, formatPrice, todayInManila } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

type TabId = "needs-reply" | "upcoming" | "past" | "cancelled";
type Kind = "all" | "group" | "private";
type ActionKind = "approve" | "decline" | "cancel";

const TABS: { id: TabId; label: string; sortHint: string; empty: string }[] = [
  { id: "needs-reply", label: "Needs reply", sortHint: "Oldest first", empty: "All caught up" },
  { id: "upcoming", label: "Upcoming", sortHint: "Soonest trek first", empty: "No upcoming treks." },
  { id: "past", label: "Past", sortHint: "Latest trek first", empty: "No past treks yet." },
  { id: "cancelled", label: "Cancelled", sortHint: "Newest first", empty: "No cancelled bookings." },
];

const KINDS: { id: Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "group", label: "Group" },
  { id: "private", label: "Private" },
];

const REASONS = [
  { id: "full", label: "Fully booked", text: "Sorry, this hiking day is fully booked." },
  {
    id: "weather",
    label: "Weather or DENR closure",
    text: "Sorry, the trail is closed on this date because of the weather or a DENR closure.",
  },
  {
    id: "unreachable",
    label: "Couldn't reach you",
    text: "Sorry, we couldn't reach you to confirm the details of your booking.",
  },
  { id: "other", label: "Other", text: "" },
] as const;

type ReasonId = (typeof REASONS)[number]["id"];

const NOTE_MAX = 1000;

const VERBS: Record<ActionKind, string> = {
  approve: "Approved",
  decline: "Declined",
  cancel: "Cancelled",
};

/** Small secondary button: 36px on desktop, lifted to 44px on touch by the global rule. */
const BTN_SM_BASE = "btn-secondary gap-1.5! py-1.5! pointer-fine:min-h-9! disabled:opacity-60";
const BTN_SM = `${BTN_SM_BASE} px-3.5!`;
/** Call / Text / Email share a 3-column row on phones, so they pad tighter there. */
const BTN_CONTACT = `${BTN_SM_BASE} px-2! sm:px-3.5!`;

interface Loaded {
  bookings: BookingRequest[];
  sessions: Map<string, TrekSession>;
  /** True when the hiking-day list loaded cleanly, so a missing day really is gone. */
  sessionsOk: boolean;
  bookingsError: string | null;
  sessionsError: string | null;
  loadedAt: number;
  today: string;
}

interface Row {
  booking: BookingRequest;
  tab: TabId;
  trekDate: string | null;
  trekTime: string | null;
  dayCancelled: boolean;
  dayMissing: boolean;
}

interface ResultNotice {
  tone: "success" | "warning" | "error" | "info";
  text: ReactNode;
  detail?: string;
  bookingId?: string;
}

interface PatchResponse {
  booking?: unknown;
  emailSent?: boolean;
  warning?: string;
  unchanged?: boolean;
  error?: string;
}

type LoadOutcome = { kind: "auth" } | { kind: "error"; message: string } | { kind: "ok"; data: Loaded };

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** Bookings plus hiking days. Never throws; a failed hiking-day read only degrades the view. */
async function fetchBookingsData(): Promise<LoadOutcome> {
  try {
    const [bookingsRes, sessionsRes] = await Promise.all([
      fetch("/api/bookings", { cache: "no-store" }),
      fetch("/api/trek-sessions", { cache: "no-store" }).catch(() => null),
    ]);
    if (bookingsRes.status === 401 || sessionsRes?.status === 401) return { kind: "auth" };
    if (!bookingsRes.ok) {
      return { kind: "error", message: `Couldn't load bookings (error ${bookingsRes.status}).` };
    }
    const bookingsJson: unknown = await bookingsRes.json();
    const sessionsJson: unknown = sessionsRes?.ok ? await sessionsRes.json().catch(() => null) : null;

    const sessionsError = sessionsJson === null ? "Hiking days didn't load." : readError(sessionsJson);
    const sessions = readList<unknown>(sessionsJson, "sessions").filter(isSession);
    return {
      kind: "ok",
      data: {
        bookings: readList<unknown>(bookingsJson, "bookings").filter(isBooking),
        sessions: new Map(sessions.map((s) => [s.id, s])),
        sessionsOk: !sessionsError,
        bookingsError: readError(bookingsJson),
        sessionsError,
        loadedAt: Date.now(),
        today: todayInManila(),
      },
    };
  } catch {
    return { kind: "error", message: "Couldn't reach the server. Check your signal and retry." };
  }
}

function tabFromParams(params: { get(name: string): string | null }): TabId {
  const tab = params.get("tab");
  const match = TABS.find((t) => t.id === tab);
  if (match) return match.id;
  switch (params.get("filter")) {
    case "confirmed":
      return "upcoming";
    case "cancelled":
      return "cancelled";
    default:
      return "needs-reply"; // pending, all, or nothing
  }
}

function tabOf(status: BookingStatus, trekDate: string | null, today: string): TabId {
  if (status === "pending") return "needs-reply";
  if (status === "cancelled") return "cancelled";
  // Confirmed without a date stays upcoming: the trek still has to happen.
  return trekDate && trekDate < today ? "past" : "upcoming";
}

function deriveRows(data: Loaded): Row[] {
  return data.bookings.map((b) => {
    const session = b.sessionId ? data.sessions.get(b.sessionId) : undefined;
    const trekDate = trekDateOf(b, data.sessions);
    const active = b.status !== "cancelled";
    return {
      booking: b,
      tab: tabOf(b.status, trekDate, data.today),
      trekDate,
      trekTime: session?.time || b.trekTime || null,
      dayCancelled: active && session?.status === "cancelled",
      dayMissing: active && !!b.sessionId && data.sessionsOk && !session,
    };
  });
}

function timeOf(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Ascending by YYYY-MM-DD, missing dates last. */
function compareDates(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}

function sortRows(rows: Row[], tab: TabId): Row[] {
  const copy = [...rows];
  const created = (r: Row) => timeOf(r.booking.createdAt);
  switch (tab) {
    case "needs-reply":
      return copy.sort((a, b) => created(a) - created(b));
    case "upcoming":
      return copy.sort((a, b) => compareDates(a.trekDate, b.trekDate) || created(a) - created(b));
    case "past":
      return copy.sort((a, b) => compareDates(b.trekDate, a.trekDate) || created(b) - created(a));
    case "cancelled":
      return copy.sort((a, b) => created(b) - created(a));
  }
}

function digitsOf(s: string): string {
  return s.replace(/\D/g, "");
}

function matchesQuery(b: BookingRequest, q: string): boolean {
  if (!q) return true;
  const hay = [b.leadName, b.phone, b.email, b.id].map((v) => (v ?? "").toLowerCase()).join("\n");
  if (hay.includes(q)) return true;
  // Phone numbers: ignore spacing, and treat 0917… and +63917… as the same number.
  if (!/^[\d\s+().-]+$/.test(q)) return false;
  const qd = digitsOf(q);
  if (qd.length < 3) return false;
  const pd = digitsOf(b.phone ?? "");
  return pd.includes(qd) || (qd.startsWith("0") && pd.includes(`63${qd.slice(1)}`));
}

function matchesKind(b: BookingRequest, kind: Kind): boolean {
  if (kind === "all") return true;
  return (kind === "private") === (b.tripType === "private");
}

function readList<T>(json: unknown, key: string): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && typeof json === "object") {
    const value = (json as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function readError(json: unknown): string | null {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const e = (json as Record<string, unknown>).error;
    if (typeof e === "string" && e) return e;
  }
  return null;
}

function isBooking(x: unknown): x is BookingRequest {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as BookingRequest).id === "string" &&
    typeof (x as BookingRequest).status === "string"
  );
}

function isSession(x: unknown): x is TrekSession {
  return !!x && typeof x === "object" && typeof (x as TrekSession).id === "string";
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  });
}

function rowDomId(id: string): string {
  return `booking-${id}`;
}

function firstName(b: BookingRequest): string {
  return b.leadName?.trim().split(/\s+/)[0] || "the hiker";
}

function whenText(r: Row): string {
  return r.trekDate ? formatShortDate(r.trekDate) : "a date still to confirm";
}

function consequenceText(action: ActionKind, r: Row): string {
  const b = r.booking;
  const pax = `${b.paxCount} pax`;
  const email = b.email ? ` We'll email ${b.email}.` : "";
  const slots = b.sessionId ? " Their slots open up again." : "";
  if (action === "approve") {
    return `Approve ${pax} for ${whenText(r)} · ${formatPrice(safeTotal(b))} due on trek day.${email}`;
  }
  return `${action === "decline" ? "Decline" : "Cancel"} ${pax} for ${whenText(r)}.${slots}${email}`;
}

/** Why Approve would be refused by the server, if it would. */
function approveBlocker(r: Row, today: string): string | null {
  if (r.dayCancelled) return "This hiking day is cancelled. Decline to let them know.";
  if (r.dayMissing) return "This hiking day is no longer on the schedule. Decline to let them know.";
  if (r.trekDate && r.trekDate < today) return "This date has passed. Decline to close the request.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "tabular inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

function AgePill({ iso, now }: { iso: string; now: number }) {
  const tone = ageTone(iso, now);
  return (
    <Pill
      className={
        tone === "late"
          ? "border-danger/40 bg-danger-muted text-danger"
          : tone === "warn"
            ? "border-warning/40 bg-warning-muted text-warning"
            : "border-border bg-surface text-muted"
      }
    >
      <span className="sr-only">Sent </span>
      {ageLabel(iso, now)}
    </Pill>
  );
}

/** "4 pax · Sat, Oct 12 · 5:00 AM · ₱18,000", wrapping only between items. */
function Meta({ parts, className }: { parts: (string | null | undefined)[]; className?: string }) {
  return (
    <span className={cn("tabular", className)}>
      {parts
        .filter((p): p is string => !!p)
        .map((p, i) => (
          <Fragment key={i}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">{p}</span>
          </Fragment>
        ))}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 min-w-0 text-foreground sm:mt-0">{children}</dd>
    </div>
  );
}

function ExportLink() {
  return (
    <a href="/api/admin/export-bookings" download className={BTN_SM}>
      <Icon name="doc" className="h-4 w-4 text-muted" />
      Export CSV
    </a>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss"
      className="-m-1 inline-flex items-center justify-center rounded-md p-1 text-muted transition-colors hover:text-foreground"
    >
      <Icon name="close" className="h-4 w-4" />
    </button>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="link-accent text-sm font-semibold">
      Retry
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm panel                                                       */
/* ------------------------------------------------------------------ */

function ConfirmPanel({
  row,
  action,
  onBack,
  onSaved,
  onConflict,
  onAuthExpired,
  onReload,
}: {
  row: Row;
  action: ActionKind;
  onBack: () => void;
  onSaved: (row: Row, action: ActionKind, res: PatchResponse) => void;
  onConflict: (message: string, booking: unknown) => void;
  onAuthExpired: () => void;
  onReload: () => void;
}) {
  const b = row.booking;
  const [note, setNote] = useState("");
  const [reason, setReason] = useState<ReasonId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();
  const noteId = useId();
  const hintId = useId();
  const headingRef = useRef<HTMLParagraphElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Move focus to the consequence line so it is read out and scrolled into view.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function pickReason(id: ReasonId) {
    const picked = REASONS.find((r) => r.id === id);
    if (!picked) return;
    setReason(id);
    // Prefill only over an empty note or another chip's text, never over typed words.
    const current = note.trim();
    if (current === "" || REASONS.some((r) => r.text && r.text === current)) setNote(picked.text);
    if (id === "other") noteRef.current?.focus();
  }

  async function submit() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const ownerNote = note.trim();
    let res: Response;
    try {
      res = await fetch(`/api/bookings/${encodeURIComponent(b.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "confirmed" : "cancelled",
          expectedStatus: b.status,
          ...(ownerNote ? { ownerNote } : {}),
        }),
      });
    } catch {
      setSaving(false);
      setError("Couldn't reach the server. Check your signal and try again.");
      return;
    }
    const json = (await res.json().catch(() => ({}))) as PatchResponse;
    setSaving(false);

    if (res.status === 401) {
      setError("Your session expired. Log in again, then retry.");
      onAuthExpired();
      return;
    }
    if (res.status === 409) {
      onBack();
      onConflict(json.error || "This booking changed somewhere else. The list was reloaded.", json.booking);
      return;
    }
    if (!res.ok) {
      setError(json.error || `Couldn't save (error ${res.status}). Try again.`);
      if (res.status === 404) onReload();
      return;
    }
    onSaved(row, action, json);
  }

  const confirmLabel =
    action === "approve" ? "Approve and email" : action === "decline" ? "Decline and email" : "Cancel and email";

  return (
    <div role="group" aria-labelledby={headingId} className="space-y-3">
      <p
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        className="tabular text-sm font-semibold text-foreground outline-none! wrap-anywhere"
      >
        {consequenceText(action, row)}
      </p>

      {action !== "approve" && (
        <fieldset>
          <legend className="text-[13px] font-medium text-foreground">Reason</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={reason === r.id}
                disabled={saving}
                onClick={() => pickReason(r.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60",
                  reason === r.id
                    ? "border-accent/60 bg-accent-muted text-foreground"
                    : "border-border bg-surface text-muted hover:border-muted hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={noteId} className="text-[13px] font-medium text-foreground">
            Message to {firstName(b)} <span className="font-normal text-muted">(optional)</span>
          </label>
          <span className="tabular shrink-0 text-xs text-muted">
            {note.length}/{NOTE_MAX}
          </span>
        </div>
        <textarea
          ref={noteRef}
          id={noteId}
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          disabled={saving}
          onChange={(e) => setNote(e.target.value)}
          aria-describedby={hintId}
          placeholder={action === "approve" ? "Meet-up reminders, what to bring" : "A short note for them"}
          className="field-input mt-1 resize-y"
        />
        <p id={hintId} className="mt-1 text-xs text-muted">
          Included in the email.
        </p>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-[13px] text-danger">
          <Icon name="close" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className={action === "approve" ? "btn-cta-sm" : cn(BTN_SM, "text-danger!")}
        >
          {saving ? "Saving…" : confirmLabel}
        </button>
        <button type="button" onClick={onBack} disabled={saving} className={BTN_SM}>
          Back
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row and details                                                     */
/* ------------------------------------------------------------------ */

interface RowHandlers {
  onSaved: (row: Row, action: ActionKind, res: PatchResponse) => void;
  onConflict: (message: string, booking: unknown) => void;
  onAuthExpired: () => void;
  onReload: () => void;
}

function BookingDetails({ id, row, today, handlers }: { id: string; row: Row; today: string; handlers: RowHandlers }) {
  const b = row.booking;
  const [action, setAction] = useState<ActionKind | null>(null);
  const tel = phoneHref(b.phone ?? "");
  const emergencyTel = phoneHref(b.emergencyContactPhone ?? "");
  const participants = (b.participantNames ?? []).filter((n) => typeof n === "string" && n.trim());
  const canAct = row.tab === "needs-reply" || row.tab === "upcoming";
  const blocker = row.tab === "needs-reply" ? approveBlocker(row, today) : null;
  const checks: [boolean, string, string][] = [
    [b.fitnessConfirmed === true, "Fit for the climb", "Fitness not confirmed"],
    [b.ageConfirmed === true, "Meets the age rule", "Age not confirmed"],
    [b.waiverAccepted === true, "Waiver accepted", "Waiver not accepted"],
  ];

  return (
    <div id={id} className="px-4 pb-4 pt-3">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <a href={`tel:${tel}`} className={BTN_CONTACT}>
          <Icon name="phone" className="h-4 w-4 shrink-0 text-muted" />
          Call
        </a>
        <a href={`sms:${tel}`} className={BTN_CONTACT}>
          <Icon name="chat" className="h-4 w-4 shrink-0 text-muted" />
          Text
        </a>
        <a href={`mailto:${b.email}`} className={BTN_CONTACT}>
          <Icon name="mail" className="h-4 w-4 shrink-0 text-muted" />
          Email
        </a>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <Detail label="Contact">
          <span className="tabular block">{b.phone}</span>
          <span className="block break-all text-muted">{b.email}</span>
        </Detail>
        <Detail label="Emergency contact">
          <span className="block">{b.emergencyContactName || "Not given"}</span>
          {b.emergencyContactPhone && (
            <span className="flex flex-wrap items-center gap-x-3">
              <span className="tabular text-muted">{b.emergencyContactPhone}</span>
              <a
                href={`tel:${emergencyTel}`}
                className="link-accent inline-flex items-center gap-1 font-medium pointer-coarse:min-h-11"
              >
                <Icon name="phone" className="h-3.5 w-3.5" />
                Call
              </a>
            </span>
          )}
        </Detail>
        <Detail label="Trek">
          <span className="block">{b.tripTitle}</span>
          <Meta
            className="block text-muted"
            parts={[formatShortDate(row.trekDate), row.trekTime, `${b.paxCount} pax`, formatPrice(safeTotal(b))]}
          />
        </Detail>
        {participants.length > 0 && (
          <Detail label="Participants">
            <ul className="space-y-0.5">
              {participants.map((name, i) => (
                <li key={i} className="break-words">
                  {name}
                </li>
              ))}
            </ul>
          </Detail>
        )}
        {b.locationPreference?.trim() && <Detail label="Trail preference">{b.locationPreference}</Detail>}
        {b.notes?.trim() && (
          <Detail label="Notes">
            <p className="whitespace-pre-wrap break-words">{b.notes}</p>
          </Detail>
        )}
        <Detail label="Confirmations">
          <ul className="space-y-1">
            {checks.map(([ok, yes, no]) => (
              <li key={yes} className="flex items-start gap-1.5">
                <Icon
                  name={ok ? "check" : "close"}
                  className={cn("mt-0.5 h-4 w-4 shrink-0", ok ? "text-success" : "text-warning")}
                />
                <span className={ok ? undefined : "text-warning"}>{ok ? yes : no}</span>
              </li>
            ))}
          </ul>
        </Detail>
      </dl>

      <p className="tabular mt-3 break-all text-xs text-muted">
        Booking <span className="select-all">{b.id}</span> · Submitted {formatManilaDateTime(b.createdAt)}
      </p>

      {canAct && (
        <div className="mt-4 border-t border-border pt-3">
          {action ? (
            <ConfirmPanel
              key={action}
              row={row}
              action={action}
              onBack={() => setAction(null)}
              {...handlers}
            />
          ) : (
            <>
              {blocker && (
                <p className="mb-2.5 flex items-start gap-1.5 text-[13px] text-warning">
                  <Icon name="clock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{blocker}</span>
                </p>
              )}
              {row.tab === "upcoming" && row.dayCancelled && (
                <p className="mb-2.5 flex items-start gap-1.5 text-[13px] text-warning">
                  <Icon name="clock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>This hiking day is cancelled. Cancel the booking to let them know.</span>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {row.tab === "needs-reply" ? (
                  <>
                    <button
                      type="button"
                      className="btn-cta-sm"
                      disabled={!!blocker}
                      onClick={() => setAction("approve")}
                    >
                      <Icon name="check" className="h-4 w-4" />
                      Approve
                    </button>
                    <button type="button" className={BTN_SM} onClick={() => setAction("decline")}>
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={cn(BTN_SM, "text-danger!")}
                    onClick={() => setAction("cancel")}
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BookingRow({
  row,
  now,
  today,
  expanded,
  onToggle,
  handlers,
}: {
  row: Row;
  now: number;
  today: string;
  expanded: boolean;
  onToggle: () => void;
  handlers: RowHandlers;
}) {
  const b = row.booking;
  const domId = rowDomId(b.id);
  const detailsId = `${domId}-details`;

  return (
    <li id={domId}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface focus-visible:-outline-offset-2!",
          expanded && "bg-surface"
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 break-words font-semibold text-foreground">{b.leadName || "No name"}</span>
            {b.tripType === "private" && <Pill className="border-done/40 bg-done-muted text-done">Private</Pill>}
            {row.dayCancelled && <Pill className="border-danger/40 bg-danger-muted text-danger">Day cancelled</Pill>}
          </span>
          <Meta
            className="mt-0.5 block text-[13px] text-muted"
            parts={[`${b.paxCount} pax`, formatShortDate(row.trekDate), row.trekTime, formatPrice(safeTotal(b))]}
          />
        </span>
        <span className="flex shrink-0 items-center gap-2 pt-0.5">
          {row.tab === "needs-reply" ? <AgePill iso={b.createdAt} now={now} /> : <StatusPill status={b.status} />}
          <Icon
            name="chevronDown"
            className={cn("h-4 w-4 text-muted motion-safe:transition-transform", expanded && "rotate-180")}
          />
        </span>
      </button>
      {expanded && <BookingDetails id={detailsId} row={row} today={today} handlers={handlers} />}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function BookingsScreen() {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<TabId>(() => tabFromParams(searchParams));
  const [seenParams, setSeenParams] = useState(paramsKey);
  const [pendingFocus, setPendingFocus] = useState<string | null>(() => searchParams.get("focus"));
  const [focusMissing, setFocusMissing] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{ id: string; n: number } | null>(null);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [result, setResult] = useState<ResultNotice | null>(null);

  const seq = useRef(0);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  // The URL changed (a link elsewhere in the dashboard, back/forward): follow it.
  if (seenParams !== paramsKey) {
    setSeenParams(paramsKey);
    setTab(tabFromParams(searchParams));
    setPendingFocus(searchParams.get("focus"));
  }

  // Only the latest request may write state, so a slow older one can't undo a newer result.
  const load = useCallback(() => {
    const mine = ++seq.current;
    return fetchBookingsData().then((outcome) => {
      if (mine !== seq.current) return;
      setRefreshing(false);
      if (outcome.kind === "auth") {
        setAuthExpired(true);
      } else if (outcome.kind === "error") {
        setLoadError(outcome.message);
      } else {
        setData(outcome.data);
        setAuthExpired(false);
        setLoadError(null);
      }
    });
  }, []);

  // First load, then again whenever the owner comes back to this tab or app.
  useEffect(() => {
    void load();
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      setRefreshing(true);
      void load();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [load]);

  const rows = useMemo(() => (data ? deriveRows(data) : []), [data]);

  // ?focus=<id>: once the data is in, open that booking in its tab.
  if (pendingFocus && data) {
    const target = rows.find((r) => r.booking.id === pendingFocus);
    setPendingFocus(null);
    if (target) {
      setTab(target.tab);
      setExpandedId(target.booking.id);
      setQuery("");
      setKind("all");
      setFocusMissing(null);
      setScrollTarget((prev) => ({ id: target.booking.id, n: (prev?.n ?? 0) + 1 }));
    } else {
      setFocusMissing(pendingFocus);
    }
  }

  useEffect(() => {
    if (!scrollTarget) return;
    document.getElementById(rowDomId(scrollTarget.id))?.scrollIntoView({ block: "start" });
  }, [scrollTarget]);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ block: "nearest" });
  }, [result]);

  // Keep the active tab visible when the tab row scrolls sideways on a phone.
  useEffect(() => {
    const list = tabListRef.current;
    const el = tabRefs.current[TABS.findIndex((t) => t.id === tab)];
    if (!list || !el) return;
    if (el.offsetLeft < list.scrollLeft || el.offsetLeft + el.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, el.offsetLeft - 16) });
    }
  }, [tab]);

  function refresh() {
    setRefreshing(true);
    void load();
  }

  function selectTab(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    params.delete("filter");
    params.delete("focus");
    params.set("tab", next);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    selectTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  function clearFilters() {
    setQuery("");
    setKind("all");
  }

  function viewBooking(id: string) {
    const target = rows.find((r) => r.booking.id === id);
    if (!target) return;
    clearFilters();
    selectTab(target.tab);
    setExpandedId(id);
    setScrollTarget((prev) => ({ id, n: (prev?.n ?? 0) + 1 }));
  }

  function applyBooking(next: unknown) {
    if (!isBooking(next)) return;
    setData((prev) =>
      prev ? { ...prev, bookings: prev.bookings.map((b) => (b.id === next.id ? next : b)) } : prev
    );
  }

  const handlers: RowHandlers = {
    onSaved(row, action, res) {
      const b = row.booking;
      const name = b.leadName || "the hiker";
      applyBooking(res.booking);
      setExpandedId(null);
      let notice: ResultNotice;
      if (res.unchanged) {
        notice = {
          tone: "info",
          text: `${name} was already ${action === "approve" ? "confirmed" : "cancelled"}. Nothing changed and no email went out.`,
          bookingId: b.id,
        };
      } else if (res.emailSent) {
        notice = {
          tone: "success",
          text: (
            <>
              {VERBS[action]} {name} · email sent to <span className="break-all">{b.email}</span>
            </>
          ),
          bookingId: b.id,
        };
      } else {
        notice = {
          tone: "warning",
          text: (
            <>
              {VERBS[action]} {name}, but the email didn&apos;t send. Text them at{" "}
              <a href={`sms:${phoneHref(b.phone ?? "")}`} className="link-accent tabular font-semibold">
                {b.phone}
              </a>
              .
            </>
          ),
          bookingId: b.id,
        };
      }
      if (res.warning) {
        notice = { ...notice, tone: notice.tone === "success" ? "warning" : notice.tone, detail: res.warning };
      }
      setResult(notice);
      refresh();
    },
    onConflict(message, booking) {
      applyBooking(booking);
      setResult({ tone: "error", text: message });
      refresh();
    },
    onAuthExpired() {
      setAuthExpired(true);
    },
    onReload: refresh,
  };

  // Derived view.
  const q = query.trim().toLowerCase();
  const filtering = q !== "" || kind !== "all";
  const matching = rows.filter((r) => matchesKind(r.booking, kind) && matchesQuery(r.booking, q));
  const counts: Record<TabId, number> = { "needs-reply": 0, upcoming: 0, past: 0, cancelled: 0 };
  // Reply-urgency of the Needs reply counter: red past 48h, amber past 24h.
  let late = 0;
  let waiting = 0;
  for (const r of matching) {
    counts[r.tab] += 1;
    if (r.tab === "needs-reply" && data) {
      const tone = ageTone(r.booking.createdAt, data.loadedAt);
      if (tone === "late") late += 1;
      else if (tone === "warn") waiting += 1;
    }
  }
  const visible = sortRows(
    matching.filter((r) => r.tab === tab),
    tab
  );
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const elsewhere = TABS.filter((t) => t.id !== tab && counts[t.id] > 0);
  const loading = !data && !loadError && !authExpired;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle={
          refreshing ? (
            <span className="text-xs">Updating…</span>
          ) : data ? (
            <span className="tabular text-xs">Updated {formatClock(data.loadedAt)}</span>
          ) : undefined
        }
        actions={<ExportLink />}
      />

      <div className="mb-4 space-y-2.5 empty:hidden">
        {authExpired && (
          <Notice
            tone="error"
            action={
              <Link href="/admin/login" className="link-accent text-sm font-semibold">
                Log in
              </Link>
            }
          >
            Session expired. Log in again to manage bookings.
          </Notice>
        )}
        {result && (
          <div ref={resultRef}>
            <Notice
              tone={result.tone}
              action={
                <span className="flex items-center gap-3">
                  {result.bookingId && rows.some((r) => r.booking.id === result.bookingId) && (
                    <button
                      type="button"
                      onClick={() => viewBooking(result.bookingId!)}
                      className="link-accent text-sm font-semibold"
                    >
                      View
                    </button>
                  )}
                  <DismissButton onClick={() => setResult(null)} />
                </span>
              }
            >
              {result.text}
              {result.detail && <p className="mt-1 text-muted">{result.detail}</p>}
            </Notice>
          </div>
        )}
        {focusMissing && (
          <Notice tone="info" action={<DismissButton onClick={() => setFocusMissing(null)} />}>
            Couldn&apos;t find booking <span className="tabular break-all">{focusMissing}</span>.
          </Notice>
        )}
        {loadError && (
          <Notice tone="error" action={<RetryButton onClick={refresh} />}>
            {loadError}
          </Notice>
        )}
        {data?.bookingsError && (
          <Notice tone="error" action={<RetryButton onClick={refresh} />}>
            {data.bookingsError}
          </Notice>
        )}
        {data?.sessionsError && (
          <Notice tone="warning" action={<RetryButton onClick={refresh} />}>
            {data.sessionsError} Trek dates come from the booking, and cancelled days aren&apos;t flagged.
          </Notice>
        )}
      </div>

      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Booking status"
        className="relative flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((t, i) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`bookings-tab-${t.id}`}
              aria-selected={selected}
              aria-controls="bookings-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(t.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={cn(
                "group relative flex shrink-0 items-center py-1.5 text-sm focus-visible:-outline-offset-2!",
                selected ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors group-hover:bg-surface sm:px-2.5">
                {t.label}
                <CountPill
                  n={counts[t.id]}
                  tone={t.id === "needs-reply" ? (late > 0 ? "alert" : waiting > 0 ? "attention" : "neutral") : "neutral"}
                />
              </span>
              {selected && (
                <span aria-hidden="true" className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-tab-active" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <input
            id="booking-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email, or ID"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="field-input"
          />
        </div>
        <div
          role="group"
          aria-label="Trip type"
          className="grid grid-cols-3 gap-1 rounded-md border border-border bg-surface p-1 sm:inline-grid"
        >
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => setKind(k.id)}
              className={cn(
                "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                kind === k.id
                  ? "bg-surface-elevated text-foreground shadow-[var(--shadow)]"
                  : "text-muted hover:text-foreground"
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {data && filtering ? plural(visible.length, "result") : ""}
      </p>

      <div role="tabpanel" id="bookings-panel" aria-labelledby={`bookings-tab-${tab}`} className="mt-3">
        {loading ? (
          <Box>
            <SkeletonRows rows={4} />
          </Box>
        ) : !data ? null : visible.length > 0 ? (
          <Box>
            <BoxHeader>
              <p className="tabular text-[13px] font-semibold text-foreground">
                {filtering ? plural(visible.length, "result") : plural(visible.length, "booking")}
              </p>
              <p className="text-xs text-muted">{activeTab.sortHint}</p>
            </BoxHeader>
            <ul className="divide-y divide-border">
              {visible.map((r) => (
                <BookingRow
                  key={r.booking.id}
                  row={r}
                  now={data.loadedAt}
                  today={data.today}
                  expanded={expandedId === r.booking.id}
                  onToggle={() => setExpandedId((cur) => (cur === r.booking.id ? null : r.booking.id))}
                  handlers={handlers}
                />
              ))}
            </ul>
          </Box>
        ) : filtering ? (
          <EmptyState
            icon="question"
            title="0 results"
            body={
              elsewhere.length > 0
                ? `Nothing in ${activeTab.label}. Found ${elsewhere
                    .map((t) => `${counts[t.id]} in ${t.label}`)
                    .join(", ")}.`
                : "Try a name, phone number, email, or booking ID."
            }
            action={
              <button type="button" onClick={clearFilters} className={BTN_SM}>
                Clear search
              </button>
            }
          />
        ) : tab === "needs-reply" ? (
          <EmptyState icon="check" title="All caught up" body="New booking requests show up here." />
        ) : (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            {activeTab.empty}
          </p>
        )}
      </div>
    </div>
  );
}

function BookingsFallback() {
  return (
    <div>
      <PageHeader title="Bookings" actions={<ExportLink />} />
      <Box>
        <SkeletonRows rows={4} />
      </Box>
    </div>
  );
}

export default function AdminBookingsPage() {
  // useSearchParams needs a Suspense boundary (Next 16 prerendering rules).
  return (
    <Suspense fallback={<BookingsFallback />}>
      <BookingsScreen />
    </Suspense>
  );
}
