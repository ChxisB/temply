import { Elysia, t } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { apiKeysTable } from '@temply/shared/schema';
import { generateApiKey } from '../lib/codes';
import { checkApiKeyLimit } from '../lib/billing';
import { json, unauthorized, paymentRequired } from '../lib/errors';

export const apiKeysRoutes = new Elysia()
  .get('/api/v1/api-keys', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const keys = await ctx.db.select({ id: apiKeysTable.id, name: apiKeysTable.name, key_prefix: apiKeysTable.key_prefix, created_at: apiKeysTable.created_at, last_used_at: apiKeysTable.last_used_at, revoked_at: apiKeysTable.revoked_at }).from(apiKeysTable).where(eq(apiKeysTable.user_id, ctx.userId)).orderBy(desc(apiKeysTable.created_at));
    return json({ keys });
  })

  .post('/api/v1/api-keys', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const limit = await checkApiKeyLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const { name } = ctx.body;
    const id = crypto.randomUUID();
    const { fullKey, prefix, hash } = generateApiKey();
    await ctx.db.insert(apiKeysTable).values({ id, user_id: ctx.userId, name, key_prefix: prefix, key_hash: hash });
    return json({ key: { id, name, key_prefix: prefix, full_key: fullKey } });
  }, { body: t.Object({ name: t.String({ minLength: 1 }) }) })

  .delete('/api/v1/api-keys/:id', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    await ctx.db.update(apiKeysTable).set({ revoked_at: new Date().toISOString() }).where(and(eq(apiKeysTable.id, ctx.params.id), eq(apiKeysTable.user_id, ctx.userId)));
    return json({ status: 'ok' });
  });
