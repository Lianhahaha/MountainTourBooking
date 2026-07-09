import type { TrekSession } from "@/types";

export const seedTrekSessions: TrekSession[] = [
  {
    id: "session-2026-08-15",
    date: "2026-08-15",
    time: "6:00 AM",
    maxSlots: 12,
    bookedCount: 0,
    status: "open",
    notes: "Sta. Cruz trail jump-off. Meet at DENR checkpoint.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "session-2026-09-12",
    date: "2026-09-12",
    time: "5:30 AM",
    maxSlots: 12,
    bookedCount: 0,
    status: "open",
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];
