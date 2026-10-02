"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { CountPill } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export interface AdminNavCounts {
  pendingBookings: number;
  overdueBookings: number;
  pendingReviews: number;
}

type Item = { href: string; label: string; icon: IconName; exact?: boolean; count?: number; tone?: "neutral" | "attention" | "alert" };

function navItems(counts: AdminNavCounts): Item[] {
  return [
    { href: "/admin", label: "Today", icon: "home", exact: true },
    {
      href: "/admin/bookings",
      label: "Bookings",
      icon: "users",
      count: counts.pendingBookings,
      tone: counts.overdueBookings > 0 ? "alert" : "attention",
    },
    { href: "/admin/hiking-days", label: "Hiking days", icon: "calendar" },
    { href: "/admin/reviews", label: "Reviews", icon: "star", count: counts.pendingReviews, tone: "attention" },
    { href: "/admin/hike-albums", label: "Albums", icon: "camera" },
  ];
}

function isCurrent(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Desktop sidebar links. */
export function AdminSideNav({ counts }: { counts: AdminNavCounts }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-0.5 p-2">
      {navItems(counts).map((item) => {
        const current = isCurrent(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              current
                ? "bg-surface font-semibold text-foreground"
                : "text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            <Icon name={item.icon} className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.count !== undefined && <CountPill n={item.count} tone={item.tone} />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone bottom tab bar. */
export function AdminBottomNav({ counts }: { counts: AdminNavCounts }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {navItems(counts).map((item) => {
          const current = isCurrent(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                  current ? "text-foreground" : "text-muted"
                )}
              >
                <span className="relative">
                  <Icon name={item.icon} className="h-5 w-5" />
                  {!!item.count && (
                    <span className="absolute -right-3 -top-1.5">
                      <CountPill n={item.count} tone={item.tone} />
                    </span>
                  )}
                </span>
                <span className="truncate">{item.label}</span>
                {current && (
                  <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-tab-active" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
