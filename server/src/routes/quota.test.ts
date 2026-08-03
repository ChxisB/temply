import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestApp, createTestDb, get, givePlan, type TestDb } from '../test/helpers';
import { recordEmailSend } from '../lib/quota';
import { quotaRoutes } from './quota';

let db: TestDb;
let app: any;
const USER = 'user_q';

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db, quotaRoutes);
});

describe('GET /api/v1/quota', () => {
  it('rejects a request with no user', async () => {
    expect((await get(app, '/api/v1/quota')).status).toBe(401);
  });

  it('reports a free user at 30/day with usage and reset hours', async () => {
    await recordEmailSend(db, USER, 4);
    const res = await get(app, '/api/v1/quota', USER);
    const bodyJson = await res.json();
    expect(bodyJson.plan).toBe('free');
    expect(bodyJson.email).toEqual({ used: 4, limit: 30, remaining: 26 });
    expect(bodyJson.resetInHours).toBeGreaterThan(0);
    expect(bodyJson.resetInHours).toBeLessThanOrEqual(24);
  });

  it('reflects the paid limit', async () => {
    await givePlan(db, USER, 'scale');
    const bodyJson = await (await get(app, '/api/v1/quota', USER)).json();
    expect(bodyJson.email.limit).toBe(2000);
  });
});
