import { Elysia, t } from 'elysia';
import type { JSONContent } from '@tiptap/core';
import { eq, and, desc, sql } from 'drizzle-orm';
import { mails, templateVersions } from '@temply/shared/schema';
import { generateShortCode } from '../lib/codes';
import { checkTemplateLimit, shouldSnapshot } from '../lib/billing';
import { render } from '../render/render';
import { json, unauthorized, notFound, paymentRequired } from '../lib/errors';
import { authPlugin } from '../plugins/auth';
import { dbPlugin } from '../plugins/db';

export const templatesRoutes = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .get('/api/v1/templates', (ctx) => {
    if (!ctx.userId) return unauthorized();
    return ctx.db.select().from(mails).where(eq(mails.user_id, ctx.userId)).orderBy(desc(mails.updated_at)).then((r) => json({ templates: r }));
  })

  .get('/api/v1/templates/:id', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [template] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (!template) return notFound('Template not found');
    return json({ template });
  })

  /**
   * The template rendered as the dashboard thumbnails show it: no payload, so
   * the engine stays in composing mode — variable pills keep their names and
   * every conditional block is visible. Recipient-shaped output belongs to the
   * public render endpoint, not here.
   */
  .get('/api/v1/templates/:id/preview', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [template] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (!template) return notFound('Template not found');

    let content: unknown;
    try {
      content = JSON.parse(template.content);
    } catch {
      return json({ status: 500, message: 'Template content is corrupt', errors: ['Unparseable content'] }, 500);
    }

    // A corrupt theme degrades the thumbnail to the default theme; only the
    // document itself being unreadable is worth failing the card over.
    let theme;
    try {
      theme = template.theme ? JSON.parse(template.theme) : undefined;
    } catch {
      theme = undefined;
    }

    const html = await render(content as JSONContent, {
      theme,
      preview: template.preview_text ?? undefined,
    });

    // Cacheable forever only when the caller keyed the URL to this exact
    // updated_at (?v=…) — an edit changes the key, so stale HTML is never
    // served. An unversioned request has no such guarantee and must not stick.
    const versioned = ctx.query.v !== undefined && ctx.query.v === template.updated_at;
    return new Response(JSON.stringify({ html, updatedAt: template.updated_at }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': versioned ? 'private, max-age=31536000, immutable' : 'no-store',
        // The browser HTTP cache keys by URL alone; this keeps a cached
        // preview from surviving a session change on a shared profile.
        Vary: 'Cookie',
      },
    });
  })

  .post('/api/v1/templates', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const limit = await checkTemplateLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const { title, previewText, content, theme } = ctx.body;
    const id = crypto.randomUUID();
    const shortCode = generateShortCode();
    await ctx.db.insert(mails).values({ id, user_id: ctx.userId, title, preview_text: previewText ?? null, content, theme: theme ?? null, short_code: shortCode });
    const [inserted] = await ctx.db.select().from(mails).where(eq(mails.id, id)).limit(1);
    return json({ template: inserted });
  }, { body: t.Object({ title: t.String({ minLength: 3 }), previewText: t.Optional(t.String()), content: t.String(), theme: t.Optional(t.String()) }) })

  .post('/api/v1/templates/:id', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const { title, previewText, content, theme } = ctx.body;
    const { id } = ctx.params;
    if (await shouldSnapshot(ctx.db, ctx.userId)) {
      const [current] = await ctx.db.select().from(mails).where(and(eq(mails.id, id), eq(mails.user_id, ctx.userId))).limit(1);
      if (current) {
        const [maxVersion] = await ctx.db.select({ max: sql<number>`COALESCE(MAX(${templateVersions.version_number}), 0)` }).from(templateVersions).where(eq(templateVersions.template_id, id));
        const vn = (maxVersion?.max ?? 0) + 1;
        await ctx.db.insert(templateVersions).values({ id: crypto.randomUUID(), template_id: id, user_id: ctx.userId, title: current.title, preview_text: current.preview_text, content: current.content, theme: current.theme, version_number: vn });
        await ctx.db.delete(templateVersions).where(sql`${templateVersions.id} NOT IN (SELECT id FROM (SELECT ${templateVersions.id} FROM ${templateVersions} WHERE ${templateVersions.template_id} = ${id} ORDER BY ${templateVersions.created_at} DESC LIMIT 10)) AND ${templateVersions.template_id} = ${id}`);
      }
    }
    // `theme` is omitted rather than null when the client is not editing it,
    // so an absent field must not wipe a theme the template already has.
    // SQLite has no ON UPDATE — the bump has to be written here.
    const patch: Record<string, unknown> = {
      title,
      preview_text: previewText ?? null,
      content,
      updated_at: new Date().toISOString(),
    };
    if (theme !== undefined) patch.theme = theme;
    await ctx.db.update(mails).set(patch).where(and(eq(mails.id, id), eq(mails.user_id, ctx.userId)));
    return json({ status: 'ok' });
  }, { body: t.Object({ title: t.String({ minLength: 3 }), previewText: t.Optional(t.String()), content: t.String(), theme: t.Optional(t.String()) }) })

  .delete('/api/v1/templates/:id', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    await ctx.db.delete(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId)));
    return json({ status: 'ok' });
  })

  .post('/api/v1/templates/:id/duplicate', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    // Duplicating adds a template, so it must respect the plan cap like create.
    const limit = await checkTemplateLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const [template] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (!template) return notFound('Template not found');
    const newId = crypto.randomUUID();
    const shortCode = generateShortCode();
    await ctx.db.insert(mails).values({ id: newId, user_id: ctx.userId, title: `[DUPLICATE] ${template.title}`, preview_text: template.preview_text, content: template.content, theme: template.theme, short_code: shortCode });
    const [duplicated] = await ctx.db.select().from(mails).where(eq(mails.id, newId)).limit(1);
    return json({ template: duplicated });
  })

  .get('/api/v1/templates/:id/versions', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const versions = await ctx.db.select({ id: templateVersions.id, version_number: templateVersions.version_number, title: templateVersions.title, created_at: templateVersions.created_at }).from(templateVersions).where(eq(templateVersions.template_id, ctx.params.id)).orderBy(desc(templateVersions.created_at));
    return json({ versions });
  })

  .get('/api/v1/templates/:id/versions/:versionId', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [version] = await ctx.db.select().from(templateVersions).where(and(eq(templateVersions.id, ctx.params.versionId), eq(templateVersions.template_id, ctx.params.id), eq(templateVersions.user_id, ctx.userId))).limit(1);
    if (!version) return notFound('Version not found');
    return json({ version });
  })

  .post('/api/v1/templates/:id/versions/:versionId/restore', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [version] = await ctx.db.select().from(templateVersions).where(and(eq(templateVersions.id, ctx.params.versionId), eq(templateVersions.template_id, ctx.params.id), eq(templateVersions.user_id, ctx.userId))).limit(1);
    if (!version) return notFound('Version not found');
    const [current] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (current) {
      const [maxVersion] = await ctx.db.select({ max: sql<number>`COALESCE(MAX(${templateVersions.version_number}), 0)` }).from(templateVersions).where(eq(templateVersions.template_id, ctx.params.id));
      const vn = (maxVersion?.max ?? 0) + 1;
      await ctx.db.insert(templateVersions).values({ id: crypto.randomUUID(), template_id: ctx.params.id, user_id: ctx.userId, title: current.title, preview_text: current.preview_text, content: current.content, theme: current.theme, version_number: vn });
      await ctx.db.delete(templateVersions).where(sql`${templateVersions.id} NOT IN (SELECT id FROM (SELECT ${templateVersions.id} FROM ${templateVersions} WHERE ${templateVersions.template_id} = ${ctx.params.id} ORDER BY ${templateVersions.created_at} DESC LIMIT 10)) AND ${templateVersions.template_id} = ${ctx.params.id}`);
    }
    // A null version theme means "snapshotted before themes were captured" —
    // unknown, not absent — so it must not wipe the template's current theme.
    const restorePatch: Record<string, unknown> = {
      title: version.title,
      preview_text: version.preview_text,
      content: version.content,
      updated_at: new Date().toISOString(),
    };
    if (version.theme !== null) restorePatch.theme = version.theme;
    await ctx.db.update(mails).set(restorePatch).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId)));
    return json({ status: 'ok' });
  });
