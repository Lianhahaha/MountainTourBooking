function toLocalDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the ISO week containing `dateISO` (YYYY-MM-DD). */
export function getMondayOfWeek(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalDateISO(d);
}

/** Seven consecutive dates starting from Monday of the week containing `dateISO`. */
export function getWeekDatesFrom(dateISO: string): string[] {
  const monday = getMondayOfWeek(dateISO);
  const start = new Date(`${monday}T00:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toLocalDateISO(d);
  });
}

export function formatWeekdayLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function shiftWeek(dateISO: string, weeks: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toLocalDateISO(d);
}
