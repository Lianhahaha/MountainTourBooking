import Link from "next/link";
import { getAllHikingDays } from "@/lib/hiking-days-file";
import { getAvailableTrekSessions } from "@/lib/trek-sessions-file";
import { getAllBookings } from "@/lib/bookings";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [hikingDays, sessions, bookings] = await Promise.all([
    getAllHikingDays(),
    getAvailableTrekSessions(),
    getAllBookings(),
  ]);

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  return (
    <div>
      <h1 className="text-lg font-bold text-foreground md:text-2xl">Owner dashboard</h1>
      <p className="mt-0.5 text-xs text-muted md:mt-1 md:text-base">Manage bookings, hiking days, and hike albums for Tikling.</p>

      {pending.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-surface p-4 sm:mt-6 sm:p-5">
          <p className="font-semibold text-foreground">
            {pending.length} booking{pending.length !== 1 ? "s" : ""} need your review
          </p>
          <Link
            href="/admin/bookings"
            className="btn-cta-sm mt-3 inline-block"
          >
            Open booking queue →
          </Link>
        </div>
      )}

      <div className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-4 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0">
        <Link
          href="/admin/bookings?filter=pending"
          className="w-[75vw] shrink-0 snap-center rounded-md border border-border bg-surface p-3 transition hover:border-muted sm:w-auto sm:p-5"
        >
          <p className="text-3xl font-bold text-foreground">{pending.length}</p>
          <p className="mt-1 font-medium text-foreground">Pending</p>
        </Link>
        <Link
          href="/admin/bookings?filter=confirmed"
          className="w-[75vw] shrink-0 snap-center rounded-md border border-border bg-surface p-3 transition hover:border-muted sm:w-auto sm:p-5"
        >
          <p className="text-3xl font-bold text-muted">{confirmed.length}</p>
          <p className="mt-1 font-medium text-foreground">Confirmed</p>
        </Link>
        <Link
          href="/admin/hiking-days"
          className="w-[75vw] shrink-0 snap-center rounded-md border border-border bg-surface p-3 transition hover:border-muted sm:w-auto sm:p-5"
        >
          <p className="text-3xl font-bold text-muted">{sessions.length}</p>
          <p className="mt-1 font-medium text-foreground">Open hiking days</p>
        </Link>
      </div>

      {pending.length > 0 && (
        <div className="mt-4 sm:mt-8">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Queue preview</h2>
          <ul className="mt-3 space-y-2">
            {pending.slice(0, 5).map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{b.leadName}</p>
                  <p className="text-muted">{b.tripTitle} · {b.paxCount} pax</p>
                </div>
                <p className="text-muted">
                  {b.preferredDate ? formatDate(b.preferredDate) : "—"}
                  {b.trekTime ? ` · ${b.trekTime}` : ""} · {formatPrice(b.estimatedTotal)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-sm text-muted">
        {hikingDays.length} hike album{hikingDays.length !== 1 ? "s" : ""} on the public Hikes page.{" "}
        <Link href="/admin/hike-albums" className="text-accent hover:underline">
          Manage albums →
        </Link>
      </p>
    </div>
  );
}
