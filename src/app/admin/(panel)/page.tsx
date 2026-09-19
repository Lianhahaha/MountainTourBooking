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

  // Revenue summary
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalRevenue = confirmed.reduce((sum, b) => sum + b.estimatedTotal, 0);
  const thisMonthRevenue = confirmed
    .filter((b) => {
      const d = new Date(b.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, b) => sum + b.estimatedTotal, 0);
  const totalBookings = bookings.length;
  const totalPax = bookings.reduce((sum, b) => sum + b.paxCount, 0);

  // Top services by revenue
  const serviceMap = new Map<string, { revenue: number; pax: number }>();
  for (const b of confirmed) {
    const existing = serviceMap.get(b.tripTitle) ?? { revenue: 0, pax: 0 };
    serviceMap.set(b.tripTitle, {
      revenue: existing.revenue + b.estimatedTotal,
      pax: existing.pax + b.paxCount,
    });
  }
  const topServices = [...serviceMap.entries()]
    .map(([title, data]) => ({ title, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

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

      {/* Revenue Summary Cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-md border border-border bg-surface p-3 sm:p-5">
          <p className="text-xs font-medium text-muted">Total Revenue</p>
          <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-3 sm:p-5">
          <p className="text-xs font-medium text-muted">This Month</p>
          <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">{formatPrice(thisMonthRevenue)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-3 sm:p-5">
          <p className="text-xs font-medium text-muted">Total Bookings</p>
          <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{totalBookings}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-3 sm:p-5">
          <p className="text-xs font-medium text-muted">Total Pax</p>
          <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{totalPax}</p>
        </div>
      </div>

      {/* Top Services by Revenue */}
      {topServices.length > 0 && (
        <div className="mt-4 sm:mt-8">
          <h2 className="text-base font-semibold text-foreground">Top services by revenue</h2>
          <ul className="mt-3 space-y-2">
            {topServices.map((s, i) => (
              <li
                key={s.title}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-muted text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{s.title}</p>
                    <p className="text-muted">{s.pax} pax</p>
                  </div>
                </div>
                <p className="shrink-0 font-semibold text-foreground">{formatPrice(s.revenue)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      <div className="mt-6">
        <a
          href="/api/admin/export-bookings"
          download="bookings.csv"
          className="btn-secondary"
        >
          Export all bookings (CSV)
        </a>
      </div>
    </div>
  );
}
