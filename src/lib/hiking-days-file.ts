import { promises as fs } from "fs";
import path from "path";
import type { HikingDay } from "@/data/hiking-days";
import { seedHikingDays } from "@/data/hiking-days";

const HIKING_DAYS_FILE = path.join(process.cwd(), "data", "hiking-days.json");

async function ensureHikingDaysFile(): Promise<HikingDay[]> {
  const dir = path.dirname(HIKING_DAYS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    const raw = await fs.readFile(HIKING_DAYS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as HikingDay[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* seed on first use */
  }
  await fs.writeFile(HIKING_DAYS_FILE, JSON.stringify(seedHikingDays, null, 2), "utf-8");
  return seedHikingDays;
}

export async function getAllHikingDays(): Promise<HikingDay[]> {
  const days = await ensureHikingDaysFile();
  return days.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getHikingDayById(id: string): Promise<HikingDay | undefined> {
  const days = await getAllHikingDays();
  return days.find((d) => d.id === id);
}

export async function saveHikingDay(
  day: HikingDay
): Promise<{ ok: boolean; error?: string }> {
  try {
    const days = await ensureHikingDaysFile();
    const index = days.findIndex((d) => d.id === day.id);
    if (index >= 0) {
      days[index] = day;
    } else {
      days.push(day);
    }
    await fs.writeFile(HIKING_DAYS_FILE, JSON.stringify(days, null, 2), "utf-8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save hiking day",
    };
  }
}

export async function deleteHikingDay(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const days = await ensureHikingDaysFile();
    const filtered = days.filter((d) => d.id !== id);
    if (filtered.length === days.length) {
      return { ok: false, error: "Hiking day not found" };
    }
    await fs.writeFile(HIKING_DAYS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete hiking day",
    };
  }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
