import { Elysia } from 'elysia';
import { eq, and, isNull } from 'drizzle-orm';
import { mails, apiKeysTable } from '@temply/shared/schema';
import { hashApiKey } from '../lib/codes';
import { checkApiCallLimit } from '../lib/billing';
import { json, notFound, unauthorized, paymentRequired } from '../lib/errors';

export const publicRoutes = new Elysia()
  .get('/api/public/v1/templates/:shortCode', async (ctx: any) => {
    const authHeader = ctx.request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return unauthorized('Missing or invalid Authorization header');
    const apiKey = authHeader.slice(7);
    const keyHash = hashApiKey(apiKey);
    const [key] = await ctx.db.select().from(apiKeysTable).where(and(eq(apiKeysTable.key_hash, keyHash), isNull(apiKeysTable.revoked_at))).limit(1);
    if (!key) return unauthorized('Invalid or revoked API key');
    const limitCheck = await checkApiCallLimit(ctx.db, key.user_id);
    if (!limitCheck.allowed) return paymentRequired(limitCheck.message!);
    await ctx.db.update(apiKeysTable).set({ last_used_at: new Date().toISOString() }).where(eq(apiKeysTable.id, key.id));
    const [template] = await ctx.db.select().from(mails).where(eq(mails.short_code, ctx.params.shortCode)).limit(1);
    if (!template) return notFound('Template not found');
    return json({ id: template.id, shortCode: template.short_code, title: template.title, previewText: template.preview_text, updatedAt: template.updated_at });
  });
