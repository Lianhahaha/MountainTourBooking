export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Flexible";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
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
