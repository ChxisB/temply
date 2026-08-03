import { and, eq, sql } from 'drizzle-orm';
import { sendUsage } from '@temply/shared/schema';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { getPlan } from './billing';

/** "YYYY-MM-DD" for the given instant in UK local time. en-CA gives ISO order. */
export function ukDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Fractional hours until the next London midnight. Reads the London wall clock
 *  so it stays correct across BST/GMT. */
export function hoursUntilReset(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const val = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  let h = val('hour');
  if (h === 24) h = 0; // en-GB emits 24 at midnight
  const secsToday = h * 3600 + val('minute') * 60 + val('second');
  return (86400 - secsToday) / 3600;
}

export async function getEmailUsage(db: any, userId: string, now: Date = new Date()): Promise<number> {
  const day = ukDateString(now);
  const [row] = await db
    .select()
    .from(sendUsage)
    .where(and(eq(sendUsage.user_id, userId), eq(sendUsage.usage_date, day)))
    .limit(1);
  return row?.count ?? 0;
}

export async function checkEmailQuota(
  db: any,
  userId: string,
  recipients: number,
  now: Date = new Date(),
): Promise<{ allowed: boolean; message?: string; used: number; limit: number; remaining: number }> {
  const { plan } = await getPlan(db, userId);
  const limit = PLAN_LIMITS[plan].maxEmailsPerDay;
  const used = await getEmailUsage(db, userId, now);
  const remaining = Math.max(0, limit - used);
  if (used + recipients > limit) {
    return {
      allowed: false,
      used,
      limit,
      remaining,
      message: `Daily send limit reached — ${limit}/day on the ${plan} plan, ${remaining} left today. Upgrade for a higher limit.`,
    };
  }
  return { allowed: true, used, limit, remaining };
}

export async function recordEmailSend(db: any, userId: string, count: number, now: Date = new Date()): Promise<void> {
  const day = ukDateString(now);
  await db
    .insert(sendUsage)
    .values({ user_id: userId, usage_date: day, count })
    .onConflictDoUpdate({
      target: [sendUsage.user_id, sendUsage.usage_date],
      set: { count: sql`${sendUsage.count} + ${count}` },
    });
}
