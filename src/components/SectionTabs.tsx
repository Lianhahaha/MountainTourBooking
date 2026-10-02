"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface SectionTab {
  id: string;
  label: string;
  icon: IconName;
  count?: number;
}

/**
 * GitHub-style underline tabs for the landing page sections. Sticks under
 * the header, highlights the section in view, and scrolls sideways on phones.
 */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const barRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = tabs
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [tabs]);

  // Keep the active tab visible inside the sideways-scrolling bar.
  useEffect(() => {
    const bar = barRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!bar || !tab) return;
    const barBox = bar.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    if (tabBox.left < barBox.left || tabBox.right > barBox.right) {
      bar.scrollBy({ left: tabBox.left - barBox.left - 16, behavior: "smooth" });
    }
  }, [active]);

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-md"
    >
      <ul
        ref={barRef}
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const current = tab.id === active;
          return (
            <li key={tab.id} data-tab={tab.id} className="relative shrink-0">
              <a
                href={`#${tab.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "my-1.5 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-surface",
                  current ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
                )}
              >
                <Icon name={tab.icon} className="h-4 w-4 shrink-0 text-muted" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="tabular min-w-[20px] rounded-full bg-muted/20 px-1.5 text-center text-xs font-medium leading-[18px] text-foreground">
                    {tab.count}
                  </span>
                )}
              </a>
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-1 bottom-0 h-0.5 rounded-full transition-colors",
                  current ? "bg-tab-active" : "bg-transparent"
                )}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
