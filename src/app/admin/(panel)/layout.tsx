import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAllBookingsResult } from "@/lib/bookings";
import { getAllReviews } from "@/lib/reviews";
import { hoursSince } from "@/lib/admin";
import { org } from "@/data/org";
import { Icon } from "@/components/Icon";
import { AdminSideNav, AdminBottomNav, type AdminNavCounts } from "@/components/admin/AdminNav";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  // Counters for the nav. Failures fall back to no badge; each page reports
  // its own read errors.
  const [{ bookings }, reviews] = await Promise.all([getAllBookingsResult(), getAllReviews()]);
  const pending = bookings.filter((b) => b.status === "pending");
  const counts: AdminNavCounts = {
    pendingBookings: pending.length,
    overdueBookings: pending.filter((b) => hoursSince(b.createdAt) >= 48).length,
    pendingReviews: reviews.filter((r) => r.status === "pending").length,
  };

  return (
    <div className="admin-panel min-h-screen bg-background md:flex">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-background md:block">
        <div className="sticky top-0">
          <Link href="/admin" className="flex items-center gap-2 border-b border-border px-4 py-3.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon name="peak" className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{org.name}</span>
              <span className="block text-xs text-muted">Owner dashboard</span>
            </span>
          </Link>
          <AdminSideNav counts={counts} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-6">
          <Link href="/admin" className="flex min-w-0 items-center gap-2 md:hidden">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon name="peak" className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-semibold text-foreground">Owner dashboard</span>
          </Link>
          <span className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              <Icon name="external" className="h-4 w-4" />
              <span className="hidden sm:inline">View website</span>
            </Link>
            <AdminLogoutButton />
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-10 md:pt-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <AdminBottomNav counts={counts} />
    </div>
  );
}
