"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { cn, formatPrice } from "@/lib/utils";
import type { Trip } from "@/types";

type ListKey = "included" | "notIncluded" | "whatToBring";

const lists: { key: ListKey; label: string; icon: IconName; tone: string }[] = [
  { key: "included", label: "Included", icon: "check", tone: "text-primary" },
  { key: "notIncluded", label: "Not included", icon: "minus", tone: "text-muted" },
  { key: "whatToBring", label: "Pack list", icon: "backpack", tone: "text-accent" },
];

export function Inclusions({ trip }: { trip: Trip }) {
  const [active, setActive] = useState<ListKey>("included");

  return (
    <section id="included" className="border-b border-border bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          What your {formatPrice(trip.price)} covers
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          For the {trip.title}. Private climbs are quoted per group.
        </p>

        <div
          role="tablist"
          aria-label="Trek inclusions"
          className="mt-5 grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-1 md:hidden"
        >
          {lists.map((list) => (
            <button
              key={list.key}
              type="button"
              role="tab"
              id={`tab-${list.key}`}
              aria-selected={active === list.key}
              aria-controls={`panel-${list.key}`}
              onClick={() => setActive(list.key)}
              className={cn(
                "rounded-md px-2 py-1.5 text-[13px] font-semibold transition-colors",
                active === list.key
                  ? "bg-surface-elevated text-foreground shadow-[var(--shadow)]"
                  : "text-muted"
              )}
            >
              {list.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-4 md:mt-6 md:grid-cols-3">
          {lists.map((list) => (
            <div
              key={list.key}
              id={`panel-${list.key}`}
              role="tabpanel"
              aria-labelledby={`tab-${list.key}`}
              className={cn(
                "rounded-lg border border-border bg-surface-elevated p-4 woven sm:p-5",
                active === list.key ? "block" : "hidden md:block"
              )}
            >
              <h3 className="spec-label hidden md:block">{list.label}</h3>
              <ul className="space-y-2 md:mt-3">
                {trip[list.key].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Icon name={list.icon} className={cn("mt-0.5 h-4 w-4 shrink-0", list.tone)} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
