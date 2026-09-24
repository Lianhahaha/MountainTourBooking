export function formatPrice(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₱${safe.toLocaleString("en-PH")}`;
}

/** Today's date in Asia/Manila (business timezone), as YYYY-MM-DD. */
export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Flexible";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "bg-primary-muted text-primary";
    case "Moderate":
      return "bg-warning-muted text-warning";
    case "Hard":
      return "bg-danger-muted text-danger";
    default:
      return "bg-surface-elevated text-muted";
  }
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
