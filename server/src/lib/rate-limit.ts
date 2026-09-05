import { API_BURST_PER_MINUTE } from '@temply/shared/plans';
import type { ApiKeyMode } from './codes';

type Window = { minute: number; count: number };
const windows = new Map<string, Window>();

/** Past this many keys in the map the stale windows are swept on insert. */
const SWEEP_ABOVE = 5_000;

export type BurstVerdict = { allowed: true } | { allowed: false; limit: number; retryAfterSeconds: number };

/**
 * A fixed one-minute window per key, held in process. This is a single-
 * instance service — SQLite already says so — and a shared store would be
 * more machinery than the guard is worth. A restart forgives everyone, which
 * is fine for a limit that exists to stop a runaway loop, not to meter use;
 * the monthly quota does the metering.
 */
export function checkBurst(keyId: string, mode: ApiKeyMode, now: Date = new Date()): BurstVerdict {
  const limit = API_BURST_PER_MINUTE[mode];
  const minute = Math.floor(now.getTime() / 60_000);
  const entry = windows.get(keyId);
  if (!entry || entry.minute !== minute) {
    if (windows.size > SWEEP_ABOVE) {
      for (const [id, w] of windows) if (w.minute !== minute) windows.delete(id);
    }
    windows.set(keyId, { minute, count: 1 });
    return { allowed: true };
  }
  if (entry.count >= limit) {
    return { allowed: false, limit, retryAfterSeconds: 60 - Math.floor((now.getTime() % 60_000) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

/** Tests share the module-level map; this is how one test stops leaking into the next. */
export function resetBurstWindows() {
  windows.clear();
}
