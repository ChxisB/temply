import { Elysia } from 'elysia';
import { getPlan } from '../lib/billing';
import { getApiUsage, nextResetDate } from '../lib/api-quota';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { json, unauthorized } from '../lib/errors';

export const quotaRoutes = new Elysia().get('/api/v1/quota', async (ctx: any) => {
  if (!ctx.userId) return unauthorized();
  const { plan } = await getPlan(ctx.db, ctx.userId);
  const rawLimit = PLAN_LIMITS[plan].maxApiCalls;
  const limit = Number.isFinite(rawLimit) ? rawLimit : null; // null = unlimited over the wire
  const used = await getApiUsage(ctx.db, ctx.userId);
  return json({
    plan,
    api: { used, limit, remaining: limit === null ? null : Math.max(0, limit - used) },
    resetsOn: nextResetDate(),
  });
});
