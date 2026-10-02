import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const tones = {
  open: { pill: "bg-accent-muted text-accent", bar: "bg-accent" },
  low: { pill: "bg-warning-muted text-warning", bar: "bg-warning" },
  full: { pill: "bg-danger-muted text-danger", bar: "bg-danger" },
};

/**
 * Slot availability: a labelled status pill plus a thin fill bar.
 * Blue = plenty, amber = 3 or fewer, red = full. The words always say it too.
 */
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
  const state = open === 0 ? "full" : open <= 3 ? "low" : "open";
  const tone = tones[state];
  const label =
    state === "full"
      ? "Full"
      : state === "low"
        ? `Only ${open} slot${open === 1 ? "" : "s"} left`
        : `${open} of ${total} slots left`;

  return (
    <div className="min-w-0">
      <span
        className={cn(
          "tabular inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold",
          compact ? "text-xs" : "text-[13px]",
          tone.pill
        )}
      >
        <Icon name={state === "full" ? "close" : "users"} className="h-3.5 w-3.5" />
        {label}
      </span>
      <div
        role="progressbar"
        aria-label="Slots left"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={open}
        className={cn("overflow-hidden rounded-full bg-border", compact ? "mt-1.5 h-1" : "mt-2 h-1.5")}
      >
        <div
          className={cn("h-full rounded-full", tone.bar, animate && "meter-fill")}
          style={{ width: `${(open / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
