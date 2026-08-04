import { Elysia, t } from 'elysia';
import { and, desc, eq } from 'drizzle-orm';
import { brands } from '@temply/shared/schema';
import { checkBrandLimit } from '../lib/billing';
import { json, unauthorized, paymentRequired, notFound } from '../lib/errors';

export const brandsRoutes = new Elysia()
  .get('/api/v1/brands', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const list = await ctx.db.select().from(brands).where(eq(brands.user_id, ctx.userId)).orderBy(desc(brands.created_at));
    return json({ brands: list });
  })

  .post('/api/v1/brands', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const limit = await checkBrandLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const { name, theme } = ctx.body;
    const [existing] = await ctx.db.select({ id: brands.id }).from(brands).where(eq(brands.user_id, ctx.userId)).limit(1);
    const isDefault = existing ? 0 : 1; // first brand becomes the default
    const id = crypto.randomUUID();
    await ctx.db.insert(brands).values({ id, user_id: ctx.userId, name, theme, is_default: isDefault });
    return json({ brand: { id, name, theme, is_default: isDefault } });
  }, { body: t.Object({ name: t.String({ minLength: 1 }), theme: t.String({ minLength: 1 }) }) })

  .put('/api/v1/brands/:id', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [owned] = await ctx.db.select({ id: brands.id }).from(brands)
      .where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId))).limit(1);
    if (!owned) return notFound('Brand not found');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof ctx.body.name === 'string') patch.name = ctx.body.name;
    if (typeof ctx.body.theme === 'string') patch.theme = ctx.body.theme;
    await ctx.db.update(brands).set(patch).where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId)));
    return json({ status: 'ok' });
  }, { body: t.Object({ name: t.Optional(t.String({ minLength: 1 })), theme: t.Optional(t.String({ minLength: 1 })) }) })

  .delete('/api/v1/brands/:id', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    await ctx.db.delete(brands).where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId)));
    return json({ status: 'ok' });
  })

  .post('/api/v1/brands/:id/default', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const [owned] = await ctx.db.select({ id: brands.id }).from(brands).where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId))).limit(1);
    if (!owned) return notFound('Brand not found');
    await ctx.db.update(brands).set({ is_default: 0 }).where(eq(brands.user_id, ctx.userId));
    await ctx.db.update(brands).set({ is_default: 1 }).where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId)));
    return json({ status: 'ok' });
  });
