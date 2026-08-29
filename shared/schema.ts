import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

/** Drizzle sends an explicit NULL for omitted columns, so a default declared
 *  only in the DDL never fires — it has to live here to reach any insert. */
const now = sql`(datetime('now'))`;

export const mails = sqliteTable('mails', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  title: text('title').notNull(),
  preview_text: text('preview_text'),
  content: text('content').notNull(),
  /** Serialised RendererThemeOptions. Null means the shipped defaults. */
  theme: text('theme'),
  short_code: text('short_code').unique(),
  created_at: text('created_at').default(now),
  updated_at: text('updated_at').default(now),
});

export const apiKeysTable = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  key_prefix: text('key_prefix').notNull(),
  key_hash: text('key_hash').notNull(),
  created_at: text('created_at').default(now),
  last_used_at: text('last_used_at'),
  revoked_at: text('revoked_at'),
});

export const templateVersions = sqliteTable('template_versions', {
  id: text('id').primaryKey(),
  template_id: text('template_id').notNull(),
  user_id: text('user_id').notNull(),
  title: text('title').notNull(),
  preview_text: text('preview_text'),
  content: text('content').notNull(),
  version_number: integer('version_number').notNull(),
  created_at: text('created_at').default(now),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().unique(),
  stripe_customer_id: text('stripe_customer_id').unique(),
  stripe_subscription_id: text('stripe_subscription_id'),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  current_period_end: text('current_period_end'),
  created_at: text('created_at').default(now),
  updated_at: text('updated_at').default(now),
});

export type Mail = typeof mails.$inferSelect;
export type NewMail = typeof mails.$inferInsert;

export type ApiKey = typeof apiKeysTable.$inferSelect;
export type NewApiKey = typeof apiKeysTable.$inferInsert;

export type TemplateVersion = typeof templateVersions.$inferSelect;
export type NewTemplateVersion = typeof templateVersions.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

/** One row per user per UK calendar month. Counts successful public API
 *  template fetches. */
export const apiUsage = sqliteTable(
  'api_usage',
  {
    user_id: text('user_id').notNull(),
    period: text('period').notNull(), // "YYYY-MM" in Europe/London
    count: integer('count').notNull().default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.user_id, t.period] }) }),
);

export type ApiUsage = typeof apiUsage.$inferSelect;

export const brands = sqliteTable('brands', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  /** Serialised RendererThemeOptions. */
  theme: text('theme').notNull(),
  is_default: integer('is_default').notNull().default(0),
  created_at: text('created_at').default(now),
  updated_at: text('updated_at').default(now),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

/** One row per user. `default_brand_id` points at the user's default look — a
 *  preset id (e.g. 'classic') or a custom brand id. Presets are not rows, so
 *  the default cannot live on the brands table. */
export const userPrefs = sqliteTable('user_prefs', {
  user_id: text('user_id').primaryKey(),
  default_brand_id: text('default_brand_id'),
});

export type UserPrefs = typeof userPrefs.$inferSelect;

/** Landing-page contact submissions. Stored before any delivery attempt, so a
 *  mail outage never loses a message. */
export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  created_at: text('created_at').default(now),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
