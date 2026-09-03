import Stripe from 'stripe';
import { eq, sql, and } from 'drizzle-orm';
import { subscriptions, mails, apiKeysTable, brands, assets } from '@temply/shared/schema';
import type { Db } from '../plugins/db';
import { PLAN_LIMITS as planLimits, type Plan } from '@temply/shared/plans';
import { formatBytes } from '@temply/shared/bytes';


export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, {});
}

export async function getPlan(db: Db, userId: string): Promise<{ plan: Plan; status: string }> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1);

  if (!sub || sub.plan === 'free' || sub.status !== 'active') {
    return { plan: 'free', status: 'active' };
  }
  return { plan: sub.plan as Plan, status: sub.status };
}

export async function getUsage(db: Db, userId: string) {
  const [templateCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mails)
    .where(eq(mails.user_id, userId));

  // Test keys sit outside the plan, so only live ones count toward its cap.
  const [apiKeyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.user_id, userId), eq(apiKeysTable.mode, 'live')));

  return { templates: templateCount?.count ?? 0, apiKeys: apiKeyCount?.count ?? 0 };
}

export async function checkTemplateLimit(db: Db, userId: string): Promise<{ allowed: boolean; message?: string }> {
  const { plan } = await getPlan(db, userId);
  const limits = planLimits[plan];
  const usage = await getUsage(db, userId);
  if (usage.templates >= limits.maxTemplates) {
    return { allowed: false, message: `Free plan is limited to ${limits.maxTemplates} templates. Upgrade to create more.` };
  }
  return { allowed: true };
}

export async function checkApiKeyLimit(db: Db, userId: string): Promise<{ allowed: boolean; message?: string }> {
  const { plan } = await getPlan(db, userId);
  const limits = planLimits[plan];
  if (limits.maxApiKeys === 0) {
    return { allowed: false, message: 'API keys are not available on the Free plan. Upgrade to Pro to create API keys.' };
  }
  const usage = await getUsage(db, userId);
  if (usage.apiKeys >= limits.maxApiKeys) {
    return { allowed: false, message: `You can only create ${limits.maxApiKeys} API keys on your current plan. Upgrade for more.` };
  }
  return { allowed: true };
}

export async function checkBrandLimit(db: Db, userId: string): Promise<{ allowed: boolean; message?: string }> {
  const { plan } = await getPlan(db, userId);
  const limit = planLimits[plan].maxBrands;
  if (!Number.isFinite(limit)) return { allowed: true };
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(brands).where(eq(brands.user_id, userId));
  if ((row?.count ?? 0) >= limit) {
    return { allowed: false, message: `You can save ${limit} brand${limit === 1 ? '' : 's'} on your current plan. Upgrade for more.` };
  }
  return { allowed: true };
}

export async function getStorageUsed(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${assets.bytes}), 0)` })
    .from(assets)
    .where(eq(assets.user_id, userId));
  return Number(row?.total ?? 0);
}

/** Checked before the bytes reach ImageKit, so a refused upload costs nothing
 *  and the DB never has to be reconciled against storage. */
export async function checkStorageLimit(db: Db, userId: string, incomingBytes: number): Promise<{ allowed: boolean; message?: string }> {
  const { plan } = await getPlan(db, userId);
  const limit = planLimits[plan].maxStorageBytes;
  if (!Number.isFinite(limit)) return { allowed: true };
  const used = await getStorageUsed(db, userId);
  if (used + incomingBytes > limit) {
    return {
      allowed: false,
      message: `Storage is full — ${formatBytes(used)} of ${formatBytes(limit)} used. Delete images in your library or upgrade.`,
    };
  }
  return { allowed: true };
}

export async function shouldSnapshot(db: Db, userId: string): Promise<boolean> {
  const { plan } = await getPlan(db, userId);
  return plan !== 'free';
}

export { planLimits };
