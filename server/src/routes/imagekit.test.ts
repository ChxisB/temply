import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { TestDb } from '../test/helpers';

process.env.IMAGEKIT_PUBLIC_KEY = 'public_test';
process.env.IMAGEKIT_PRIVATE_KEY = 'private_test';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test';

mock.module('imagekit', () => ({
  default: class {
    getAuthenticationParameters() {
      return { token: 'tok_1', expire: 1234567890, signature: 'sig_1' };
    }
  },
}));

const { imagekitRoutes } = await import('./imagekit');
const { createTestApp, createTestDb, get } = await import('../test/helpers');

let db: TestDb;
let app: any;
const USER = 'user_ik';

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db, imagekitRoutes);
});

describe('GET /api/v1/imagekit-auth', () => {
  it('rejects a request with no user', async () => {
    expect((await get(app, '/api/v1/imagekit-auth')).status).toBe(401);
  });

  it('returns the signed params plus the public config and user id', async () => {
    const res = await get(app, '/api/v1/imagekit-auth', USER);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      token: 'tok_1',
      expire: 1234567890,
      signature: 'sig_1',
      publicKey: 'public_test',
      urlEndpoint: 'https://ik.imagekit.io/test',
      userId: USER,
    });
  });
});
