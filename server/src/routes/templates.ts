import { Elysia, t } from 'elysia';
import { eq, and, desc, sql } from 'drizzle-orm';
import { mails, templateVersions } from '@temply/shared/schema';
import { generateShortCode } from '../lib/codes';
import { checkTemplateLimit, shouldSnapshot } from '../lib/billing';
import { json, unauthorized, notFound, paymentRequired } from '../lib/errors';

export const templatesRoutes = new Elysia()
  .get('/api/v1/templates', (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    return ctx.db.select().from(mails).where(eq(mails.user_id, ctx.userId)).orderBy(desc(mails.updated_at)).then((r: any) => json({ templates: r }));
  })

  .get('/api/v1/templates/:id', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [template] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (!template) return notFound('Template not found');
    return json({ template });
  })

  .post('/api/v1/templates', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const limit = await checkTemplateLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const { title, previewText, content } = ctx.body;
    const id = crypto.randomUUID();
    const shortCode = generateShortCode();
    await ctx.db.insert(mails).values({ id, user_id: ctx.userId, title, preview_text: previewText ?? null, content, short_code: shortCode });
    const [inserted] = await ctx.db.select().from(mails).where(eq(mails.id, id)).limit(1);
    return json({ template: inserted });
  }, { body: t.Object({ title: t.String({ minLength: 3 }), previewText: t.Optional(t.String()), content: t.String() }) })

  .post('/api/v1/templates/:id', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const { title, previewText, content } = ctx.body;
    const { id } = ctx.params;
    if (await shouldSnapshot(ctx.db, ctx.userId)) {
      const [current] = await ctx.db.select().from(mails).where(and(eq(mails.id, id), eq(mails.user_id, ctx.userId))).limit(1);
      if (current) {
        const [maxVersion] = await ctx.db.select({ max: sql<number>`COALESCE(MAX(${templateVersions.version_number}), 0)` }).from(templateVersions).where(eq(templateVersions.template_id, id));
        const vn = (maxVersion?.max ?? 0) + 1;
        await ctx.db.insert(templateVersions).values({ id: crypto.randomUUID(), template_id: id, user_id: ctx.userId, title: current.title, preview_text: current.preview_text, content: current.content, version_number: vn });
        await ctx.db.delete(templateVersions).where(sql`${templateVersions.id} NOT IN (SELECT id FROM (SELECT ${templateVersions.id} FROM ${templateVersions} WHERE ${templateVersions.template_id} = ${id} ORDER BY ${templateVersions.created_at} DESC LIMIT 10)) AND ${templateVersions.template_id} = ${id}`);
      }
    }
    await ctx.db.update(mails).set({ title, preview_text: previewText ?? null, content }).where(and(eq(mails.id, id), eq(mails.user_id, ctx.userId)));
    return json({ status: 'ok' });
  }, { body: t.Object({ title: t.String({ minLength: 3 }), previewText: t.Optional(t.String()), content: t.String() }) })

  .delete('/api/v1/templates/:id', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    await ctx.db.delete(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId)));
    return json({ status: 'ok' });
  })

  .post('/api/v1/templates/:id/duplicate', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [template] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (!template) return notFound('Template not found');
    const newId = crypto.randomUUID();
    const shortCode = generateShortCode();
    await ctx.db.insert(mails).values({ id: newId, user_id: ctx.userId, title: `[DUPLICATE] ${template.title}`, preview_text: template.preview_text, content: template.content, short_code: shortCode });
    const [duplicated] = await ctx.db.select().from(mails).where(eq(mails.id, newId)).limit(1);
    return json({ template: duplicated });
  })

  .get('/api/v1/templates/:id/versions', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const versions = await ctx.db.select({ id: templateVersions.id, version_number: templateVersions.version_number, title: templateVersions.title, created_at: templateVersions.created_at }).from(templateVersions).where(eq(templateVersions.template_id, ctx.params.id)).orderBy(desc(templateVersions.created_at));
    return json({ versions });
  })

  .get('/api/v1/templates/:id/versions/:versionId', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [version] = await ctx.db.select().from(templateVersions).where(and(eq(templateVersions.id, ctx.params.versionId), eq(templateVersions.template_id, ctx.params.id), eq(templateVersions.user_id, ctx.userId))).limit(1);
    if (!version) return notFound('Version not found');
    return json({ version });
  })

  .post('/api/v1/templates/:id/versions/:versionId/restore', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [version] = await ctx.db.select().from(templateVersions).where(and(eq(templateVersions.id, ctx.params.versionId), eq(templateVersions.template_id, ctx.params.id), eq(templateVersions.user_id, ctx.userId))).limit(1);
    if (!version) return notFound('Version not found');
    const [current] = await ctx.db.select().from(mails).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId))).limit(1);
    if (current) {
      const [maxVersion] = await ctx.db.select({ max: sql<number>`COALESCE(MAX(${templateVersions.version_number}), 0)` }).from(templateVersions).where(eq(templateVersions.template_id, ctx.params.id));
      const vn = (maxVersion?.max ?? 0) + 1;
      await ctx.db.insert(templateVersions).values({ id: crypto.randomUUID(), template_id: ctx.params.id, user_id: ctx.userId, title: current.title, preview_text: current.preview_text, content: current.content, version_number: vn });
      await ctx.db.delete(templateVersions).where(sql`${templateVersions.id} NOT IN (SELECT id FROM (SELECT ${templateVersions.id} FROM ${templateVersions} WHERE ${templateVersions.template_id} = ${ctx.params.id} ORDER BY ${templateVersions.created_at} DESC LIMIT 10)) AND ${templateVersions.template_id} = ${ctx.params.id}`);
    }
    await ctx.db.update(mails).set({ title: version.title, preview_text: version.preview_text, content: version.content }).where(and(eq(mails.id, ctx.params.id), eq(mails.user_id, ctx.userId)));
    return json({ status: 'ok' });
  });
