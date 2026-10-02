"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Phone-only booking bar. Appears once the hero tag scrolls away and hides
 * while the contact form is on screen so it never covers inputs.
 */
export function StickyBookButton({
  next,
}: {
  next?: { label: string; slotsLeft: number; href: string };
}) {
  const [pastHero, setPastHero] = useState(false);
  const [atContact, setAtContact] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 560);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });

    const contact = document.getElementById("contact");
    const observer = contact
      ? new IntersectionObserver(([entry]) => setAtContact(entry.isIntersecting), {
          rootMargin: "0px 0px -20% 0px",
        })
      : null;
    if (contact && observer) observer.observe(contact);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  const visible = pastHero && !atContact;

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 px-4 pt-2.5 backdrop-blur-md transition-transform duration-300 ease-out md:hidden",
        "pb-[max(0.625rem,env(safe-area-inset-bottom))]",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          {next ? (
            <>
              <p className="truncate text-[13px] font-semibold text-foreground">
                Next climb · {next.label}
              </p>
              <p className="tabular text-xs text-muted">
                {next.slotsLeft} slot{next.slotsLeft === 1 ? "" : "s"} left
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-foreground">Climb with your group</p>
              <p className="text-xs text-muted">Pick your own date</p>
            </>
          )}
        </div>
        <Link
          href={next?.href ?? "/book?trip=private-custom"}
          tabIndex={visible ? undefined : -1}
          className="btn-cta-sm shrink-0 !px-4"
        >
          {next ? "Book now" : "Request"}
        </Link>
      </div>
    </div>
  );
}
