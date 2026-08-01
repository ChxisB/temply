import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '@temply/shared/schema';
import { Elysia } from 'elysia';
import { initTables } from '../plugins/db';

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * An in-memory database using the same DDL the server runs at startup, so the
 * tests drift with `initTables` instead of against it.
 */
export function createTestDb(): TestDb {
  const sqlite = new Database(':memory:');
  sqlite.run('PRAGMA foreign_keys = ON');
  initTables(sqlite);
  return drizzle(sqlite, { schema });
}

/**
 * Wraps a route module with the two things every handler reads off the context:
 * `db` and `userId`. The `x-user-id` header mirrors the trusted-header path of
 * the real auth plugin, so requests without it exercise the signed-out branch.
 */
export function createTestApp(db: TestDb, routes: any) {
  return new Elysia()
    .derive({ as: 'global' }, ({ request }: any) => ({
      db,
      userId: request.headers.get('x-user-id'),
    }))
    .use(routes);
}

export function get(app: any, path: string, userId?: string | null, headers: Record<string, string> = {}) {
  return app.handle(new Request(`http://localhost${path}`, { headers: withUser(headers, userId) }));
}

export function post(app: any, path: string, body: unknown, userId?: string | null, headers: Record<string, string> = {}) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: withUser({ 'Content-Type': 'application/json', ...headers }, userId),
      body: JSON.stringify(body),
    }),
  );
}

export function del(app: any, path: string, userId?: string | null) {
  return app.handle(
    new Request(`http://localhost${path}`, { method: 'DELETE', headers: withUser({}, userId) }),
  );
}

function withUser(headers: Record<string, string>, userId?: string | null): Record<string, string> {
  return userId ? { ...headers, 'x-user-id': userId } : headers;
}

/** Gives `userId` a paid subscription so plan-gated branches can be reached. */
export async function givePlan(db: TestDb, userId: string, plan: 'free' | 'pro' | 'scale', status = 'active') {
  await db.insert(schema.subscriptions).values({
    id: crypto.randomUUID(),
    user_id: userId,
    plan,
    status,
  });
}
