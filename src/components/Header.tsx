"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { org } from "@/data/org";
import { Icon } from "@/components/Icon";
import { ThemeToggle, ThemeSegmented } from "@/components/ThemeToggle";
import { OwnerNavLink } from "@/components/OwnerNavLink";
import { cn } from "@/lib/utils";

const navLinks = [
  { id: "dates", href: "/#dates", label: "Dates" },
  { id: "included", href: "/#included", label: "Inclusions" },
  { id: "about", href: "/#about", label: "About" },
  { id: "photos", href: "/hikes", label: "Photos" },
  { id: "faq", href: "/#faq", label: "FAQ" },
  { id: "contact", href: "/#contact", label: "Contact" },
];

/** Highlights the landing-page section currently in view. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const sections = navLinks
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [enabled]);

  return enabled ? active : null;
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  const active = useActiveSection(isHome);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function isCurrent(link: (typeof navLinks)[number]) {
    if (link.href.startsWith("/#")) return active === link.id;
    return pathname.startsWith(link.href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icon name="peak" className="h-4 w-4" />
          </span>
          <span className="font-display text-[17px] font-bold leading-none tracking-tight">
            {org.name}
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              aria-current={isCurrent(link) ? "true" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                isCurrent(link)
                  ? "bg-surface text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {link.label}
            </a>
          ))}
          <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />
          <OwnerNavLink />
          <ThemeToggle />
          <Link href="/book" className="btn-cta-sm ml-1.5">
            Book a climb
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 md:hidden">
          <Link href="/book" className="btn-cta-sm !min-h-[36px] !px-3 !text-[13px]">
            Book
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-surface"
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
            className="fixed inset-0 top-14 z-40 bg-black/30 md:hidden"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-menu"
            aria-label="Main"
            className="absolute inset-x-0 top-full z-50 border-b border-border bg-background px-4 pb-4 pt-2 shadow-[var(--shadow)] md:hidden"
          >
            <ul className="grid grid-cols-2 gap-1">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isCurrent(link) ? "true" : undefined}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                      isCurrent(link)
                        ? "bg-surface text-foreground"
                        : "text-foreground/85 hover:bg-surface"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2">
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
