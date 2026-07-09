"use client";

import Link from "next/link";
import { useState } from "react";
import { org } from "@/data/org";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OwnerNavLink } from "@/components/OwnerNavLink";

const navLinks = [
  { href: "/#about", label: "About" },
  { href: "/#trips", label: "Trips" },
  { href: "/hikes", label: "Hikes" },
  { href: "/#trust", label: "Licenses" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-semibold tracking-wide text-foreground"
        >
          {org.name}
        </Link>

        <nav className="hidden items-center gap-3 md:flex lg:gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition hover:text-accent"
            >
              {link.label}
            </a>
          ))}
          <ThemeToggle />
          <OwnerNavLink />
          <Link
            href="/book"
            className="btn-cta-sm !px-4"
          >
            Book a Hike
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-lg p-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="absolute inset-x-0 top-full flex flex-col border-b border-border bg-surface/95 px-4 py-6 shadow-xl backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-md px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/10 hover:text-accent active:bg-muted/20"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 border-t border-border/60 mx-4" />
            <OwnerNavLink mobile />
            <Link
              href="/book"
              className="btn-cta mt-4 block text-center !py-3.5 text-base"
              onClick={() => setOpen(false)}
            >
              Book a Hike
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
