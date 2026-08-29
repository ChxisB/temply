import { and, eq, sql } from 'drizzle-orm';
import { apiUsage } from '@temply/shared/schema';
import type { Db } from '../plugins/db';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { getPlan } from './billing';

const londonParts = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .split('-'); // ["YYYY","MM","DD"]

/** "YYYY-MM" for the London calendar month. */
export function ukMonthString(now: Date = new Date()): string {
  const [y, m] = londonParts(now);
  return `${y}-${m}`;
}

/** ISO date ("YYYY-MM-DD") of the 1st of next London month. */
export function nextResetDate(now: Date = new Date()): string {
  const [y, m] = londonParts(now).map(Number);
  const year = m === 12 ? y + 1 : y;
  const month = m === 12 ? 1 : m + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export async function getApiUsage(db: Db, userId: string, now: Date = new Date()): Promise<number> {
  const period = ukMonthString(now);
  const [row] = await db
    .select()
    .from(apiUsage)
    .where(and(eq(apiUsage.user_id, userId), eq(apiUsage.period, period)))
    .limit(1);
  return row?.count ?? 0;
}

export async function checkApiQuota(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<{ allowed: boolean; message?: string; used: number; limit: number; remaining: number }> {
  const { plan } = await getPlan(db, userId);
  const limit = PLAN_LIMITS[plan].maxApiCalls;
  const used = await getApiUsage(db, userId, now);
  if (!Number.isFinite(limit)) return { allowed: true, used, limit, remaining: Infinity };
  const remaining = Math.max(0, limit - used);
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      remaining,
      message: `Monthly API limit reached — ${limit} calls on the ${plan} plan. Upgrade for more.`,
    };
  }
  return { allowed: true, used, limit, remaining };
}

export async function recordApiCall(db: Db, userId: string, now: Date = new Date()): Promise<void> {
  const period = ukMonthString(now);
  await db
    .insert(apiUsage)
    .values({ user_id: userId, period, count: 1 })
    .onConflictDoUpdate({
      target: [apiUsage.user_id, apiUsage.period],
      set: { count: sql`${apiUsage.count} + 1` },
    });
}
