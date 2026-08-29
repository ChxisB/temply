import { Elysia, t } from 'elysia';
import type { JSONContent } from '@tiptap/core';
import { eq, and, isNull } from 'drizzle-orm';
import { mails, apiKeysTable } from '@temply/shared/schema';
import { hashApiKey } from '../lib/codes';
import { checkApiQuota, recordApiCall } from '../lib/api-quota';
import { render } from '../render/render';
import { json, notFound, unauthorized } from '../lib/errors';
import { authPlugin } from '../plugins/auth';
import { dbPlugin, type Db } from '../plugins/db';

type Resolved =
  | { error: Response }
  | { key: { id: string; user_id: string }; template: typeof mails.$inferSelect };

/**
 * Everything both endpoints need before they can answer: a live key, quota
 * headroom, and a template **belonging to that key's owner**. The lookup used
 * to match on the short code alone, so any valid key could read any account's
 * template by guessing one.
 */
async function resolve(ctx: { request: Request; params: { shortCode: string }; db: Db }): Promise<Resolved> {
  const authHeader = ctx.request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: unauthorized('Missing or invalid Authorization header') };
  }

  const keyHash = hashApiKey(authHeader.slice(7));
  const [key] = await ctx.db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.key_hash, keyHash), isNull(apiKeysTable.revoked_at)))
    .limit(1);
  if (!key) return { error: unauthorized('Invalid or revoked API key') };

  const quota = await checkApiQuota(ctx.db, key.user_id);
  if (!quota.allowed) {
    return {
      error: json({ status: 429, message: quota.message!, errors: [quota.message!] }, 429),
    };
  }

  const [template] = await ctx.db
    .select()
    .from(mails)
    .where(and(eq(mails.short_code, ctx.params.shortCode), eq(mails.user_id, key.user_id)))
    .limit(1);
  if (!template) return { error: notFound('Template not found') };

  await ctx.db
    .update(apiKeysTable)
    .set({ last_used_at: new Date().toISOString() })
    .where(eq(apiKeysTable.id, key.id));
  await recordApiCall(ctx.db, key.user_id);

  return { key, template };
}

export const publicRoutes = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .get('/api/public/v1/templates/:shortCode', async (ctx) => {
    const resolved = await resolve(ctx);
    if ('error' in resolved) return resolved.error;
    const { template } = resolved;

    return json({
      id: template.id,
      shortCode: template.short_code,
      title: template.title,
      previewText: template.preview_text,
      updatedAt: template.updated_at,
    });
  })

  /**
   * The endpoint that makes a stored template worth storing: the caller's own
   * data in, the finished email out. Without it the API could only report that
   * a template exists, which is not enough to send anything — and "Show if"
   * conditions had nowhere to be evaluated outside the editor's preview.
   */
  .post(
    '/api/public/v1/templates/:shortCode/render',
    async (ctx) => {
      const resolved = await resolve(ctx);
      if ('error' in resolved) return resolved.error;
      const { template } = resolved;

      let content: unknown;
      try {
        content = JSON.parse(template.content);
      } catch {
        return json(
          { status: 500, message: 'Template content is corrupt', errors: ['Unparseable content'] },
          500,
        );
      }

      const renderOptions = {
        theme: template.theme ? JSON.parse(template.theme) : undefined,
        preview: template.preview_text ?? undefined,
        // Omitted entirely when the caller sends none, which keeps variables as
        // `{{placeholders}}` and every conditional block visible.
        payload: ctx.body?.data,
      };

      // The parse above only proves it is JSON; the editor wrote it, so the
      // document shape is a cast, not a check — same trust as before.
      const html = await render(content as JSONContent, renderOptions);
      // The same email with the markup stripped. A caller building a multipart
      // message needs it, and generating it here keeps the two in step —
      // writing the text version by hand is how they drift.
      const text = await render(content as JSONContent, { ...renderOptions, plainText: true });

      return json({ html, text, shortCode: template.short_code, updatedAt: template.updated_at });
    },
    { body: t.Optional(t.Object({ data: t.Optional(t.Any()) })) },
  );
