import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Small JSON store used only when Supabase is not configured (local dev and
 * previews on a writable disk). Vercel's filesystem is read-only, so it is
 * disabled there; pretending to save would lose data on the next request.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const LOCKS = new Map<string, Promise<unknown>>();

export class LocalStoreUnavailableError extends Error {
  constructor() {
    super("Local storage is not available on this deployment. Configure Supabase.");
    this.name = "LocalStoreUnavailableError";
  }
}

export function isLocalStoreAvailable(): boolean {
  return !process.env.VERCEL;
}

function fileFor(name: string): string {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid local store name: ${name}`);
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readLocal<T>(name: string, fallback: T): Promise<T> {
  if (!isLocalStoreAvailable()) throw new LocalStoreUnavailableError();
  try {
    const raw = await fs.readFile(fileFor(name), "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeLocal<T>(name: string, value: T): Promise<void> {
  if (!isLocalStoreAvailable()) throw new LocalStoreUnavailableError();
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = fileFor(name);
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/**
 * Read-modify-write under a per-file lock, so two requests in the same
 * instance cannot clobber each other's change.
 */
export async function updateLocal<T>(
  name: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>
): Promise<T> {
  const previous = LOCKS.get(name) ?? Promise.resolve();
  const task = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await readLocal(name, fallback);
      const next = await mutate(current);
      await writeLocal(name, next);
      return next;
    });
  LOCKS.set(name, task);
  try {
    return await task;
  } finally {
    if (LOCKS.get(name) === task) LOCKS.delete(name);
  }
}
