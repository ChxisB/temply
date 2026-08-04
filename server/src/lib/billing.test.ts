import { beforeEach, describe, expect, it } from 'bun:test';
import { apiKeysTable, mails } from '@temply/shared/schema';
import { createTestDb, givePlan, type TestDb } from '../test/helpers';
import {
  checkApiCallLimit,
  checkApiKeyLimit,
  checkTemplateLimit,
  getPlan,
  getUsage,
  planLimits,
  shouldSnapshot,
} from './billing';

let db: TestDb;

beforeEach(() => {
  db = createTestDb();
});

async function addTemplates(userId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await db.insert(mails).values({
      id: crypto.randomUUID(),
      user_id: userId,
      title: `Template ${i}`,
      content: '{}',
      short_code: `tpl_${userId}_${i}`,
    });
  }
}

async function addApiKeys(userId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await db.insert(apiKeysTable).values({
      id: crypto.randomUUID(),
      user_id: userId,
      name: `Key ${i}`,
      key_prefix: 'tply_live_aaaa',
      key_hash: `hash-${userId}-${i}`,
    });
  }
}

describe('getPlan', () => {
  it('falls back to free when the user has no subscription row', async () => {
    expect(await getPlan(db, 'user_1')).toEqual({ plan: 'free', status: 'active' });
  });

  it('returns the paid plan when the subscription is active', async () => {
    await givePlan(db, 'user_1', 'pro');
    expect(await getPlan(db, 'user_1')).toEqual({ plan: 'pro', status: 'active' });
  });

  it('downgrades to free when a paid subscription is no longer active', async () => {
    await givePlan(db, 'user_1', 'enterprise', 'past_due');
    expect(await getPlan(db, 'user_1')).toEqual({ plan: 'free', status: 'active' });
  });

  it('does not leak another user’s plan', async () => {
    await givePlan(db, 'user_1', 'enterprise');
    expect(await getPlan(db, 'user_2')).toEqual({ plan: 'free', status: 'active' });
  });
});

describe('getUsage', () => {
  it('counts only the rows belonging to the user', async () => {
    await addTemplates('user_1', 2);
    await addTemplates('user_2', 5);
    await addApiKeys('user_1', 3);

    expect(await getUsage(db, 'user_1')).toEqual({ templates: 2, apiKeys: 3 });
  });

  it('reports zero for a user with nothing stored', async () => {
    expect(await getUsage(db, 'nobody')).toEqual({ templates: 0, apiKeys: 0 });
  });
});

describe('checkTemplateLimit', () => {
  it('allows a free user below the cap', async () => {
    await addTemplates('user_1', planLimits.free.maxTemplates - 1);
    expect(await checkTemplateLimit(db, 'user_1')).toEqual({ allowed: true });
  });

  it('blocks a free user at the cap', async () => {
    await addTemplates('user_1', planLimits.free.maxTemplates);
    const result = await checkTemplateLimit(db, 'user_1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Upgrade');
  });

  it('lets a paid user go past the free cap', async () => {
    await givePlan(db, 'user_1', 'pro');
    await addTemplates('user_1', planLimits.free.maxTemplates + 1);
    expect(await checkTemplateLimit(db, 'user_1')).toEqual({ allowed: true });
  });
});

describe('checkApiKeyLimit', () => {
  it('allows a free user one key, then blocks the next', async () => {
    expect(await checkApiKeyLimit(db, 'user_1')).toEqual({ allowed: true });
    await addApiKeys('user_1', planLimits.free.maxApiKeys);
    const result = await checkApiKeyLimit(db, 'user_1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('API keys');
  });

  it('allows a pro user below their cap', async () => {
    await givePlan(db, 'user_1', 'pro');
    await addApiKeys('user_1', planLimits.pro.maxApiKeys - 1);
    expect(await checkApiKeyLimit(db, 'user_1')).toEqual({ allowed: true });
  });

  it('blocks a pro user at their cap', async () => {
    await givePlan(db, 'user_1', 'pro');
    await addApiKeys('user_1', planLimits.pro.maxApiKeys);
    const result = await checkApiKeyLimit(db, 'user_1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('API keys');
  });

  it('never caps an enterprise user', async () => {
    await givePlan(db, 'user_1', 'enterprise');
    await addApiKeys('user_1', planLimits.pro.maxApiKeys + 20);
    expect(await checkApiKeyLimit(db, 'user_1')).toEqual({ allowed: true });
  });
});

describe('shouldSnapshot', () => {
  it('is off for free users', async () => {
    expect(await shouldSnapshot(db, 'user_1')).toBe(false);
  });

  it('is on for paid users', async () => {
    await givePlan(db, 'user_1', 'pro');
    expect(await shouldSnapshot(db, 'user_1')).toBe(true);
  });
});

describe('checkApiCallLimit', () => {
  it('blocks free users from the public API', async () => {
    const result = await checkApiCallLimit(db, 'user_1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('paid plan');
  });

  it('allows paid users', async () => {
    await givePlan(db, 'user_1', 'pro');
    expect(await checkApiCallLimit(db, 'user_1')).toEqual({ allowed: true });
  });
});
