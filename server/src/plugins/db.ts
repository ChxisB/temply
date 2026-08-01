import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '@temply/shared/schema';
import { Elysia } from 'elysia';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initTables(sqlite: Database) {
  sqlite.run(`CREATE TABLE IF NOT EXISTS mails (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
    preview_text TEXT, content TEXT NOT NULL, short_code TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
    key_prefix TEXT NOT NULL, key_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')), last_used_at TEXT, revoked_at TEXT
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS template_versions (
    id TEXT PRIMARY KEY, template_id TEXT NOT NULL, user_id TEXT NOT NULL,
    title TEXT NOT NULL, preview_text TEXT, content TEXT NOT NULL,
    version_number INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT UNIQUE, stripe_subscription_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free', status TEXT NOT NULL DEFAULT 'active',
    current_period_end TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  )`);
}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function simpleShortCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = 'tpl_';
  for (let i = 0; i < 8; i++) code += BASE62[bytes[i] % 62];
  return code;
}

export function backfillShortCodes(sqlite: Database) {
  const row = sqlite.prepare("SELECT COUNT(*) as count FROM mails WHERE short_code IS NULL").get() as { count: number };
  if (!row?.count) return;
  const rows = sqlite.prepare("SELECT id FROM mails WHERE short_code IS NULL").all() as { id: string }[];
  const update = sqlite.prepare("UPDATE mails SET short_code = ? WHERE id = ?");
  const tx = sqlite.transaction(() => {
    for (const r of rows) {
      let code: string;
      do code = simpleShortCode(); while (sqlite.prepare("SELECT 1 FROM mails WHERE short_code = ?").get(code));
      update.run(code, r.id);
    }
  });
  tx();
}

export const dbPlugin = new Elysia({ name: 'db' })
  .derive({ as: 'global' }, () => {
    if (!db) {
      const dbPath = process.env.SQLITE_DB_PATH || 'maily.db';
      const sqlite = new Database(dbPath);
      sqlite.run('PRAGMA journal_mode = WAL');
      sqlite.run('PRAGMA foreign_keys = ON');
      initTables(sqlite);
      backfillShortCodes(sqlite);
      db = drizzle(sqlite, { schema });
    }
    return { db };
  });
