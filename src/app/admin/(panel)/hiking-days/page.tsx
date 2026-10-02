"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BookingRequest, TrekSession } from "@/types";
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
import { formatShortDate, isActive, phoneHref, rosterText, sessionPax } from "@/lib/admin";
import { cn, dateParts, formatDate, formatPrice, todayInManila } from "@/lib/utils";
import {
  formatWeekdayLabel,
  getMondayOfWeek,
  getWeekDatesFrom,
  shiftWeek,
} from "@/lib/week-dates";
import { getScheduledTrips } from "@/data/trips";

/* ------------------------------------------------------------------ */
/* Types and helpers                                                   */
/* ------------------------------------------------------------------ */

type AddMode = "bulk" | "single";
type SlotsValue = number | "";
type PanelKind = "edit" | "cancel" | "delete";
type Panel = { id: string; kind: PanelKind } | null;
type PageNotice = {
  tone: "error" | "warning" | "success" | "info";
  title: string;
  body?: string;
  details?: string[];
  /** Bring the notice into view (results of actions taken further down the page). */
  scroll?: boolean;
};
type EditBody = { date: string; time: string; maxSlots: number; notes: string; price: number | null };
type ApiResult = { ok: boolean; status: number; data: unknown };

/** Trip default shown when a hiking day has no custom price. */
const DEFAULT_PRICE: number | undefined = getScheduledTrips()[0]?.price;

const sharedDefaults = {
  time: "6:00 AM",
  maxSlots: 12 as SlotsValue,
  price: "",
  notes: "",
};

/** Compact secondary button for row actions (44px on touch via globals.css). */
const rowBtn =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:border-muted disabled:opacity-60 aria-expanded:border-accent/60 aria-expanded:bg-accent-muted pointer-coarse:min-h-11";
const dangerBtn =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-[13px] font-semibold text-danger transition-colors hover:border-danger/60 hover:bg-danger-muted disabled:opacity-60 pointer-coarse:min-h-11";
const labelCls = "block text-[13px] font-medium text-foreground";
const hintCls = "mt-1 text-xs text-muted";

function parseSlotsInput(value: string): SlotsValue {
  if (value === "") return "";
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? "" : n;
}

function slotsToSubmit(value: SlotsValue): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : 12;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function sameTime(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function errorOf(data: unknown): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return null;
}

/** Accepts `{ [key]: T[] }` (current contract) or a bare array (older responses). */
function listOf<T>(data: unknown, key: string): T[] | null {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const v = (data as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v as T[];
  }
  return null;
}

async function callApi(url: string, init?: RequestInit): Promise<ApiResult> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function failureMessage(r: ApiResult, fallback: string): string {
  if (r.status === 401) return "Your login expired. Log in again to continue.";
  if (r.status === 0) return "Couldn't reach the server. Check your connection and try again.";
  return errorOf(r.data) ?? fallback;
}

type LoadResult = {
  unauthorized: boolean;
  sessions: TrekSession[] | null;
  sessionsError: string | null;
  bookings: BookingRequest[] | null;
  bookingsError: string | null;
};

async function fetchScreenData(): Promise<LoadResult> {
  const [s, b] = await Promise.all([callApi("/api/trek-sessions"), callApi("/api/bookings")]);
  const out: LoadResult = {
    unauthorized: s.status === 401 || b.status === 401,
    sessions: null,
    sessionsError: null,
    bookings: null,
    bookingsError: null,
  };

  if (!s.ok) {
    out.sessionsError = failureMessage(s, "Couldn't load hiking days.");
  } else {
    const list = listOf<TrekSession>(s.data, "sessions");
    const err = errorOf(s.data);
    if (err) out.sessionsError = err;
    else if (!list) out.sessionsError = "The server sent an unexpected response.";
    else out.sessions = list;
  }

  if (!b.ok) {
    out.bookingsError = failureMessage(b, "Couldn't load bookings.");
  } else {
    const list = listOf<BookingRequest>(b.data, "bookings");
    const err = errorOf(b.data);
    if (err) out.bookingsError = err;
    else if (!list) out.bookingsError = "The server sent an unexpected response.";
    else out.bookings = list;
  }

  return out;
}

/** "Oct 12" for a YYYY-MM-DD date. */
function monthDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function activeOn(sessionId: string, bookings: BookingRequest[]): BookingRequest[] {
  return bookings.filter((b) => b.sessionId === sessionId && isActive(b));
}

function paxOf(list: BookingRequest[]): number {
  return list.reduce((n, b) => n + (b.paxCount || 0), 0);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminHikingDaysPage() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <HikingDaysScreen />
    </Suspense>
  );
}

function ScreenFallback() {
  return (
    <div>
      <PageHeader title="Hiking days" subtitle="Only these dates appear in the booking form." />
      <Box>
        <BoxHeader>
          <span className="text-[13px] font-semibold text-foreground">Upcoming</span>
        </BoxHeader>
        <SkeletonRows rows={4} />
      </Box>
    </div>
  );
}

