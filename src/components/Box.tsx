import { cn } from "@/lib/utils";

/** GitHub-style bordered box. */
export function Box({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface-elevated",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Tinted header row along the top of a Box. */
export function BoxHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5",
        className
      )}
    >
      {children}
    </div>
  );
}
