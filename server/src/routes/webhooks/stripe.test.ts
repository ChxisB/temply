import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { subscriptions } from '@temply/shared/schema';
import { createTestApp, createTestDb, type TestDb } from '../../test/helpers';
import { webhookRoutes } from './stripe';

const SECRET = 'whsec_test_secret_for_signing';
const ORG = 'org_billing';

let db: TestDb;
let app: any;

beforeEach(async () => {
  db = createTestDb();
  app = createTestApp(db, webhookRoutes);
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  // getStripe() needs a key to build the client; verification never calls out.
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  await db.insert(subscriptions).values({ id: crypto.randomUUID(), user_id: 'user_a', org_id: ORG, plan: 'free', status: 'active', stripe_customer_id: 'cus_a' });
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
});

/** Stripe's scheme: `t=<ts>,v1=hex(HMAC-SHA256(secret, `${ts}.${body}`))`. */
function signed(body: string, secret = SECRET) {
  const ts = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${ts},v1=${v1}` },
    body,
  });
}

const checkoutCompleted = JSON.stringify({
  id: 'evt_1',
  object: 'event',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_1', object: 'checkout.session', customer: 'cus_a', subscription: 'sub_a', metadata: { orgId: ORG, userId: 'user_a', plan: 'pro' } } },
});

describe('POST /api/webhooks/stripe', () => {
  it('rejects a body signed with another secret', async () => {
    const res = await app.handle(signed(checkoutCompleted, 'whsec_other'));
    expect(res.status).toBe(400);
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.org_id, ORG));
    expect(sub.plan).toBe('free');
  });

  it('verifies a genuine signature and moves the workspace onto its plan', async () => {
    const res = await app.handle(signed(checkoutCompleted));
    expect(res.status).toBe(200);
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.org_id, ORG));
    expect(sub.plan).toBe('pro');
    expect(sub.status).toBe('active');
    expect(sub.stripe_subscription_id).toBe('sub_a');
  });

  it('records a scheduled cancellation and clears it on resume', async () => {
    await app.handle(signed(checkoutCompleted));
    const ends = 1_790_000_000;
    const updated = (cancel_at: number | null) =>
      JSON.stringify({ id: 'evt_u', object: 'event', type: 'customer.subscription.updated', data: { object: { id: 'sub_a', object: 'subscription', customer: 'cus_a', status: 'active', cancel_at, cancel_at_period_end: false, items: { data: [{ current_period_end: ends }] } } } });

    expect((await app.handle(signed(updated(ends)))).status).toBe(200);
    let [sub] = await db.select().from(subscriptions).where(eq(subscriptions.org_id, ORG));
    expect(sub.plan).toBe('pro');
    expect(sub.cancel_at).toBe(new Date(ends * 1000).toISOString());
    expect(sub.current_period_end).toBe(new Date(ends * 1000).toISOString());

    expect((await app.handle(signed(updated(null)))).status).toBe(200);
    [sub] = await db.select().from(subscriptions).where(eq(subscriptions.org_id, ORG));
    expect(sub.cancel_at).toBeNull();
  });

  it('drops the workspace back to free when the subscription is deleted', async () => {
    await app.handle(signed(checkoutCompleted));
    const deleted = JSON.stringify({ id: 'evt_2', object: 'event', type: 'customer.subscription.deleted', data: { object: { id: 'sub_a', object: 'subscription', customer: 'cus_a' } } });
    expect((await app.handle(signed(deleted))).status).toBe(200);
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.org_id, ORG));
    expect(sub.plan).toBe('free');
    expect(sub.status).toBe('canceled');
    expect(sub.stripe_subscription_id).toBeNull();
  });
});
