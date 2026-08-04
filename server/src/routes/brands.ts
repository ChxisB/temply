import { Elysia, t } from 'elysia';
import { and, desc, eq } from 'drizzle-orm';
import { brands } from '@temply/shared/schema';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { checkBrandLimit, getPlan } from '../lib/billing';
import { json, unauthorized, paymentRequired, notFound } from '../lib/errors';

export const brandsRoutes = new Elysia()
  .get('/api/v1/brands', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const list = await ctx.db.select().from(brands).where(eq(brands.user_id, ctx.userId)).orderBy(desc(brands.created_at));
    // The client needs the cap to render the "custom brands used up" banner.
    // null means unlimited (Enterprise). Presets do not count — only these rows.
    const { plan } = await getPlan(ctx.db, ctx.userId);
    const raw = PLAN_LIMITS[plan].maxBrands;
    return json({ brands: list, limit: Number.isFinite(raw) ? raw : null });
  })

  .post('/api/v1/brands', async (ctx: any) => {
    if (!ctx.userId) return unauthorized();
    const limit = await checkBrandLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const { name, theme } = ctx.body;
    const id = crypto.randomUUID();
    // Not auto-defaulted: the default is an opt-in selection preference, and a
    // brand that is the default cannot be deleted — auto-defaulting the only
    // brand a free user can create would soft-lock them out of deleting it.
    await ctx.db.insert(brands).values({ id, user_id: ctx.userId, name, theme, is_default: 0 });
    return json({ brand: { id, name, theme, is_default: 0 } });
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
    const [target] = await ctx.db.select().from(brands)
      .where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId))).limit(1);
    if (!target) return json({ status: 'ok' });
    // The default brand is protected: set a different brand as default first.
    if (target.is_default) {
      return json({ status: 400, message: 'This is your default brand. Set another brand as default before deleting it.', errors: ['Brand is default'] }, 400);
    }
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
