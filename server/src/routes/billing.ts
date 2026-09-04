import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { subscriptions } from '@temply/shared/schema';
import { getPlan, getUsage, getStripe } from '../lib/billing';
import { PLAN_LIMITS, serialiseLimits } from '@temply/shared/plans';
import { json, unauthorized } from '../lib/errors';
import { authPlugin } from '../plugins/auth';
import { askAnAdmin, isAdmin, noWorkspace } from '../lib/workspace';
import { dbPlugin } from '../plugins/db';

export const billingRoutes = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .get('/api/v1/billing', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    if (!ctx.orgId) return noWorkspace();
    const plan = await getPlan(ctx.db, ctx.orgId);
    const usage = await getUsage(ctx.db, ctx.orgId);
    // Limits go out so the client can tell "full" from "room to spare" without
    // reimplementing the plan rules. Infinity is sent as null (see plans.ts).
    const limits = serialiseLimits(PLAN_LIMITS[plan.plan]);
    return json({ ...plan, usage, limits });
  })

  .post('/api/v1/billing/checkout', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    if (!ctx.orgId) return noWorkspace();
    if (!isAdmin(ctx)) return askAnAdmin('change the plan');
    const { plan } = ctx.body;
    const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
    if (!priceId) return json({ status: 500, message: `Stripe price ID not configured for ${plan}`, errors: ['Server Error'] }, 500);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const stripe = getStripe();
    let [sub] = await ctx.db.select().from(subscriptions).where(eq(subscriptions.org_id, ctx.orgId)).limit(1);
    let stripeCustomerId = sub?.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ metadata: { orgId: ctx.orgId, userId: ctx.userId } });
      stripeCustomerId = customer.id;
      if (!sub) await ctx.db.insert(subscriptions).values({ id: crypto.randomUUID(), user_id: ctx.userId, org_id: ctx.orgId, stripe_customer_id: stripeCustomerId, plan: 'free', status: 'active' });
      else await ctx.db.update(subscriptions).set({ stripe_customer_id: stripeCustomerId }).where(eq(subscriptions.org_id, ctx.orgId));
    }
    const session = await stripe.checkout.sessions.create({ customer: stripeCustomerId, mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }], success_url: `${appUrl}/dashboard/settings/plan?success=true`, cancel_url: `${appUrl}/dashboard/settings/plan?canceled=true`, metadata: { orgId: ctx.orgId, userId: ctx.userId, plan } });
    return json({ url: session.url });
  }, { body: t.Object({ plan: t.Literal('pro') }) })

  .post('/api/v1/billing/portal', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    if (!ctx.orgId) return noWorkspace();
    if (!isAdmin(ctx)) return askAnAdmin('manage billing');
    const [sub] = await ctx.db.select().from(subscriptions).where(eq(subscriptions.org_id, ctx.orgId)).limit(1);
    if (!sub?.stripe_customer_id) return json({ status: 400, message: 'No subscription found', errors: ['Bad Request'] }, 400);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const session = await getStripe().billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${appUrl}/dashboard/settings/plan` });
    return json({ url: session.url });
  });
