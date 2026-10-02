import { Icon, type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

/** Page title row for owner dashboard screens. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const noticeTones = {
  error: { box: "border-danger/40 bg-danger-muted text-foreground", icon: "close" as IconName, iconTone: "text-danger" },
  warning: { box: "border-warning/40 bg-warning-muted text-foreground", icon: "clock" as IconName, iconTone: "text-warning" },
  success: { box: "border-success/40 bg-primary-muted text-foreground", icon: "check" as IconName, iconTone: "text-success" },
  info: { box: "border-accent/40 bg-accent-muted text-foreground", icon: "chat" as IconName, iconTone: "text-accent" },
};

/** Inline banner for errors, warnings, and results. Announced to screen readers. */
export function Notice({
  tone,
  children,
  action,
  className,
}: {
  tone: keyof typeof noticeTones;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = noticeTones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm", t.box, className)}
    >
      <Icon name={t.icon} className={cn("mt-0.5 h-4 w-4 shrink-0", t.iconTone)} />
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const statusStyles: Record<BookingStatus, string> = {
  pending: "border-warning/40 bg-warning-muted text-warning",
  confirmed: "border-success/40 bg-primary-muted text-success",
  cancelled: "border-border bg-surface text-muted",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Needs reply",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

/** Small counter, GitHub style. `tone="alert"` for overdue items. */
export function CountPill({ n, tone = "neutral" }: { n: number; tone?: "neutral" | "attention" | "alert" }) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "tabular inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-[18px]",
        tone === "alert" && "bg-danger text-white",
        tone === "attention" && "bg-warning-muted text-warning",
        tone === "neutral" && "bg-muted/20 text-foreground"
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function EmptyState({
  icon = "check",
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-border px-4 py-8 text-center">
      <Icon name={icon} className="h-6 w-6 text-muted" />
      <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      {body && <p className="mt-0.5 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Placeholder rows while client data loads. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
          <div className="h-9 w-9 rounded-md bg-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-surface" />
            <div className="h-3 w-1/2 rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
