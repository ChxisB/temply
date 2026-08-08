import { beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { apiKeysTable, apiUsage, mails } from '@temply/shared/schema';
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

async function seedTemplate(userId: string, content = '{"type":"doc"}') {
  const shortCode = generateShortCode();
  await db.insert(mails).values({
    id: crypto.randomUUID(),
    user_id: userId,
    title: 'Welcome email',
    preview_text: 'Hello there',
    content,
    short_code: shortCode,
  });
  return shortCode;
}

/** A document whose one paragraph is gated on `isMember`. */
const CONDITIONAL_DOC = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { showIfKey: 'isMember' },
      content: [{ type: 'text', text: 'Members only' }],
    },
  ],
});

function renderTemplate(shortCode: string, apiKey?: string, data?: unknown) {
  return app.handle(
    new Request(`http://localhost/api/public/v1/templates/${shortCode}/render`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(data === undefined ? {} : { data }),
    }),
  );
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

  it('allows a free user and increments usage', async () => {
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER);

    const res = await fetchTemplate(shortCode, fullKey);
    expect(res.status).toBe(200);

    const { getApiUsage } = await import('../lib/api-quota');
    expect(await getApiUsage(db, OWNER)).toBe(1);
  });

  it('returns 429 when the monthly limit is reached and does not serve', async () => {
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER);
    const { ukMonthString } = await import('../lib/api-quota');
    await db.insert(apiUsage).values({ user_id: OWNER, period: ukMonthString(), count: 10_000 });

    const res = await fetchTemplate(shortCode, fullKey);
    expect(res.status).toBe(429);
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

  it('404s for a template belonging to another account', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const someoneElses = await seedTemplate('user_stranger');

    const res = await fetchTemplate(someoneElses, fullKey);
    expect(res.status).toBe(404);
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

describe('POST /api/public/v1/templates/:shortCode/render', () => {
  it('401s without a key', async () => {
    const shortCode = await seedTemplate(OWNER);
    expect((await renderTemplate(shortCode)).status).toBe(401);
  });

  it('404s for a template belonging to another account', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const someoneElses = await seedTemplate('user_stranger');

    expect((await renderTemplate(someoneElses, fullKey)).status).toBe(404);
  });

  it('returns the rendered HTML', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER, CONDITIONAL_DOC);

    const res = await renderTemplate(shortCode, fullKey);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.shortCode).toBe(shortCode);
    expect(body.html).toContain('<html');
  });

  it('returns a text alternative beside the HTML', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER, CONDITIONAL_DOC);

    const { html, text } = await (await renderTemplate(shortCode, fullKey)).json();
    expect(text).toContain('Members only');
    // The point of the alternative: no markup for a client that cannot show it.
    expect(text).not.toContain('<table');
    expect(text.length).toBeLessThan(html.length);
  });

  it('shows a conditional block when no data is sent', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER, CONDITIONAL_DOC);

    const { html } = await (await renderTemplate(shortCode, fullKey)).json();
    expect(html).toContain('Members only');
  });

  it('drops a conditional block when the data says so', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER, CONDITIONAL_DOC);

    const { html } = await (await renderTemplate(shortCode, fullKey, { isMember: false })).json();
    expect(html).not.toContain('Members only');
  });

  it('keeps a conditional block when the data allows it', async () => {
    await givePlan(db, OWNER, 'pro');
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER, CONDITIONAL_DOC);

    const { html } = await (await renderTemplate(shortCode, fullKey, { isMember: true })).json();
    expect(html).toContain('Members only');
  });

  it('counts against the monthly quota', async () => {
    const { fullKey } = await seedKey(OWNER);
    const shortCode = await seedTemplate(OWNER);

    await renderTemplate(shortCode, fullKey);

    const { getApiUsage } = await import('../lib/api-quota');
    expect(await getApiUsage(db, OWNER)).toBe(1);
  });
});
