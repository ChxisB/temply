import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { subscriptions } from '@temply/shared/schema';
import { getPlan, getUsage, getStripe } from '../lib/billing';
import { json, unauthorized } from '../lib/errors';

export const billingRoutes = new Elysia()
  .get('/api/v1/billing', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const plan = await getPlan(ctx.db, ctx.userId);
    const usage = await getUsage(ctx.db, ctx.userId);
    return json({ ...plan, usage });
  })

  .post('/api/v1/billing/checkout', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const { plan } = ctx.body;
    const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
    if (!priceId) return json({ status: 500, message: `Stripe price ID not configured for ${plan}`, errors: ['Server Error'] }, 500);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const stripe = getStripe();
    let [sub] = await ctx.db.select().from(subscriptions).where(eq(subscriptions.user_id, ctx.userId)).limit(1);
    let stripeCustomerId = sub?.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ metadata: { userId: ctx.userId } });
      stripeCustomerId = customer.id;
      if (!sub) await ctx.db.insert(subscriptions).values({ id: crypto.randomUUID(), user_id: ctx.userId, stripe_customer_id: stripeCustomerId, plan: 'free', status: 'active' });
      else await ctx.db.update(subscriptions).set({ stripe_customer_id: stripeCustomerId }).where(eq(subscriptions.user_id, ctx.userId));
    }
    const session = await stripe.checkout.sessions.create({ customer: stripeCustomerId, mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }], success_url: `${appUrl}/dashboard/billing?success=true`, cancel_url: `${appUrl}/dashboard/billing?canceled=true`, metadata: { userId: ctx.userId, plan } });
    return json({ url: session.url });
  }, { body: t.Object({ plan: t.Union([t.Literal('pro'), t.Literal('scale')]) }) })

  .post('/api/v1/billing/portal', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [sub] = await ctx.db.select().from(subscriptions).where(eq(subscriptions.user_id, ctx.userId)).limit(1);
    if (!sub?.stripe_customer_id) return json({ status: 400, message: 'No subscription found', errors: ['Bad Request'] }, 400);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const session = await getStripe().billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${appUrl}/dashboard/billing` });
    return json({ url: session.url });
  });
