import { beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { brands } from '@temply/shared/schema';
import { createTestApp, createTestDb, del, get, givePlan, post, put, type TestDb } from '../test/helpers';
import { brandsRoutes } from './brands';

let db: TestDb;
let app: any;
const OWNER = 'user_owner';
const OTHER = 'user_other';

beforeEach(() => { db = createTestDb(); app = createTestApp(db, brandsRoutes); });

const make = (userId: string, name = 'Brand') => post(app, '/api/v1/brands', { name, theme: '{"link":{"color":"#000"}}' }, userId);

describe('POST /api/v1/brands', () => {
  it('401 without a user', async () => { expect((await make(null as any)).status).toBe(401); });
  it('creates one for a free user, blocks the second', async () => {
    expect((await make(OWNER)).status).toBe(200);
    expect((await make(OWNER, 'Second')).status).toBe(402);
  });
  it('marks the very first brand as default', async () => {
    const { brand } = await (await make(OWNER)).json();
    expect(brand.is_default).toBe(1);
  });
});

describe('GET /api/v1/brands', () => {
  it('lists only the caller’s brands', async () => {
    await givePlan(db, OWNER, 'pro'); await givePlan(db, OTHER, 'pro');
    await make(OWNER, 'Mine'); await make(OTHER, 'Theirs');
    const { brands: list } = await (await get(app, '/api/v1/brands', OWNER)).json();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Mine');
  });
});

describe('POST /api/v1/brands/:id/default', () => {
  it('moves default to the chosen brand', async () => {
    await givePlan(db, OWNER, 'pro');
    const a = (await (await make(OWNER, 'A')).json()).brand;
    const b = (await (await make(OWNER, 'B')).json()).brand;
    await post(app, `/api/v1/brands/${b.id}/default`, {}, OWNER);
    const rows = await db.select().from(brands).where(eq(brands.user_id, OWNER));
    expect(rows.find((r: any) => r.id === b.id)!.is_default).toBe(1);
    expect(rows.find((r: any) => r.id === a.id)!.is_default).toBe(0);
  });
});

describe('PUT /api/v1/brands/:id', () => {
  it('updates the caller’s own brand', async () => {
    const { brand } = await (await make(OWNER)).json();
    const res = await put(app, `/api/v1/brands/${brand.id}`, { name: 'Renamed' }, OWNER);
    expect(res.status).toBe(200);
    const rows = await db.select().from(brands).where(eq(brands.id, brand.id));
    expect(rows[0].name).toBe('Renamed');
  });
  it('404s and does not modify another user’s brand', async () => {
    const { brand } = await (await make(OWNER)).json();
    const res = await put(app, `/api/v1/brands/${brand.id}`, { name: 'Hacked' }, OTHER);
    expect(res.status).toBe(404);
    const rows = await db.select().from(brands).where(eq(brands.id, brand.id));
    expect(rows[0].name).not.toBe('Hacked');
  });
});

describe('DELETE /api/v1/brands/:id', () => {
  it('will not delete another user’s brand', async () => {
    const { brand } = await (await make(OWNER)).json();
    await del(app, `/api/v1/brands/${brand.id}`, OTHER);
    const rows = await db.select().from(brands).where(eq(brands.id, brand.id));
    expect(rows).toHaveLength(1);
  });

  it('promotes the newest remaining brand to default when the default is deleted', async () => {
    await givePlan(db, OWNER, 'pro');
    const a = (await (await make(OWNER, 'A')).json()).brand; // first → default
    const b = (await (await make(OWNER, 'B')).json()).brand;
    expect(a.is_default).toBe(1);
    await del(app, `/api/v1/brands/${a.id}`, OWNER);
    const rows = await db.select().from(brands).where(eq(brands.user_id, OWNER));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(b.id);
    expect(rows[0].is_default).toBe(1);
  });
});