function HikingDaysScreen() {
  const searchParams = useSearchParams();
  const rosterParam = searchParams.get("roster");

  const [sessions, setSessions] = useState<TrekSession[]>([]);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [openRosters, setOpenRosters] = useState<Set<string>>(
    () => new Set(rosterParam ? [rosterParam] : [])
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [pastOpen, setPastOpen] = useState<boolean | null>(null);

  const noticeRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const scrolledRef = useRef(false);

  const applyResult = useCallback((result: LoadResult) => {
    setAuthExpired(result.unauthorized);
    if (result.sessions) {
      setSessions(result.sessions);
      setSessionsReady(true);
    }
    setSessionsError(result.sessionsError);
    setBookings(result.bookings);
    setBookingsError(result.bookingsError);
    setLoading(false);
  }, []);

  /** Fetch both lists; a newer request wins over a slower older one. */
  const load = useCallback((): Promise<void> => {
    const requestId = ++requestRef.current;
    return fetchScreenData().then((result) => {
      if (requestId === requestRef.current) applyResult(result);
    });
  }, [applyResult]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayInManila();

  const { upcoming, past } = useMemo(() => {
    const up = sessions
      .filter((s) => s.date >= today && s.status !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date));
    const done = sessions
      .filter((s) => s.date < today || s.status === "cancelled")
      .sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming: up, past: done };
  }, [sessions, today]);

  const rosterTargetInPast = !!rosterParam && past.some((s) => s.id === rosterParam);
  const pastIsOpen = pastOpen ?? rosterTargetInPast;

  // ?roster=<id> (linked from Today): open that roster and bring the day into view once.
  useEffect(() => {
    if (loading || !rosterParam || scrolledRef.current) return;
    const el = document.getElementById(`day-${rosterParam}`);
    if (!el) return;
    scrolledRef.current = true;
    el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }, [loading, rosterParam, sessions]);

  useEffect(() => {
    if (notice?.scroll) {
      noticeRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
    }
  }, [notice]);

  async function retry() {
    setRetrying(true);
    await load();
    setRetrying(false);
  }

  const toggleRoster = useCallback((id: string) => {
    setOpenRosters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePanel = useCallback((id: string, kind: PanelKind) => {
    setPanel((p) => (p && p.id === id && p.kind === kind ? null : { id, kind }));
  }, []);

  const closePanel = useCallback(() => setPanel(null), []);

  function noteAuth(r: ApiResult) {
    if (r.status === 401) setAuthExpired(true);
  }

  async function saveEdit(session: TrekSession, body: EditBody): Promise<string | null> {
    const r = await callApi(
      `/api/trek-sessions/${encodeURIComponent(session.id)}`,
      jsonInit("PATCH", body)
    );
    if (!r.ok) {
      noteAuth(r);
      return failureMessage(r, "Couldn't save changes.");
    }
    setPanel(null);
    setNotice({ tone: "success", title: `Saved ${formatShortDate(body.date)} · ${body.time}.` });
    void load();
    return null;
  }

  async function cancelDay(session: TrekSession, reason: string): Promise<void> {
    const r = await callApi(
      `/api/trek-sessions/${encodeURIComponent(session.id)}`,
      jsonInit("PATCH", reason ? { status: "cancelled", reason } : { status: "cancelled" })
    );
    if (!r.ok) {
      noteAuth(r);
      setNotice({
        tone: "error",
        title: `${formatShortDate(session.date)} was not cancelled`,
        body: failureMessage(r, "Couldn't cancel this hiking day."),
        scroll: true,
      });
      return;
    }

    const d = (r.data && typeof r.data === "object" ? r.data : {}) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    const cancelled = num(d.cancelledBookings);
    const emails = num(d.emailsSent);
    const failures = Array.isArray(d.failures)
      ? (d.failures as { leadName?: unknown; error?: unknown }[]).map((f) => ({
          leadName: typeof f?.leadName === "string" && f.leadName ? f.leadName : "A booking",
          error: typeof f?.error === "string" && f.error ? f.error : "Update failed",
        }))
      : [];

    const details = failures.map(
      (f) => `${f.leadName}: booking not cancelled (${f.error}). Cancel it from Bookings.`
    );
    const unsent = cancelled - emails;
    if (unsent > 0) {
      details.push(
        `${plural(unsent, "email")} didn't send. Contact ${unsent === 1 ? "that group" : "those groups"} directly.`
      );
    }

    setPanel(null);
    setNotice({
      tone: details.length > 0 ? "warning" : "success",
      title: `Day cancelled · ${plural(cancelled, "booking")} cancelled · ${plural(emails, "email")} sent`,
      body: `${formatShortDate(session.date)} · ${session.time} is off the booking form.`,
      details,
      scroll: true,
    });
    void load();
  }

  async function deleteDay(session: TrekSession): Promise<void> {
    const r = await callApi(`/api/trek-sessions/${encodeURIComponent(session.id)}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      noteAuth(r);
      setNotice({
        tone: "error",
        title: `${formatShortDate(session.date)} was not deleted`,
        body: failureMessage(r, "Couldn't delete this hiking day."),
        scroll: true,
      });
      return;
    }
    setPanel(null);
    setNotice({
      tone: "success",
      title: `Deleted ${formatShortDate(session.date)} · ${session.time}.`,
      scroll: true,
    });
    void load();
  }

  const reportFromAdd = useCallback((n: PageNotice) => {
    setNotice(n);
  }, []);

  const totals = useMemo(() => {
    let booked = 0;
    let open = 0;
    for (const s of upcoming) {
      booked += s.bookedCount;
      open += Math.max(0, s.maxSlots - s.bookedCount);
    }
    return { booked, open };
  }, [upcoming]);

  const rowProps = {
    bookings,
    today,
    onToggleRoster: toggleRoster,
    onTogglePanel: togglePanel,
    onClosePanel: closePanel,
    onSaveEdit: saveEdit,
    onCancelDay: cancelDay,
    onDelete: deleteDay,
  };

  return (
    <div>
      <PageHeader
        title="Hiking days"
        subtitle="Only these dates appear in the booking form."
        actions={
          <button
            type="button"
            className="btn-cta-sm"
            aria-expanded={addOpen}
            aria-controls={addOpen ? "add-days" : undefined}
            onClick={() => setAddOpen((o) => !o)}
          >
            Add hiking days
          </button>
        }
      />

      <div className="space-y-3 empty:hidden [&:not(:empty)]:mb-5">
        {authExpired && (
          <Notice
            tone="error"
            action={
              <Link href="/admin/login" className={rowBtn}>
                Log in
              </Link>
            }
          >
            <p className="font-semibold">Your login expired</p>
            <p className="text-muted">Log in again to manage hiking days.</p>
          </Notice>
        )}
        {!authExpired && (sessionsError || bookingsError) && (
          <Notice
            tone="error"
            action={
              <button type="button" onClick={retry} disabled={retrying} className={rowBtn}>
                {retrying ? "Retrying..." : "Retry"}
              </button>
            }
          >
            {sessionsError && (
              <p>
                <span className="font-semibold">Hiking days didn&apos;t load.</span> {sessionsError}
              </p>
            )}
            {bookingsError && (
              <p className={cn(sessionsError && "mt-1")}>
                <span className="font-semibold">Bookings didn&apos;t load.</span> {bookingsError}{" "}
                Rosters are hidden and counts show the total booked.
              </p>
            )}
          </Notice>
        )}
        {notice && (
          <div ref={noticeRef} className="scroll-mt-4">
            <Notice
              tone={notice.tone}
              action={
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss"
                  className="-m-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground pointer-coarse:min-w-11"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              }
            >
              <p className="font-semibold">{notice.title}</p>
              {notice.body && <p className="text-muted">{notice.body}</p>}
              {notice.details && notice.details.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {notice.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </Notice>
          </div>
        )}
      </div>

      {addOpen && (
        <div id="add-days" className="mb-5">
          <AddDaysPanel
            sessions={sessions}
            today={today}
            onNotice={reportFromAdd}
            onAdded={load}
            onAuthExpired={() => setAuthExpired(true)}
            onClose={() => setAddOpen(false)}
          />
        </div>
      )}

      {loading ? (
        <Box>
          <BoxHeader>
            <span className="text-[13px] font-semibold text-foreground">Upcoming</span>
          </BoxHeader>
          <SkeletonRows rows={4} />
        </Box>
      ) : sessionsReady ? (
        <>
          {upcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No upcoming hiking days"
              body="Add dates so hikers can book them."
              action={
                <button type="button" className="btn-cta-sm" onClick={() => setAddOpen(true)}>
                  Add hiking days
                </button>
              }
            />
          ) : (
            <section aria-labelledby="upcoming-heading">
              <Box>
                <BoxHeader>
                  <h2
                    id="upcoming-heading"
                    className="flex items-center gap-2 text-[13px] font-semibold text-foreground"
                  >
                    <Icon name="calendar" className="h-4 w-4 text-muted" />
                    Upcoming
                    <CountPill n={upcoming.length} />
                  </h2>
                  <span className="tabular text-xs text-muted">
                    {totals.booked} booked · {totals.open} open
                  </span>
                </BoxHeader>
                <ul className="divide-y divide-border">
                  {upcoming.map((s) => (
                    <DayRow
                      key={s.id}
                      session={s}
                      rosterOpen={openRosters.has(s.id)}
                      panelKind={panel && panel.id === s.id ? panel.kind : null}
                      {...rowProps}
                    />
                  ))}
                </ul>
              </Box>
            </section>
          )}

          {past.length > 0 && (
            <details
              open={pastIsOpen}
              onToggle={(e) => setPastOpen(e.currentTarget.open)}
              className="group mt-5 overflow-hidden rounded-md border border-border bg-background"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground hover:text-accent [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  Past and cancelled
                  <CountPill n={past.length} />
                </span>
                <Icon
                  name="chevronDown"
                  className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {past.map((s) => (
                  <DayRow
                    key={s.id}
                    session={s}
                    readOnly
                    rosterOpen={openRosters.has(s.id)}
                    panelKind={null}
                    {...rowProps}
                  />
                ))}
              </ul>
            </details>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

function DateTile({ date, muted }: { date: string; muted?: boolean }) {
  const { month, day } = dateParts(date);
  return (
    <div
      aria-hidden
      className="w-13 shrink-0 self-start overflow-hidden rounded-md border border-border bg-background text-center"
    >
      <p
        className={cn(
          "py-0.5 text-[11px] font-bold",
          muted ? "bg-surface text-muted" : "bg-accent-muted text-accent"
        )}
      >
        {month}
      </p>
      <p className="tabular py-1.5 font-display text-xl font-bold leading-none text-foreground">
        {day}
      </p>
    </div>
  );
}

function FillBar({ total, segments }: { total: number; segments: { n: number; tone: string }[] }) {
  const max = Math.max(1, total);
  const widths: number[] = [];
  let used = 0;
  for (const s of segments) {
    const w = Math.max(0, Math.min(s.n, max - used));
    widths.push(w);
    used += w;
  }
  return (
    <div aria-hidden className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-border">
      {segments.map((s, i) =>
        widths[i] > 0 ? (
          <div key={i} className={cn("h-full", s.tone)} style={{ width: `${(widths[i] / max) * 100}%` }} />
        ) : null
      )}
    </div>
  );
}

type RowProps = {
  session: TrekSession;
  bookings: BookingRequest[] | null;
  today: string;
  readOnly?: boolean;
  rosterOpen: boolean;
  panelKind: PanelKind | null;
  onToggleRoster: (id: string) => void;
  onTogglePanel: (id: string, kind: PanelKind) => void;
  onClosePanel: () => void;
  onSaveEdit: (session: TrekSession, body: EditBody) => Promise<string | null>;
  onCancelDay: (session: TrekSession, reason: string) => Promise<void>;
  onDelete: (session: TrekSession) => Promise<void>;
};

function DayRow({
  session,
  bookings,
  today,
  readOnly = false,
  rosterOpen,
  panelKind,
  onToggleRoster,
  onTogglePanel,
  onClosePanel,
  onSaveEdit,
  onCancelDay,
  onDelete,
}: RowProps) {
  const { weekday } = dateParts(session.date);
  const cancelled = session.status === "cancelled";
  const open = Math.max(0, session.maxSlots - session.bookedCount);
  const full = !cancelled && (open === 0 || session.status === "full");
  const price = session.price ?? DEFAULT_PRICE;
  const pax = bookings ? sessionPax(session.id, bookings) : null;
  const rosterId = `roster-${session.id}`;
  const canRoster = !cancelled;

  let counts: string;
  if (cancelled) {
    const gone = bookings
      ? bookings.filter((b) => b.sessionId === session.id && b.status === "cancelled")
      : null;
    counts = gone ? `${plural(gone.length, "booking")} cancelled · ${paxOf(gone)} pax` : "Cancelled";
  } else if (pax) {
    counts = readOnly
      ? `${pax.confirmed} confirmed · ${pax.held} held · ${session.maxSlots} slots`
      : `${pax.confirmed} confirmed · ${pax.held} held · ${open} open`;
  } else {
    counts = readOnly
      ? `${session.bookedCount} of ${session.maxSlots} booked`
      : `${session.bookedCount} booked · ${open} open`;
  }

  const segments = pax
    ? [
        { n: pax.confirmed, tone: "bg-success" },
        { n: pax.held, tone: "bg-warning" },
      ]
    : [{ n: session.bookedCount, tone: "bg-accent" }];

  return (
    <li id={`day-${session.id}`} className="scroll-mt-4 px-3 py-3 sm:px-4">
      <div className="flex gap-3">
        <DateTile date={session.date} muted={readOnly} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-foreground">
              <span aria-hidden>{weekday} · </span>
              <span className="sr-only">{formatDate(session.date)}, </span>
              <span className="tabular">{session.time}</span>
            </h3>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {session.date === today && !cancelled && (
                <span className="rounded-full border border-accent/40 bg-accent-muted px-2 py-px text-[11px] font-semibold text-accent">
                  Today
                </span>
              )}
              {full && (
                <span className="rounded-full bg-danger-muted px-2 py-px text-[11px] font-semibold text-danger">
                  Full
                </span>
              )}
              {cancelled && (
                <span className="rounded-full border border-border bg-surface px-2 py-px text-[11px] font-semibold text-muted">
                  Cancelled
                </span>
              )}
            </div>
          </div>
          {price !== undefined && (
            <p className="mt-0.5 text-[13px] text-muted">
              <span className="tabular font-semibold text-foreground">{formatPrice(price)}</span> per
              person
            </p>
          )}
          {session.notes && (
            <p className="mt-0.5 line-clamp-1 break-all text-[13px] text-muted" title={session.notes}>
              {session.notes}
            </p>
          )}
          {!cancelled && <FillBar total={session.maxSlots} segments={segments} />}
          <p className={cn("tabular text-xs text-muted", cancelled ? "mt-1" : "mt-1.5")}>{counts}</p>
        </div>
      </div>

      {(canRoster || !readOnly) && (
        <div className="mt-3 flex flex-wrap gap-2 sm:pl-16">
          {canRoster && (
            <button
              type="button"
              className={rowBtn}
              aria-expanded={rosterOpen}
              aria-controls={rosterOpen ? rosterId : undefined}
              onClick={() => onToggleRoster(session.id)}
            >
              <Icon name="users" className="h-4 w-4 text-muted" />
              Roster
            </button>
          )}
          {!readOnly && (
            <>
              <button
                type="button"
                className={rowBtn}
                aria-expanded={panelKind === "edit"}
                onClick={() => onTogglePanel(session.id, "edit")}
              >
                Edit
              </button>
              <button
                type="button"
                className={rowBtn}
                aria-expanded={panelKind === "cancel"}
                onClick={() => onTogglePanel(session.id, "cancel")}
              >
                Cancel day
              </button>
              {session.bookedCount === 0 && (
                <button
                  type="button"
                  className={rowBtn}
                  aria-expanded={panelKind === "delete"}
                  onClick={() => onTogglePanel(session.id, "delete")}
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      )}

      {!readOnly && panelKind === "edit" && (
        <EditPanel session={session} today={today} onSave={onSaveEdit} onClose={onClosePanel} />
      )}
      {!readOnly && panelKind === "cancel" && (
        <CancelPanel
          session={session}
          bookings={bookings}
          onConfirm={onCancelDay}
          onClose={onClosePanel}
        />
      )}
      {!readOnly && panelKind === "delete" && session.bookedCount === 0 && (
        <DeletePanel session={session} onConfirm={onDelete} onClose={onClosePanel} />
      )}
      {canRoster && rosterOpen && <RosterPanel id={rosterId} session={session} bookings={bookings} />}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Roster                                                              */
/* ------------------------------------------------------------------ */

function RosterPanel({
  id,
  session,
  bookings,
}: {
  id: string;
  session: TrekSession;
  bookings: BookingRequest[] | null;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const active = bookings ? activeOn(session.id, bookings) : null;
  const pax = active ? paxOf(active) : 0;

  async function copy() {
    if (!bookings) return;
    try {
      await navigator.clipboard.writeText(rosterText(session, bookings));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <section
      id={id}
      aria-label={`Roster for ${formatShortDate(session.date)}`}
      className="mt-3 border-t border-border pt-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="tabular text-[13px] font-semibold text-foreground">
          Roster · {pax} pax
          {active && active.length > 0 && (
            <span className="font-normal text-muted"> · {plural(active.length, "group")}</span>
          )}
        </h4>
        {active && active.length > 0 && (
          <button type="button" onClick={copy} className={rowBtn}>
            {copyState === "copied" ? (
              <>
                <Icon name="check" className="h-4 w-4 text-success" />
                Copied
              </>
            ) : (
              <>
                <Icon name="doc" className="h-4 w-4 text-muted" />
                {copyState === "failed" ? "Couldn't copy" : "Copy roster"}
              </>
            )}
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {copyState === "copied" ? "Roster copied" : copyState === "failed" ? "Couldn't copy the roster" : ""}
        </span>
      </div>

      {!active ? (
        <p className="mt-2 text-sm text-muted">
          Bookings didn&apos;t load, so the roster can&apos;t be shown. Use Retry at the top.
        </p>
      ) : active.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No bookings yet</p>
      ) : (
        <ul className="mt-1 divide-y divide-border">
          {active.map((b) => (
            <RosterEntry key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RosterEntry({ booking: b }: { booking: BookingRequest }) {
  const phone = phoneHref(b.phone || "");
  const emergencyPhone = phoneHref(b.emergencyContactPhone || "");
  const others = (b.participantNames ?? [])
    .map((n) => n?.trim())
    .filter((n): n is string => !!n && n !== b.leadName.trim());

  return (
    <li className="py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-semibold text-foreground">{b.leadName}</p>
        <StatusPill status={b.status} />
      </div>
      <p className="tabular text-xs text-muted">{b.paxCount} pax</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        {phone && (
          <a href={`tel:${phone}`} className={rowBtn} aria-label={`Call ${b.leadName}, ${b.phone}`}>
            <Icon name="phone" className="h-4 w-4 text-muted" />
            <span className="tabular">{b.phone}</span>
          </a>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-muted">
        <span className="min-w-0 break-words">
          Emergency:{" "}
          <span className="text-foreground">{b.emergencyContactName || "Not given"}</span>
        </span>
        {emergencyPhone && (
          <a
            href={`tel:${emergencyPhone}`}
            className={rowBtn}
            aria-label={`Call emergency contact ${b.emergencyContactName || ""}, ${b.emergencyContactPhone}`}
          >
            <Icon name="phone" className="h-4 w-4 text-muted" />
            Call
          </a>
        )}
      </div>

      {others.length > 0 && (
        <p className="mt-1.5 break-words text-[13px] text-muted">
          Group: <span className="text-foreground">{others.join(", ")}</span>
        </p>
      )}
      {b.notes?.trim() && (
        <p className="mt-1 whitespace-pre-line break-words text-[13px] text-muted">
          Notes: <span className="text-foreground">{b.notes.trim()}</span>
        </p>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Edit, cancel, delete                                                */
/* ------------------------------------------------------------------ */

function EditPanel({
  session,
  today,
  onSave,
  onClose,
}: {
  session: TrekSession;
  today: string;
  onSave: (session: TrekSession, body: EditBody) => Promise<string | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(() => ({
    date: session.date,
    time: session.time,
    maxSlots: session.maxSlots as SlotsValue,
    price: session.price !== undefined ? String(session.price) : "",
    notes: session.notes ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const locked = session.bookedCount > 0;
  const minSlots = Math.max(1, session.bookedCount);
  const fid = (name: string) => `edit-${name}-${session.id}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const slots = form.maxSlots;
    if (typeof slots !== "number" || !Number.isInteger(slots) || slots < minSlots) {
      setError(`Max slots must be a whole number of at least ${minSlots}.`);
      return;
    }
    let price: number | null = null;
    if (form.price.trim() !== "") {
      const p = Number(form.price);
      if (!Number.isFinite(p) || p < 0) {
        setError("Price must be a number of 0 or more.");
        return;
      }
      price = p;
    }
    setBusy(true);
    setError("");
    const err = await onSave(session, {
      date: locked ? session.date : form.date,
      time: locked ? session.time : form.time.trim(),
      maxSlots: slots,
      notes: form.notes.trim(),
      price,
    });
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-border pt-3">
      <h4 className="text-sm font-semibold text-foreground">Edit hiking day</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={fid("date")} className={labelCls}>
            Date <span aria-hidden className="text-danger">*</span>
          </label>
          <input
            id={fid("date")}
            required
            type="date"
            min={locked ? undefined : today}
            disabled={locked}
            aria-describedby={locked ? fid("locked") : undefined}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="field-input mt-1 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor={fid("time")} className={labelCls}>
            Meet-up time <span aria-hidden className="text-danger">*</span>
          </label>
          <input
            id={fid("time")}
            required
            type="text"
            maxLength={50}
            placeholder="e.g. 6:00 AM"
            disabled={locked}
            aria-describedby={locked ? fid("locked") : undefined}
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="field-input mt-1 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>
      {locked && (
        <p id={fid("locked")} className="flex items-start gap-1.5 text-xs text-muted">
          <Icon name="clock" className="mt-px h-3.5 w-3.5 shrink-0" />
          Has bookings — date and time are locked. Add a new day or cancel this one.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={fid("slots")} className={labelCls}>
            Max slots <span aria-hidden className="text-danger">*</span>
          </label>
          <input
            id={fid("slots")}
            required
            type="number"
            inputMode="numeric"
            min={minSlots}
            max={Math.max(50, minSlots)}
            value={form.maxSlots}
            onChange={(e) => setForm({ ...form, maxSlots: parseSlotsInput(e.target.value) })}
            className="field-input mt-1"
          />
          {session.bookedCount > 0 && (
            <p className={hintCls}>{session.bookedCount} already booked, so the minimum is {minSlots}.</p>
          )}
        </div>
        <div>
          <label htmlFor={fid("price")} className={labelCls}>
            Price per person
          </label>
          <input
            id={fid("price")}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={DEFAULT_PRICE !== undefined ? `Default ${formatPrice(DEFAULT_PRICE)}` : "Optional"}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="field-input mt-1"
          />
          <p className={hintCls}>Leave blank for the trip price.</p>
        </div>
      </div>
      <div>
        <label htmlFor={fid("notes")} className={labelCls}>
          Notes for hikers
        </label>
        <textarea
          id={fid("notes")}
          rows={2}
          maxLength={1000}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="field-input mt-1"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-cta-sm">
          {busy ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onClose} disabled={busy} className={rowBtn}>
          Close
        </button>
      </div>
    </form>
  );
}

function CancelPanel({
  session,
  bookings,
  onConfirm,
  onClose,
}: {
  session: TrekSession;
  bookings: BookingRequest[] | null;
  onConfirm: (session: TrekSession, reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const active = bookings ? activeOn(session.id, bookings) : null;
  const headingId = `cancel-heading-${session.id}`;
  const reasonId = `cancel-reason-${session.id}`;

  let summary: string;
  if (active && active.length > 0) {
    summary = `${plural(active.length, "group")} · ${paxOf(active)} pax will be cancelled and emailed.`;
  } else if (active) {
    summary =
      session.bookedCount > 0
        ? `${session.bookedCount} booked pax will be cancelled and emailed.`
        : "No one is booked. The day comes off the booking form.";
  } else {
    summary = `Every booking on this day (${session.bookedCount} pax) will be cancelled and emailed. Bookings didn't load, so names aren't shown.`;
  }

  async function confirm() {
    setBusy(true);
    await onConfirm(session, reason.trim());
    setBusy(false);
  }

  return (
    <div role="group" aria-labelledby={headingId} className="mt-3 border-t border-border pt-3">
      <h4 id={headingId} className="text-sm font-semibold text-foreground">
        Cancel {formatShortDate(session.date)} · {session.time}?
      </h4>
      <p className="mt-0.5 text-sm text-muted">{summary}</p>
      {active && active.length > 0 && (
        <ul className="mt-2 space-y-1 text-[13px]">
          {active.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-foreground">{b.leadName}</span>
              <span className="tabular shrink-0 text-muted">{b.paxCount} pax</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <label htmlFor={reasonId} className={labelCls}>
          Reason (optional)
        </label>
        <textarea
          id={reasonId}
          rows={2}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Trail closed by DENR due to weather."
          className="field-input mt-1"
          aria-describedby={`${reasonId}-hint`}
        />
        <p id={`${reasonId}-hint`} className={hintCls}>
          Included in the email to each group.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={confirm} disabled={busy} className={dangerBtn}>
          {busy ? "Cancelling..." : "Cancel day and notify"}
        </button>
        <button type="button" onClick={onClose} disabled={busy} className={rowBtn}>
          Keep day
        </button>
      </div>
    </div>
  );
}

function DeletePanel({
  session,
  onConfirm,
  onClose,
}: {
  session: TrekSession;
  onConfirm: (session: TrekSession) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const headingId = `delete-heading-${session.id}`;

  async function confirm() {
    setBusy(true);
    await onConfirm(session);
    setBusy(false);
  }

  return (
    <div role="group" aria-labelledby={headingId} className="mt-3 border-t border-border pt-3">
      <h4 id={headingId} className="text-sm font-semibold text-foreground">
        Delete {formatShortDate(session.date)} · {session.time}?
      </h4>
      <p className="mt-0.5 text-sm text-muted">
        No one is booked. It comes off the booking form and can&apos;t be undone.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={confirm} disabled={busy} className={dangerBtn}>
          {busy ? "Deleting..." : "Delete day"}
        </button>
        <button type="button" onClick={onClose} disabled={busy} className={rowBtn}>
          Keep day
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add hiking days (several days from a week, or one date)             */
/* ------------------------------------------------------------------ */

function AddDaysPanel({
  sessions,
  today,
  onNotice,
  onAdded,
  onAuthExpired,
  onClose,
}: {
  sessions: TrekSession[];
  today: string;
  onNotice: (n: PageNotice) => void;
  onAdded: () => void;
  onAuthExpired: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<AddMode>("bulk");
  const [saving, setSaving] = useState(false);
  const [singleForm, setSingleForm] = useState({ date: "", ...sharedDefaults });
  const [bulkForm, setBulkForm] = useState(() => ({
    weekAnchor: today,
    selectedDates: [] as string[],
    ...sharedDefaults,
  }));

  const weekDates = useMemo(() => getWeekDatesFrom(bulkForm.weekAnchor), [bulkForm.weekAnchor]);
  const weekMonday = getMondayOfWeek(bulkForm.weekAnchor);
  const weekSunday = weekDates[6];

  function sessionExistsForDateTime(date: string, time: string): boolean {
    return sessions.some((s) => s.date === date && sameTime(s.time, time) && s.status !== "cancelled");
  }

  function toggleBulkDate(date: string) {
    setBulkForm((prev) => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(date)
        ? prev.selectedDates.filter((d) => d !== date)
        : [...prev.selectedDates, date],
    }));
  }

  function selectAllAvailableInWeek() {
    const available = weekDates.filter(
      (date) => date >= today && !sessionExistsForDateTime(date, bulkForm.time)
    );
    setBulkForm((prev) => ({ ...prev, selectedDates: available }));
  }

  function moveWeek(weeks: number) {
    setBulkForm((prev) => ({
      ...prev,
      weekAnchor: shiftWeek(prev.weekAnchor, weeks),
      selectedDates: [],
    }));
  }

  function fail(title: string, r: ApiResult, fallback: string) {
    if (r.status === 401) onAuthExpired();
    onNotice({ tone: "error", title, body: failureMessage(r, fallback), scroll: true });
  }

  async function handleSingleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const date = singleForm.date;
    const time = singleForm.time.trim();
    const r = await callApi(
      "/api/trek-sessions",
      jsonInit("POST", {
        ...singleForm,
        time,
        maxSlots: slotsToSubmit(singleForm.maxSlots),
        price: singleForm.price ? parseFloat(singleForm.price) : undefined,
      })
    );
    setSaving(false);
    if (!r.ok) {
      fail("Hiking day not added", r, "Couldn't add the hiking day.");
      return;
    }
    setSingleForm({ date: "", ...sharedDefaults });
    onNotice({ tone: "success", title: `Added ${formatShortDate(date)} · ${time}.`, scroll: true });
    onAdded();
    onClose();
  }

  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await callApi(
      "/api/trek-sessions/bulk",
      jsonInit("POST", {
        dates: bulkForm.selectedDates,
        time: bulkForm.time,
        maxSlots: slotsToSubmit(bulkForm.maxSlots),
        notes: bulkForm.notes,
        price: bulkForm.price ? parseFloat(bulkForm.price) : undefined,
      })
    );
    setSaving(false);
    if (!r.ok) {
      fail("No hiking days added", r, "Couldn't add the hiking days.");
      return;
    }

    const data = (r.data && typeof r.data === "object" ? r.data : {}) as {
      created?: unknown[];
      skipped?: { date?: string; reason?: string }[];
    };
    const createdCount = Array.isArray(data.created) ? data.created.length : 0;
    const skipped = Array.isArray(data.skipped) ? data.skipped : [];

    setBulkForm({ weekAnchor: today, selectedDates: [], ...sharedDefaults });
    onNotice({
      tone: skipped.length > 0 ? "warning" : "success",
      title: `Added ${plural(createdCount, "hiking day")}.`,
      body: skipped.length > 0 ? `${skipped.length} skipped:` : undefined,
      details: skipped.map(
        (s) => `${s.date ? formatShortDate(s.date) : "A date"}: ${s.reason ?? "Skipped"}`
      ),
      scroll: true,
    });
    onAdded();
  }

  const selectedCount = bulkForm.selectedDates.length;

  return (
    <Box>
      <BoxHeader>
        <div
          role="group"
          aria-label="How to add"
          className="inline-flex rounded-md border border-border bg-surface p-0.5"
        >
          {(["bulk", "single"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                mode === m
                  ? "bg-surface-elevated text-foreground shadow-[var(--shadow)]"
                  : "text-muted hover:text-foreground"
              )}
            >
              {m === "bulk" ? "Several days" : "One day"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add hiking days"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-elevated hover:text-foreground pointer-coarse:min-w-11"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </BoxHeader>

      {mode === "single" ? (
        <form onSubmit={handleSingleCreate} className="space-y-3 p-4 sm:p-5">
          <p className="text-sm text-muted">Add one date.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="single-date" className={labelCls}>
                Date <span aria-hidden className="text-danger">*</span>
              </label>
              <input
                id="single-date"
                required
                type="date"
                min={today}
                value={singleForm.date}
                onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="single-time" className={labelCls}>
                Meet-up time <span aria-hidden className="text-danger">*</span>
              </label>
              <input
                id="single-time"
                required
                type="text"
                maxLength={50}
                placeholder="e.g. 6:00 AM"
                value={singleForm.time}
                onChange={(e) => setSingleForm({ ...singleForm, time: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="single-slots" className={labelCls}>
                Max slots <span aria-hidden className="text-danger">*</span>
              </label>
              <input
                id="single-slots"
                required
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                value={singleForm.maxSlots}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, maxSlots: parseSlotsInput(e.target.value) })
                }
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="single-price" className={labelCls}>
                Price per person
              </label>
              <input
                id="single-price"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={DEFAULT_PRICE !== undefined ? `Default ${formatPrice(DEFAULT_PRICE)}` : "Optional"}
                value={singleForm.price}
                onChange={(e) => setSingleForm({ ...singleForm, price: e.target.value })}
                className="field-input mt-1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="single-notes" className={labelCls}>
              Notes for hikers
            </label>
            <textarea
              id="single-notes"
              rows={2}
              maxLength={1000}
              value={singleForm.notes}
              onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
              className="field-input mt-1"
              placeholder="e.g. Sta. Cruz trail jump-off. Meet at DENR checkpoint."
            />
          </div>
          <button type="submit" disabled={saving} className="btn-cta-sm">
            {saving ? "Saving..." : "Add hiking day"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkCreate} className="space-y-4 p-4 sm:p-5">
          <p className="text-sm text-muted">
            Tick the days you&apos;re free, fill in the details once, and add them together.
          </p>

          <div>
            <p className={labelCls} id="bulk-week-label">
              Week
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2" role="group" aria-labelledby="bulk-week-label">
              <button
                type="button"
                onClick={() => moveWeek(-1)}
                className={rowBtn}
                aria-label="Previous week"
              >
                <Icon name="arrowLeft" className="h-4 w-4" />
              </button>
              <span className="tabular min-w-0 flex-1 text-center text-[13px] font-medium text-foreground sm:flex-none">
                {monthDay(weekMonday)} – {monthDay(weekSunday)}
              </span>
              <button type="button" onClick={() => moveWeek(1)} className={rowBtn} aria-label="Next week">
                <Icon name="arrowRight" className="h-4 w-4" />
              </button>
              <label htmlFor="bulk-anchor" className="sr-only">
                Jump to week of
              </label>
              <input
                id="bulk-anchor"
                type="date"
                value={bulkForm.weekAnchor}
                onChange={(e) =>
                  setBulkForm((prev) => ({ ...prev, weekAnchor: e.target.value, selectedDates: [] }))
                }
                className="field-input w-full sm:ml-auto sm:w-auto"
              />
            </div>
          </div>

          <fieldset>
            <legend className={labelCls}>
              Days <span aria-hidden className="text-danger">*</span>{" "}
              <span className="tabular font-normal text-muted">({selectedCount} selected)</span>
            </legend>
            <div className="mt-1 flex flex-wrap items-center gap-x-4">
              <button
                type="button"
                onClick={selectAllAvailableInWeek}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                Select all open
              </button>
              <button
                type="button"
                onClick={() => setBulkForm((prev) => ({ ...prev, selectedDates: [] }))}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {weekDates.map((date) => {
                const isPast = date < today;
                const alreadyScheduled = sessionExistsForDateTime(date, bulkForm.time);
                const disabled = isPast || alreadyScheduled;
                const checked = bulkForm.selectedDates.includes(date);
                return (
                  <label
                    key={date}
                    className={cn(
                      "flex min-h-11 items-start gap-3 rounded-md border p-3 transition-colors",
                      disabled
                        ? "cursor-not-allowed border-border opacity-50"
                        : checked
                          ? "cursor-pointer border-accent/60 bg-accent-muted"
                          : "cursor-pointer border-border hover:border-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleBulkDate(date)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {formatWeekdayLabel(date)}
                      </span>
                      {isPast && <span className="text-xs text-muted">Past date</span>}
                      {!isPast && alreadyScheduled && (
                        <span className="text-xs text-muted">Already scheduled at this time</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="bulk-time" className={labelCls}>
                Meet-up time <span aria-hidden className="text-danger">*</span>
              </label>
              <input
                id="bulk-time"
                required
                type="text"
                maxLength={50}
                placeholder="e.g. 6:00 AM"
                value={bulkForm.time}
                onChange={(e) => setBulkForm({ ...bulkForm, time: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="bulk-slots" className={labelCls}>
                Max slots <span aria-hidden className="text-danger">*</span>
              </label>
              <input
                id="bulk-slots"
                required
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                value={bulkForm.maxSlots}
                onChange={(e) => setBulkForm({ ...bulkForm, maxSlots: parseSlotsInput(e.target.value) })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="bulk-price" className={labelCls}>
                Price per person
              </label>
              <input
                id="bulk-price"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={DEFAULT_PRICE !== undefined ? `Default ${formatPrice(DEFAULT_PRICE)}` : "Optional"}
                value={bulkForm.price}
                onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                className="field-input mt-1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bulk-notes" className={labelCls}>
              Notes for hikers
            </label>
            <textarea
              id="bulk-notes"
              rows={2}
              maxLength={1000}
              value={bulkForm.notes}
              onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
              className="field-input mt-1"
              placeholder="e.g. Sta. Cruz trail jump-off. Meet at DENR checkpoint."
            />
          </div>

          <button type="submit" disabled={saving || selectedCount === 0} className="btn-cta-sm">
            {saving ? "Saving..." : `Add ${plural(selectedCount, "hiking day")}`}
          </button>
        </form>
      )}
    </Box>
  );
}
