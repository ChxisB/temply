import { beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { apiKeysTable, mails } from '@temply/shared/schema';
import { generateApiKey, generateShortCode } from '../lib/codes';
import { createTestApp, createTestDb, givePlan, type TestDb } from '../test/helpers';
import { publicRoutes } from './public';

let db: TestDb;
let app: any;

const OWNER = 'user_owner';

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db, publicRoutes);
});

async function seedKey(userId: string, { revoked = false } = {}) {
  const { fullKey, prefix, hash } = generateApiKey();
  const id = crypto.randomUUID();
  await db.insert(apiKeysTable).values({
    id,
    user_id: userId,
    name: 'Production',
    key_prefix: prefix,
    key_hash: hash,
    revoked_at: revoked ? new Date().toISOString() : null,
  });
  return { id, fullKey };
}

async function seedTemplate(userId: string) {
  const shortCode = generateShortCode();
  await db.insert(mails).values({
    id: crypto.randomUUID(),
    user_id: userId,
    title: 'Welcome email',
    preview_text: 'Hello there',
    content: '{"type":"doc"}',
    short_code: shortCode,
  });
  return shortCode;
}

function fetchTemplate(shortCode: string, apiKey?: string) {
  return app.handle(
    new Request(`http://localhost/api/public/v1/templates/${shortCode}`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    }),
  );
}

describe('GET /api/public/v1/templates/:shortCode', () => {
  it('401s without an Authorization header', async () => {
    const shortCode = await seedTemplate(OWNER);
    const res = await fetchTemplate(shortCode);
    expect(res.status).toBe(401);
    expect((await res.json()).message).toContain('Authorization');
  });

  it('401s when the bearer token is not a known key', async () => {
    const shortCode = await seedTemplate(OWNER);
    const res = await fetchTemplate(shortCode, 'tply_live_notarealkey');
    expect(res.status).toBe(401);
  });

  it('401s for a revoked key', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER, { revoked: true });
    const shortCode = await seedTemplate(OWNER);

    const res = await fetchTemplate(shortCode, fullKey);
    expect(res.status).toBe(401);
  });

  it('402s when the key belongs to a free user', async () => {
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER);

    const res = await fetchTemplate(shortCode, fullKey);
    expect(res.status).toBe(402);
    expect((await res.json()).message).toContain('paid plan');
  });

  it('404s for an unknown short code', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);

    const res = await fetchTemplate('tpl_00000000', fullKey);
    expect(res.status).toBe(404);
  });

  it('returns the template metadata for a paid key, without the content', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER);

    const res = await fetchTemplate(shortCode, fullKey);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.shortCode).toBe(shortCode);
    expect(body.title).toBe('Welcome email');
    expect(body.previewText).toBe('Hello there');
    expect(body.content).toBeUndefined();
  });

  it('stamps last_used_at on a successful call', async () => {
    await givePlan(db, OWNER, 'pro');
    const { id, fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER);

    const [before] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, id));
    expect(before.last_used_at).toBeNull();

    await fetchTemplate(shortCode, fullKey);

    const [after] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, id));
    expect(after.last_used_at).not.toBeNull();
  });
});
