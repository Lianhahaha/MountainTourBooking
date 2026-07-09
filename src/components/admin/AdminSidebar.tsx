"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { org } from "@/data/org";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Booking queue" },
  { href: "/admin/hiking-days", label: "Hiking days" },
  { href: "/admin/hike-albums", label: "Hike albums" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-border bg-surface md:w-56 md:min-h-screen md:border-b-0 md:border-r">
      <div className="border-b border-border px-2 py-2 md:px-4 md:py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Owner</p>
        <p className="mt-1 font-semibold text-foreground">{org.name}</p>
      </div>

      <Link
        href="/"
        className="mx-2 mt-1.5 flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-2 py-1.5 text-xs font-medium text-foreground transition hover:border-muted hover:bg-background md:mt-3 md:px-3 md:py-2.5 md:text-sm"
      >
        <span aria-hidden>↗</span>
        View website
      </Link>

      <nav className="flex gap-1 overflow-x-auto p-1 md:flex-col md:overflow-visible md:p-2">
        {adminLinks.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition md:shrink md:px-3 md:py-2 md:text-sm",
                active
                  ? "bg-accent-muted font-semibold text-accent"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
