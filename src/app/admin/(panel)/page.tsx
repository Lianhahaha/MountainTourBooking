import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAllBookingsResult } from "@/lib/bookings";
import { getAllTrekSessionsStrict } from "@/lib/trek-sessions-file";
import { getAllReviews } from "@/lib/reviews";
import {
  addDaysISO,
  ageLabel,
  ageTone,
  formatShortDate,
  isActive,
  phoneHref,
  safeTotal,
  sessionPax,
  todayLabelManila,
  trekDateOf,
} from "@/lib/admin";
import { formatPrice, todayInManila, cn, dateParts } from "@/lib/utils";
import { Box, BoxHeader } from "@/components/Box";
import { Icon } from "@/components/Icon";
import { CountPill, EmptyState, Notice, PageHeader, StatusPill } from "@/components/admin/ui";
import type { BookingRequest, TrekSession } from "@/types";

export const dynamic = "force-dynamic";

const ageStyles = {
  ok: "bg-surface text-muted",
  warn: "bg-warning-muted text-warning",
  late: "bg-danger-muted text-danger",
};

type UpcomingItem =
  | { kind: "session"; date: string; session: TrekSession }
  | { kind: "private"; date: string; booking: BookingRequest };

export default async function AdminTodayPage() {
  // The layout checks auth too, but pages must not rely on it alone.
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const [bookingsResult, sessionsResult, reviews] = await Promise.all([
    getAllBookingsResult(),
    getAllTrekSessionsStrict().then(
      (sessions) => ({ sessions, error: null as string | null }),
      () => ({ sessions: [] as TrekSession[], error: "Could not read hiking days." })
    ),
    getAllReviews(),
  ]);
  const { bookings } = bookingsResult;
  const { sessions } = sessionsResult;
  const sessionsById = new Map(sessions.map((s) => [s.id, s]));

  const today = todayInManila();
  const in14 = addDaysISO(today, 14);
  const in30 = addDaysISO(today, 30);

  const pending = bookings
    .filter((b) => b.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const overdue = pending.filter((b) => ageTone(b.createdAt) === "late").length;

  const upcomingSessions = sessions.filter((s) => s.status !== "cancelled" && s.date >= today);
  const upcomingPrivate = bookings.filter(
    (b) => b.tripType === "private" && isActive(b) && !!b.preferredDate && b.preferredDate >= today
  );
  const upcoming: UpcomingItem[] = [
    ...upcomingSessions.map((s) => ({ kind: "session" as const, date: s.date, session: s })),
    ...upcomingPrivate.map((b) => ({ kind: "private" as const, date: b.preferredDate!, booking: b })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const next = upcoming[0];
  const soon = upcoming.filter((u) => u.date <= in14 && u !== next);

  // Money is collected in cash/GCash on trek day, so only confirmed bookings
  // with a trek date in the window count as expected.
  const inWindow = bookings.filter((b) => {
    const d = trekDateOf(b, sessionsById);
    return !!d && d >= today && d <= in30;
  });
  const confirmed30 = inWindow.filter((b) => b.status === "confirmed");
  const pending30 = inWindow.filter((b) => b.status === "pending");
  const expected = confirmed30.reduce((n, b) => n + safeTotal(b), 0);
  const expectedPax = confirmed30.reduce((n, b) => n + (b.paxCount || 0), 0);
  const pendingValue = pending30.reduce((n, b) => n + safeTotal(b), 0);

  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const errors = [bookingsResult.error, sessionsResult.error].filter(Boolean);

  return (
    <div>
      <PageHeader title="Today" subtitle={todayLabelManila()} />

      {errors.length > 0 && (
        <Notice tone="error" className="mb-4">
          {errors.join(" ")} Numbers below may be incomplete. Refresh to try again.
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Needs reply */}
          <Box>
            <BoxHeader>
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                Needs reply
                <CountPill n={pending.length} tone={overdue > 0 ? "alert" : "attention"} />
              </span>
              {pending.length > 0 && (
                <Link href="/admin/bookings?tab=needs-reply" className="text-xs font-medium text-accent hover:underline">
                  All requests
                </Link>
              )}
            </BoxHeader>
            {pending.length === 0 ? (
              <div className="p-4">
                <EmptyState title="All caught up" body="New booking requests show up here." />
              </div>
            ) : (
              <>
                {overdue > 0 && (
                  <p className="border-b border-border bg-danger-muted px-4 py-2 text-xs font-medium text-danger">
                    {overdue} waiting over 48 hours — hikers were told you&apos;d reply in 24–48 hours.
                  </p>
                )}
                <ul className="divide-y divide-border">
                  {pending.slice(0, 6).map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/admin/bookings?focus=${encodeURIComponent(b.id)}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                            <span className="truncate">{b.leadName}</span>
                            {b.tripType === "private" && <PrivatePill />}
                          </p>
                          <p className="tabular truncate text-xs text-muted">
                            {b.paxCount} pax · {formatShortDate(trekDateOf(b, sessionsById))} ·{" "}
                            {formatPrice(safeTotal(b))}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "tabular shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            ageStyles[ageTone(b.createdAt)]
                          )}
                        >
                          {ageLabel(b.createdAt)}
                        </span>
                        <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {pending.length > 6 && (
                  <Link
                    href="/admin/bookings?tab=needs-reply"
                    className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-accent hover:bg-surface"
                  >
                    See all {pending.length} requests
                  </Link>
                )}
              </>
            )}
          </Box>

          {/* Next trek */}
          <Box className="shadow-[var(--shadow)]">
            <BoxHeader>
              <span className="text-sm font-semibold text-foreground">Next trek</span>
              {next && (
                <span className="tabular text-xs text-muted">
                  {next.date === today ? "Today" : formatShortDate(next.date)}
                </span>
              )}
            </BoxHeader>
            {!next ? (
              <div className="p-4">
                <EmptyState
                  icon="calendar"
                  title="No upcoming treks"
                  body="Add hiking days so hikers can book."
                  action={
                    <Link href="/admin/hiking-days" className="btn-cta-sm">
                      Add hiking days
                    </Link>
                  }
                />
              </div>
            ) : next.kind === "session" ? (
              <NextSession session={next.session} bookings={bookings} />
            ) : (
              <NextPrivate booking={next.booking} />
            )}
          </Box>
        </div>

        <div className="space-y-4">
          {/* Next 14 days */}
          <Box>
            <BoxHeader>
              <span className="text-sm font-semibold text-foreground">Coming up · next 14 days</span>
              <Link href="/admin/hiking-days" className="text-xs font-medium text-accent hover:underline">
                Hiking days
              </Link>
            </BoxHeader>
            {soon.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted">Nothing else scheduled in the next 14 days.</p>
            ) : (
              <ul className="divide-y divide-border">
                {soon.map((item) =>
                  item.kind === "session" ? (
                    <SessionRow key={item.session.id} session={item.session} bookings={bookings} />
                  ) : (
                    <PrivateRow key={item.booking.id} booking={item.booking} />
                  )
                )}
              </ul>
            )}
          </Box>

          {/* Money */}
          <Box>
            <BoxHeader>
              <span className="text-sm font-semibold text-foreground">Expected on trek days</span>
              <span className="text-xs text-muted">Next 30 days</span>
            </BoxHeader>
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="px-4 py-3">
                <p className="tabular text-xl font-bold text-foreground">{formatPrice(expected)}</p>
                <p className="text-xs text-muted">
                  {confirmed30.length} confirmed · {expectedPax} pax
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="tabular text-xl font-bold text-muted">{formatPrice(pendingValue)}</p>
                <p className="text-xs text-muted">{pending30.length} awaiting reply · not counted</p>
              </div>
            </div>
            <p className="border-t border-border px-4 py-2 text-xs text-muted">
              Paid in cash or GCash on the day. Nothing is collected online.
            </p>
          </Box>

          {/* Shortcuts */}
          <Box>
            <ul className="divide-y divide-border text-sm">
              <ShortcutRow href="/admin/reviews" icon="star" label="Reviews waiting" count={pendingReviews} />
              <ShortcutRow href="/admin/hiking-days" icon="calendar" label="Add or edit hiking days" />
              <li>
                <a
                  href="/api/admin/export-bookings"
                  className="flex items-center gap-3 px-4 py-3 text-foreground transition-colors hover:bg-surface"
                >
                  <Icon name="doc" className="h-4 w-4 text-muted" />
                  <span className="flex-1">Export all bookings (CSV)</span>
                  <Icon name="arrowRight" className="h-4 w-4 text-muted" />
                </a>
              </li>
            </ul>
          </Box>
        </div>
      </div>
    </div>
  );
}

function PrivatePill() {
  return (
    <span className="shrink-0 rounded-full border border-done/40 bg-done-muted px-1.5 py-px text-[10px] font-semibold text-done">
      Private
    </span>
  );
}

function DateTile({ date }: { date: string }) {
  const { month, day } = dateParts(date);
  return (
    <div className="w-11 shrink-0 overflow-hidden rounded-md border border-border bg-background text-center" aria-hidden>
      <p className="bg-accent-muted py-0.5 text-[10px] font-bold text-accent">{month}</p>
      <p className="tabular py-1 text-base font-bold leading-none text-foreground">{day}</p>
    </div>
  );
}

function FillBar({ session, bookings }: { session: TrekSession; bookings: BookingRequest[] }) {
  const { confirmed, held } = sessionPax(session.id, bookings);
  const max = Math.max(1, session.maxSlots);
  const open = Math.max(0, session.maxSlots - session.bookedCount);
  return (
    <div>
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-border"
        role="img"
        aria-label={`${confirmed} confirmed, ${held} held, ${open} open of ${session.maxSlots}`}
      >
        <div className="bg-success" style={{ width: `${(Math.min(confirmed, max) / max) * 100}%` }} />
        <div className="bg-warning" style={{ width: `${(Math.min(held, max - Math.min(confirmed, max)) / max) * 100}%` }} />
      </div>
      <p className="tabular mt-1 text-xs text-muted">
        <span className="text-success">{confirmed} confirmed</span> · <span className="text-warning">{held} held</span> ·{" "}
        {open} open
      </p>
    </div>
  );
}

function NextSession({ session, bookings }: { session: TrekSession; bookings: BookingRequest[] }) {
  const roster = bookings.filter((b) => b.sessionId === session.id && isActive(b));
  const pax = roster.reduce((n, b) => n + (b.paxCount || 0), 0);
  return (
    <div>
      <div className="flex items-start gap-3 px-4 pt-4">
        <DateTile date={session.date} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {formatShortDate(session.date)} · {session.time}
          </p>
          <p className="tabular text-xs text-muted">
            {pax} pax in {roster.length} group{roster.length === 1 ? "" : "s"}
            {session.notes ? ` · ${session.notes}` : ""}
          </p>
          <div className="mt-2">
            <FillBar session={session} bookings={bookings} />
          </div>
        </div>
      </div>
      {roster.length > 0 ? (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {roster.slice(0, 5).map((b) => (
            <li key={b.id} className="flex items-center gap-2 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {b.leadName} <span className="text-muted">· {b.paxCount} pax</span>
                </p>
              </div>
              <StatusPill status={b.status} />
              <a
                href={`tel:${phoneHref(b.phone)}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted hover:text-foreground"
                aria-label={`Call ${b.leadName}`}
              >
                <Icon name="phone" className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-border px-4 py-3 text-sm text-muted">No bookings yet.</p>
      )}
      <div className="border-t border-border px-4 py-3">
        <Link href={`/admin/hiking-days?roster=${encodeURIComponent(session.id)}`} className="btn-secondary w-full !py-2">
          Full roster and emergency contacts
        </Link>
      </div>
    </div>
  );
}

function NextPrivate({ booking }: { booking: BookingRequest }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <DateTile date={booking.preferredDate!} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="truncate">{booking.leadName}</span>
          <PrivatePill />
        </p>
        <p className="tabular text-xs text-muted">
          {booking.paxCount} pax · {booking.trekTime || "Time to confirm"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill status={booking.status} />
          <Link href={`/admin/bookings?focus=${encodeURIComponent(booking.id)}`} className="text-xs font-medium text-accent hover:underline">
            Open booking
          </Link>
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session, bookings }: { session: TrekSession; bookings: BookingRequest[] }) {
  return (
    <li>
      <Link
        href={`/admin/hiking-days?roster=${encodeURIComponent(session.id)}`}
        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface"
      >
        <DateTile date={session.date} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {formatShortDate(session.date)} · <span className="font-normal text-muted">{session.time}</span>
          </p>
          <div className="mt-1.5">
            <FillBar session={session} bookings={bookings} />
          </div>
        </div>
      </Link>
    </li>
  );
}

function PrivateRow({ booking }: { booking: BookingRequest }) {
  return (
    <li>
      <Link
        href={`/admin/bookings?focus=${encodeURIComponent(booking.id)}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface"
      >
        <DateTile date={booking.preferredDate!} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="truncate">{booking.leadName}</span>
            <PrivatePill />
          </p>
          <p className="tabular text-xs text-muted">{booking.paxCount} pax</p>
        </div>
        <StatusPill status={booking.status} />
      </Link>
    </li>
  );
}

function ShortcutRow({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: "star" | "calendar";
  label: string;
  count?: number;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 text-foreground transition-colors hover:bg-surface">
        <Icon name={icon} className="h-4 w-4 text-muted" />
        <span className="flex-1">{label}</span>
        {count !== undefined && <CountPill n={count} tone="attention" />}
        <Icon name="arrowRight" className="h-4 w-4 text-muted" />
      </Link>
    </li>
  );
}
