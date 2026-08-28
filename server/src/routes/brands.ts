import { Elysia, t } from 'elysia';
import { and, desc, eq } from 'drizzle-orm';
import { brands, userPrefs } from '@temply/shared/schema';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { BRAND_PRESETS } from '@temply/shared/brand-presets';
import { checkBrandLimit, getPlan } from '../lib/billing';
import { json, unauthorized, paymentRequired, notFound } from '../lib/errors';
import { authPlugin } from '../plugins/auth';
import { dbPlugin, type Db } from '../plugins/db';

const PRESET_IDS = new Set(BRAND_PRESETS.map((p) => p.id));
const FALLBACK_PRESET_ID = BRAND_PRESETS[0].id;

/** The user's default look: a preset id or a custom brand id, or null. */
async function readDefault(db: Db, userId: string): Promise<string | null> {
  const [row] = await db.select().from(userPrefs).where(eq(userPrefs.user_id, userId)).limit(1);
  return row?.default_brand_id ?? null;
}

async function writeDefault(db: Db, userId: string, id: string | null): Promise<void> {
  await db.insert(userPrefs).values({ user_id: userId, default_brand_id: id })
    .onConflictDoUpdate({ target: userPrefs.user_id, set: { default_brand_id: id } });
}

export const brandsRoutes = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .get('/api/v1/brands', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const list = await ctx.db.select().from(brands).where(eq(brands.user_id, ctx.userId)).orderBy(desc(brands.created_at));
    // The client needs the cap to render the "custom brands used up" banner.
    // null means unlimited (Enterprise). Presets do not count — only these rows.
    const { plan } = await getPlan(ctx.db, ctx.userId);
    const raw = PLAN_LIMITS[plan].maxBrands;
    return json({
      brands: list,
      limit: Number.isFinite(raw) ? raw : null,
      defaultBrandId: await readDefault(ctx.db, ctx.userId),
    });
  })

  .post('/api/v1/brands', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const limit = await checkBrandLimit(ctx.db, ctx.userId);
    if (!limit.allowed) return paymentRequired(limit.message!);
    const { name, theme } = ctx.body;
    const id = crypto.randomUUID();
    // Not auto-defaulted: choosing a default is an explicit, opt-in action.
    await ctx.db.insert(brands).values({ id, user_id: ctx.userId, name, theme, is_default: 0 });
    return json({ brand: { id, name, theme, is_default: 0 } });
  }, { body: t.Object({ name: t.String({ minLength: 1 }), theme: t.String({ minLength: 1 }) }) })

  .put('/api/v1/brands/:id', async (ctx) => {
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

  .delete('/api/v1/brands/:id', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [target] = await ctx.db.select().from(brands)
      .where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId))).limit(1);
    if (!target) return json({ status: 'ok' });
    await ctx.db.delete(brands).where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId)));
    // If we just deleted the default look, hand the default to the next custom
    // brand, falling back to a preset so there is always a sensible default.
    if ((await readDefault(ctx.db, ctx.userId)) === ctx.params.id) {
      const [next] = await ctx.db.select({ id: brands.id }).from(brands)
        .where(eq(brands.user_id, ctx.userId)).orderBy(desc(brands.created_at)).limit(1);
      await writeDefault(ctx.db, ctx.userId, next?.id ?? FALLBACK_PRESET_ID);
    }
    return json({ status: 'ok' });
  })

  .post('/api/v1/brands/:id/default', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    // The default may be a preset (not a row) or one of the caller's own brands.
    let valid = PRESET_IDS.has(ctx.params.id);
    if (!valid) {
      const [owned] = await ctx.db.select({ id: brands.id }).from(brands)
        .where(and(eq(brands.id, ctx.params.id), eq(brands.user_id, ctx.userId))).limit(1);
      valid = !!owned;
    }
    if (!valid) return notFound('Brand not found');
    await writeDefault(ctx.db, ctx.userId, ctx.params.id);
    return json({ status: 'ok' });
  });
