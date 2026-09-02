import { Elysia, t } from 'elysia';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { assets, mails, templateVersions } from '@temply/shared/schema';
import { PLAN_LIMITS } from '@temply/shared/plans';
import { checkStorageLimit, getPlan, getStorageUsed } from '../lib/billing';
import { json, notFound, paymentRequired, unauthorized } from '../lib/errors';
import { assetFolder, getImageKit } from '../lib/imagekit';
import { authPlugin } from '../plugins/auth';
import { dbPlugin } from '../plugins/db';

export const MAX_ASSET_BYTES = 5 * 1024 * 1024;
/** SVG is excluded on purpose: Gmail and Outlook strip it, so it would never
 *  render in a real email. */
export const ASSET_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/** The ImageKit SDK rejects with the HTTP status tucked under $ResponseMetadata. */
function imagekitStatus(error: unknown): number | null {
  const meta = (error as { $ResponseMetadata?: { statusCode?: number } })?.$ResponseMetadata;
  return typeof meta?.statusCode === 'number' ? meta.statusCode : null;
}

export const assetsRoutes = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .post('/api/v1/assets', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const file = ctx.body.file;
    // Cheapest checks first, so a refused upload never reaches ImageKit.
    if (!ASSET_MIME_TYPES.has(file.type)) {
      return json({ status: 400, message: 'Only JPEG, PNG, GIF and WebP images can be uploaded.', errors: ['unsupported type'] }, 400);
    }
    if (file.size > MAX_ASSET_BYTES) {
      return json({ status: 400, message: 'Images must be under 5 MB.', errors: ['too large'] }, 400);
    }
    const limit = await checkStorageLimit(ctx.db, ctx.userId, file.size);
    if (!limit.allowed) return paymentRequired(limit.message!);

    const ik = getImageKit();
    if (!ik) return json({ status: 503, message: 'Image uploads are not configured', errors: ['IMAGEKIT env missing'] }, 503);

    let uploaded;
    try {
      uploaded = await ik.upload({
        file: Buffer.from(await file.arrayBuffer()),
        fileName: file.name || 'image',
        folder: assetFolder(ctx.userId),
        useUniqueFileName: true,
      });
    } catch {
      return json({ status: 502, message: 'The image host did not accept the upload. Please try again.', errors: ['imagekit upload failed'] }, 502);
    }

    const asset = {
      id: crypto.randomUUID(),
      user_id: ctx.userId,
      imagekit_file_id: uploaded.fileId,
      url: uploaded.url,
      name: uploaded.name,
      mime: file.type,
      bytes: uploaded.size,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
    };
    await ctx.db.insert(assets).values(asset);
    const [row] = await ctx.db.select().from(assets).where(eq(assets.id, asset.id)).limit(1);
    return json({ asset: row });
  }, { body: t.Object({ file: t.File() }) })

  .get('/api/v1/assets', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const list = await ctx.db.select().from(assets).where(eq(assets.user_id, ctx.userId)).orderBy(desc(assets.created_at), desc(sql`rowid`));
    const { plan } = await getPlan(ctx.db, ctx.userId);
    const raw = PLAN_LIMITS[plan].maxStorageBytes;
    return json({
      assets: list,
      usedBytes: await getStorageUsed(ctx.db, ctx.userId),
      limitBytes: Number.isFinite(raw) ? raw : null,
    });
  })

  .get('/api/v1/assets/:id/usage', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [asset] = await ctx.db.select().from(assets)
      .where(and(eq(assets.id, ctx.params.id), eq(assets.user_id, ctx.userId))).limit(1);
    if (!asset) return notFound('Asset not found');
    // A substring match over serialised content is enough: the URL is unique
    // per file and a transform suffix does not change its prefix.
    const needle = `%${asset.url}%`;
    const inContent = ctx.db.select({ id: mails.id, title: mails.title }).from(mails)
      .where(and(eq(mails.user_id, ctx.userId), like(mails.content, needle)));
    const inVersions = ctx.db.select({ id: mails.id, title: mails.title }).from(templateVersions)
      .innerJoin(mails, eq(mails.id, templateVersions.template_id))
      .where(and(eq(templateVersions.user_id, ctx.userId), like(templateVersions.content, needle)));
    const seen = new Map<string, { id: string; title: string }>();
    for (const row of [...(await inContent), ...(await inVersions)]) seen.set(row.id, row);
    return json({ templates: [...seen.values()] });
  })

  .delete('/api/v1/assets/:id', async (ctx) => {
    if (!ctx.userId) return unauthorized();
    const [asset] = await ctx.db.select().from(assets)
      .where(and(eq(assets.id, ctx.params.id), eq(assets.user_id, ctx.userId))).limit(1);
    if (!asset) return notFound('Asset not found');
    const ik = getImageKit();
    if (ik) {
      try {
        await ik.deleteFile(asset.imagekit_file_id);
      } catch (error) {
        // Already gone on their side is the outcome we wanted; anything else
        // keeps the row so the user can retry instead of leaking storage.
        if (imagekitStatus(error) !== 404) {
          return json({ status: 502, message: 'The image host could not delete the file. Please try again.', errors: ['imagekit delete failed'] }, 502);
        }
      }
    }
    await ctx.db.delete(assets).where(and(eq(assets.id, asset.id), eq(assets.user_id, ctx.userId)));
    return json({ status: 'ok' });
  });
