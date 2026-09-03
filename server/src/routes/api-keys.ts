import { Elysia, t } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { apiKeysTable } from '@temply/shared/schema';
import { generateApiKey } from '../lib/codes';
import { checkApiKeyLimit } from '../lib/billing';
import { json, unauthorized, paymentRequired } from '../lib/errors';
import { authPlugin } from '../plugins/auth';
import { dbPlugin } from '../plugins/db';

export const apiKeysRoutes = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .get('/api/v1/api-keys', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const keys = await ctx.db.select({ id: apiKeysTable.id, name: apiKeysTable.name, key_prefix: apiKeysTable.key_prefix, mode: apiKeysTable.mode, created_at: apiKeysTable.created_at, last_used_at: apiKeysTable.last_used_at, revoked_at: apiKeysTable.revoked_at }).from(apiKeysTable).where(eq(apiKeysTable.user_id, ctx.userId)).orderBy(desc(apiKeysTable.created_at));
    return json({ keys });
  })

  // A test key is outside the plan — any account can hold one, and it never
  // counts toward the live-key cap — so only a live key asks billing.
  .post('/api/v1/api-keys', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const { name, mode = 'live' } = ctx.body;
    if (mode === 'live') {
      const limit = await checkApiKeyLimit(ctx.db, ctx.userId);
      if (!limit.allowed) return paymentRequired(limit.message!);
    }
    const id = crypto.randomUUID();
    const { fullKey, prefix, hash } = generateApiKey(mode);
    await ctx.db.insert(apiKeysTable).values({ id, user_id: ctx.userId, name, key_prefix: prefix, key_hash: hash, mode });
    return json({ key: { id, name, key_prefix: prefix, mode, full_key: fullKey } });
  }, { body: t.Object({ name: t.String({ minLength: 1 }), mode: t.Optional(t.Union([t.Literal('live'), t.Literal('test')])) }) })

  .delete('/api/v1/api-keys/:id', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    await ctx.db.update(apiKeysTable).set({ revoked_at: new Date().toISOString() }).where(and(eq(apiKeysTable.id, ctx.params.id), eq(apiKeysTable.user_id, ctx.userId)));
    return json({ status: 'ok' });
  });
