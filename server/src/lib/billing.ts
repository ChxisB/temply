import Stripe from 'stripe';
import { eq, sql } from 'drizzle-orm';
import { subscriptions, mails, apiKeysTable } from '@temply/shared/schema';
import { PLAN_LIMITS as planLimits, type Plan } from '@temply/shared/plans';


export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, {});
}

export async function getPlan(db: any, userId: string): Promise<{ plan: Plan; status: string }> {
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

export async function getUsage(db: any, userId: string) {
  const [templateCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mails)
    .where(eq(mails.user_id, userId));

  const [apiKeyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.user_id, userId));

  return { templates: templateCount?.count ?? 0, apiKeys: apiKeyCount?.count ?? 0 };
}

export async function checkTemplateLimit(db: any, userId: string): Promise<{ allowed: boolean; message?: string }> {
  const { plan } = await getPlan(db, userId);
  const limits = planLimits[plan];
  const usage = await getUsage(db, userId);
  if (usage.templates >= limits.maxTemplates) {
    return { allowed: false, message: `Free plan is limited to ${limits.maxTemplates} templates. Upgrade to create more.` };
  }
  return { allowed: true };
}

export async function checkApiKeyLimit(db: any, userId: string): Promise<{ allowed: boolean; message?: string }> {
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

export async function shouldSnapshot(db: any, userId: string): Promise<boolean> {
  const { plan } = await getPlan(db, userId);
  return plan !== 'free';
}

export async function checkApiCallLimit(db: any, userId: string): Promise<{ allowed: boolean; message?: string }> {
  const { plan } = await getPlan(db, userId);
  if (plan === 'free') return { allowed: false, message: 'API access requires a paid plan. Upgrade at /dashboard/billing.' };
  return { allowed: true };
}

export { planLimits };
