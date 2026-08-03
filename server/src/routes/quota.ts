import { Elysia } from 'elysia';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { getPlan } from '../lib/billing';
import { getEmailUsage, hoursUntilReset } from '../lib/quota';
import { json, unauthorized } from '../lib/errors';

export const quotaRoutes = new Elysia().get('/api/v1/quota', async (ctx: any) => {
  if (!ctx.userId) return unauthorized();
  const { plan } = await getPlan(ctx.db, ctx.userId);
  const limit = PLAN_LIMITS[plan].maxEmailsPerDay;
  const used = await getEmailUsage(ctx.db, ctx.userId);
  return json({
    plan,
    email: { used, limit, remaining: Math.max(0, limit - used) },
    resetInHours: Math.ceil(hoursUntilReset()),
  });
});
