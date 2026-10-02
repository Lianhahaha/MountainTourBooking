import { cn } from "@/lib/utils";

/** Slots shown as one segment each: open slots solid, taken slots hollow. */
export function SlotMeter({
  maxSlots,
  remaining,
  animate = false,
  compact = false,
}: {
  maxSlots: number;
  remaining: number;
  animate?: boolean;
  compact?: boolean;
}) {
  const total = Math.max(1, maxSlots);
  const open = Math.min(Math.max(0, remaining), total);
  const low = open > 0 && open <= 3;
  const full = open === 0;
  const label = full
    ? "Full"
    : low
      ? `Only ${open} slot${open === 1 ? "" : "s"} left`
      : `${open} of ${total} slots left`;

  return (
    <div>
      <div
        className={cn("meter", low && "meter--low", animate && "meter--animate")}
        style={{ "--n": total } as React.CSSProperties}
        aria-hidden
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("seg", i < open ? "seg--open" : "seg--taken", compact && "!h-2")}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </div>
      <p
        className={cn(
          "tabular mt-1.5 font-semibold",
          compact ? "text-xs" : "text-[13px]",
          full ? "text-danger" : low ? "text-warning" : "text-foreground"
        )}
      >
        {label}
      </p>
    </div>
  );
}
