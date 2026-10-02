"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { org } from "@/data/org";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle, ThemeSegmented } from "@/components/ThemeToggle";
import { OwnerNavLink } from "@/components/OwnerNavLink";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: IconName };

const sectionLinks: NavLink[] = [
  { href: "/#dates", label: "Dates", icon: "calendar" },
  { href: "/#included", label: "Inclusions", icon: "backpack" },
  { href: "/#about", label: "About", icon: "shield" },
  { href: "/#faq", label: "FAQ", icon: "question" },
  { href: "/#contact", label: "Contact", icon: "mail" },
];

const pageLinks: NavLink[] = [
  { href: "/hikes", label: "Photo albums", icon: "camera" },
  { href: "/book?trip=private-custom", label: "Private group climb", icon: "users" },
  { href: "/terms", label: "Terms of Use", icon: "doc" },
  { href: "/privacy", label: "Privacy Policy", icon: "shield" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // On the landing page the section tabs carry in-page navigation, so the
  // header keeps only cross-page links there.
  const desktopLinks: NavLink[] = isHome
    ? [{ href: "/hikes", label: "Photos", icon: "camera" }]
    : [...sectionLinks.slice(0, 3), { href: "/hikes", label: "Photos", icon: "camera" }, ...sectionLinks.slice(3)];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-foreground"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icon name="peak" className="h-4 w-4" />
          </span>
          <span className="truncate font-display text-[17px] font-bold leading-none tracking-tight">
            {org.name}
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {desktopLinks.map((link) => {
            const current = !link.href.includes("#") && pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-background",
                  current ? "text-foreground" : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />
          <OwnerNavLink />
          <ThemeToggle />
          <Link href="/book" className="btn-cta-sm ml-1.5">
            Book a climb
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <Link href="/book" className="btn-cta-sm !min-h-[36px] !px-3 !text-[13px]">
            Book
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-background"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            className="fixed inset-0 top-14 z-40 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-menu"
            aria-label="Main"
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-surface px-4 pb-4 pt-3 shadow-[var(--shadow)] md:hidden"
          >
            <MenuGroup title="On the home page" links={sectionLinks} onPick={() => setOpen(false)} />
            <MenuGroup title="More" links={pageLinks} onPick={() => setOpen(false)} pathname={pathname} />
            <div className="mt-1">
              <OwnerNavLink mobile />
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <ThemeSegmented />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

function MenuGroup({
  title,
  links,
  onPick,
  pathname,
}: {
  title: string;
  links: NavLink[];
  onPick: () => void;
  pathname?: string;
}) {
  return (
    <div className="mb-2">
      <p className="px-2 pb-1 text-xs font-semibold text-muted">{title}</p>
      <ul className="grid grid-cols-2 gap-x-1">
        {links.map((link) => {
          // Links with a query (e.g. the private-climb booking link) never count as current.
          const current = pathname !== undefined && pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onPick}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-2.5 text-[15px] transition-colors hover:bg-background",
                  current ? "font-semibold text-foreground" : "text-foreground"
                )}
              >
                <Icon name={link.icon} className="h-4 w-4 shrink-0 text-muted" />
                <span className="truncate">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
