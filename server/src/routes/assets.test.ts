import { beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { assets } from '@temply/shared/schema';
import { createTestDb, type TestDb } from '../test/helpers';

let db: TestDb;
beforeEach(() => { db = createTestDb(); });

describe('assets table', () => {
  it('exists in the DDL initTables runs', async () => {
    await db.insert(assets).values({
      id: 'a1', user_id: 'u1', imagekit_file_id: 'f1', url: 'https://ik.imagekit.io/t/a.png',
      name: 'a.png', mime: 'image/png', bytes: 10, width: 1, height: 1,
    });
    const [row] = await db.select().from(assets).where(eq(assets.id, 'a1'));
    expect(row.created_at).toBeTruthy();
  });
});
