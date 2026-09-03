import { beforeEach, describe, expect, it } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import { mails, templateVersions } from '@temply/shared/schema';
import { createTestApp, createTestDb, del, get, givePlan, post, type TestDb } from '../test/helpers';
import { templatesRoutes } from './templates';

let db: TestDb;
let app: any;

const OWNER = 'user_owner';
const OTHER = 'user_other';

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db, templatesRoutes);
});

async function createTemplate(userId: string, title = 'My template') {
  const res = await post(app, '/api/v1/templates', { title, content: '{"type":"doc"}' }, userId);
  const body = await res.json();
  return body.template;
}

describe('authentication', () => {
  it('rejects every template route when the request has no user', async () => {
    const responses = await Promise.all([
      get(app, '/api/v1/templates'),
      get(app, '/api/v1/templates/some-id'),
      post(app, '/api/v1/templates', { title: 'Hello', content: '{}' }),
      del(app, '/api/v1/templates/some-id'),
    ]);

    for (const res of responses) expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/templates', () => {
  it('stores the template and returns it with a generated short code', async () => {
    const template = await createTemplate(OWNER, 'Welcome email');

    expect(template.title).toBe('Welcome email');
    expect(template.user_id).toBe(OWNER);
    expect(template.short_code).toMatch(/^tpl_[0-9A-Za-z]{8}$/);
  });

  it('stamps created_at and updated_at on insert', async () => {
    // Guards the schema-level defaults: Drizzle sends explicit NULLs for
    // omitted columns, so the DDL defaults alone never fire.
    const template = await createTemplate(OWNER, 'Dated template');
    expect(template.created_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(template.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('rejects a title shorter than 3 characters', async () => {
    const res = await post(app, '/api/v1/templates', { title: 'ab', content: '{}' }, OWNER);
    expect(res.status).toBe(400);
  });

  it('returns 402 once a free user hits the template cap', async () => {
    for (let i = 0; i < 3; i++) await createTemplate(OWNER, `Template ${i}`);

    const res = await post(app, '/api/v1/templates', { title: 'One too many', content: '{}' }, OWNER);
    expect(res.status).toBe(402);
    expect((await res.json()).message).toContain('Upgrade');
  });
});

describe('GET /api/v1/templates', () => {
  it('lists only the requesting user’s templates', async () => {
    await createTemplate(OWNER, 'Mine');
    await createTemplate(OTHER, 'Theirs');

    const { templates } = await (await get(app, '/api/v1/templates', OWNER)).json();
    expect(templates).toHaveLength(1);
    expect(templates[0].title).toBe('Mine');
  });

  it('hides another user’s template behind a 404', async () => {
    const template = await createTemplate(OWNER);
    const res = await get(app, `/api/v1/templates/${template.id}`, OTHER);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/templates/:id/preview', () => {
  const doc = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello thumbnail' }] }],
  });

  async function createPreviewTemplate(extra: Record<string, string> = {}) {
    const res = await post(app, '/api/v1/templates', { title: 'Thumbnail source', content: doc, ...extra }, OWNER);
    return (await res.json()).template;
  }

  it('rejects a request with no user', async () => {
    const res = await get(app, '/api/v1/templates/some-id/preview');
    expect(res.status).toBe(401);
  });

  it('hides another user’s template behind a 404', async () => {
    const template = await createPreviewTemplate();
    const res = await get(app, `/api/v1/templates/${template.id}/preview`, OTHER);
    expect(res.status).toBe(404);
  });

  it('renders the owner’s template as a full HTML document', async () => {
    const template = await createPreviewTemplate();
    const res = await get(app, `/api/v1/templates/${template.id}/preview`, OWNER);

    expect(res.status).toBe(200);
    const { html } = await res.json();
    expect(html).toContain('Hello thumbnail');
    expect(html).toContain('<html');
  });

  it('500s when the stored content is corrupt', async () => {
    const template = await createPreviewTemplate();
    await db.update(mails).set({ content: 'not json' }).where(eq(mails.id, template.id));

    const res = await get(app, `/api/v1/templates/${template.id}/preview`, OWNER);
    expect(res.status).toBe(500);
    expect((await res.json()).message).toBe('Template content is corrupt');
  });

  it('still renders when only the theme is corrupt', async () => {
    const template = await createPreviewTemplate({ theme: '{nope' });
    const res = await get(app, `/api/v1/templates/${template.id}/preview`, OWNER);

    expect(res.status).toBe(200);
    expect((await res.json()).html).toContain('Hello thumbnail');
  });

  it('is immutable-cacheable only when ?v matches the current updated_at', async () => {
    const template = await createPreviewTemplate();
    // Drizzle writes NULL for omitted columns, so a fresh insert has no
    // updated_at; give it one so there is a version for ?v to match.
    const updatedAt = '2026-08-29 10:00:00';
    await db.update(mails).set({ updated_at: updatedAt }).where(eq(mails.id, template.id));

    const versioned = await get(
      app,
      `/api/v1/templates/${template.id}/preview?v=${encodeURIComponent(updatedAt)}`,
      OWNER,
    );
    expect(versioned.headers.get('cache-control')).toContain('immutable');

    const unversioned = await get(app, `/api/v1/templates/${template.id}/preview`, OWNER);
    expect(unversioned.headers.get('cache-control')).toBe('no-store');

    // A stale ?v must NOT pin a year of cache — only an exact match may.
    const mismatched = await get(
      app,
      `/api/v1/templates/${template.id}/preview?v=${encodeURIComponent('2020-01-01 00:00:00')}`,
      OWNER,
    );
    expect(mismatched.headers.get('cache-control')).toBe('no-store');
  });
});

describe('POST /api/v1/templates/:id', () => {
  it('updates the template in place', async () => {
    const template = await createTemplate(OWNER, 'Before');

    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{"v":2}' }, OWNER);

    const { template: updated } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(updated.title).toBe('After');
    expect(updated.content).toBe('{"v":2}');
  });

  it('bumps updated_at on save', async () => {
    const template = await createTemplate(OWNER, 'Before');
    // Pin a past value so the bump is observable regardless of clock granularity.
    await db.update(mails).set({ updated_at: '2020-01-01 00:00:00' }).where(eq(mails.id, template.id));

    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{}' }, OWNER);

    const [row] = await db.select().from(mails).where(eq(mails.id, template.id));
    expect(row.updated_at! > '2020-01-01 00:00:00').toBe(true);
  });

  it('never snapshots a version — saving is the draft, history is what was published', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Before');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{"v":2}' }, OWNER);

    const versions = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(versions).toHaveLength(0);
  });

  it('leaves the published copy alone and flags unpublished changes', async () => {
    const template = await createTemplate(OWNER, 'Before');
    expect(template.has_unpublished_changes).toBe(false);

    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{"v":2}' }, OWNER);

    const { template: row } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(row.content).toBe('{"v":2}');
    expect(row.published_content).toBe('{"type":"doc"}');
    expect(row.has_unpublished_changes).toBe(true);
  });

  it('will not let one user overwrite another user’s template', async () => {
    const template = await createTemplate(OWNER, 'Mine');

    await post(app, `/api/v1/templates/${template.id}`, { title: 'Hijacked', content: '{}' }, OTHER);

    const [row] = await db.select().from(mails).where(eq(mails.id, template.id));
    expect(row.title).toBe('Mine');
  });
});

describe('DELETE /api/v1/templates/:id', () => {
  it('deletes the caller’s own template', async () => {
    const template = await createTemplate(OWNER);
    await del(app, `/api/v1/templates/${template.id}`, OWNER);

    const rows = await db.select().from(mails).where(eq(mails.id, template.id));
    expect(rows).toHaveLength(0);
  });

  it('leaves another user’s template alone', async () => {
    const template = await createTemplate(OWNER);
    await del(app, `/api/v1/templates/${template.id}`, OTHER);

    const rows = await db.select().from(mails).where(eq(mails.id, template.id));
    expect(rows).toHaveLength(1);
  });
});

describe('POST /api/v1/templates/:id/duplicate', () => {
  it('copies the content under a new id and short code', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Original');

    const res = await post(app, `/api/v1/templates/${template.id}/duplicate`, {}, OWNER);
    const { template: copy } = await res.json();

    expect(copy.title).toBe('[DUPLICATE] Original');
    expect(copy.content).toBe(template.content);
    expect(copy.id).not.toBe(template.id);
    expect(copy.short_code).not.toBe(template.short_code);
  });

  it('copies the theme along with the content', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Branded');
    const theme = '{"container":{"backgroundColor":"#123456"}}';
    await db.update(mails).set({ theme }).where(eq(mails.id, template.id));

    const res = await post(app, `/api/v1/templates/${template.id}/duplicate`, {}, OWNER);
    const { template: copy } = await res.json();

    expect(copy.theme).toBe(theme);
  });

  it('404s when the template belongs to someone else', async () => {
    const template = await createTemplate(OWNER);
    const res = await post(app, `/api/v1/templates/${template.id}/duplicate`, {}, OTHER);
    expect(res.status).toBe(404);
  });

  it('returns 402 when a free user is already at the template cap', async () => {
    const first = await createTemplate(OWNER, 'Template 0');
    for (let i = 1; i < 3; i++) await createTemplate(OWNER, `Template ${i}`);

    const res = await post(app, `/api/v1/templates/${first.id}/duplicate`, {}, OWNER);
    expect(res.status).toBe(402);
  });
});

describe('POST /api/v1/templates/:id/publish', () => {
  it('copies the draft over the published copy and clears the flag', async () => {
    const template = await createTemplate(OWNER, 'Welcome');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Welcome', previewText: 'Hi', content: '{"v":2}', theme: '{"x":1}' }, OWNER);

    const res = await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);
    expect(res.status).toBe(200);
    const { template: published } = await res.json();
    expect(published.published_content).toBe('{"v":2}');
    expect(published.published_theme).toBe('{"x":1}');
    expect(published.published_preview_text).toBe('Hi');
    expect(published.published_at).toBe(published.updated_at);
    expect(published.has_unpublished_changes).toBe(false);
  });

  it('does not snapshot a version for a free user', async () => {
    const template = await createTemplate(OWNER, 'Welcome');
    await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);

    const versions = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(versions).toHaveLength(0);
  });

  it('snapshots the published copy for a paid user', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Welcome');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Welcome v2', content: '{"v":2}' }, OWNER);

    await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);

    const versions = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(versions).toHaveLength(1);
    expect(versions[0].title).toBe('Welcome v2');
    expect(versions[0].content).toBe('{"v":2}');
    expect(versions[0].version_number).toBe(1);
  });

  it('404s for another user’s template', async () => {
    const template = await createTemplate(OWNER, 'Mine');
    const res = await post(app, `/api/v1/templates/${template.id}/publish`, {}, OTHER);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/templates/:id/discard', () => {
  it('puts the published copy back into the draft and clears the flag', async () => {
    const template = await createTemplate(OWNER, 'Welcome');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Welcome', content: '{"v":2}' }, OWNER);

    const res = await post(app, `/api/v1/templates/${template.id}/discard`, {}, OWNER);
    expect(res.status).toBe(200);
    const { template: row } = await res.json();
    expect(row.content).toBe('{"type":"doc"}');
    expect(row.has_unpublished_changes).toBe(false);
  });

  it('400s when the template was never published', async () => {
    const template = await createTemplate(OWNER, 'Welcome');
    await db.update(mails).set({ published_at: null, published_content: null }).where(eq(mails.id, template.id));

    const res = await post(app, `/api/v1/templates/${template.id}/discard`, {}, OWNER);
    expect(res.status).toBe(400);
  });
});

describe('a legacy row from before publishing existed', () => {
  it('is published as it stood, so the API keeps serving it', async () => {
    // A row the way the old code wrote it: a single copy, nothing published.
    const id = crypto.randomUUID();
    await db.insert(mails).values({ id, user_id: OWNER, title: 'Old', content: '{"old":true}', short_code: 'tpl_legacy00', updated_at: '2024-01-01 00:00:00' });

    // The same statement initTables runs at startup.
    await db.run(sql`UPDATE mails SET published_content = content, published_theme = theme, published_preview_text = preview_text, published_at = updated_at WHERE published_at IS NULL`);

    const [row] = await db.select().from(mails).where(eq(mails.id, id));
    expect(row.published_content).toBe('{"old":true}');
    expect(row.published_at).toBe('2024-01-01 00:00:00');
    const { template } = await (await get(app, `/api/v1/templates/${id}`, OWNER)).json();
    expect(template.has_unpublished_changes).toBe(false);
  });
});

describe('version history', () => {
  /** Publish twice so there is a version to go back to. */
  async function publishedTwice(first: string, second: string, theme?: string) {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, first);
    await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);
    await post(app, `/api/v1/templates/${template.id}`, { title: second, content: '{"v":2}', theme }, OWNER);
    await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);
    const { versions } = await (await get(app, `/api/v1/templates/${template.id}/versions`, OWNER)).json();
    return { template, versions };
  }

  it('restores an earlier version into the draft without snapshotting or publishing', async () => {
    const { template, versions } = await publishedTwice('Version one', 'Version two');
    expect(versions).toHaveLength(2);
    const older = versions.find((v: { title: string }) => v.title === 'Version one');

    await post(app, `/api/v1/templates/${template.id}/versions/${older.id}/restore`, {}, OWNER);

    const { template: restored } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(restored.title).toBe('Version one');
    expect(restored.published_content).toBe('{"v":2}');
    expect(restored.has_unpublished_changes).toBe(true);

    const all = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(all).toHaveLength(2);
  });

  it('snapshots the theme and restores it with the content', async () => {
    const blue = '{"container":{"backgroundColor":"#0000ff"}}';
    const red = '{"container":{"backgroundColor":"#ff0000"}}';
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Branded v1');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Branded v1', content: '{}', theme: blue }, OWNER);
    await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Branded v2', content: '{}', theme: red }, OWNER);
    await post(app, `/api/v1/templates/${template.id}/publish`, {}, OWNER);
    const { versions } = await (await get(app, `/api/v1/templates/${template.id}/versions`, OWNER)).json();
    const blueVersion = versions.find((v: { title: string }) => v.title === 'Branded v1');

    await post(app, `/api/v1/templates/${template.id}/versions/${blueVersion.id}/restore`, {}, OWNER);
    const { template: restored } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(restored.theme).toBe(blue);
  });

  it('a pre-theme snapshot leaves the current theme alone on restore', async () => {
    const red = '{"container":{"backgroundColor":"#ff0000"}}';
    const { template, versions } = await publishedTwice('Legacy v1', 'Legacy v2', red);
    const older = versions.find((v: { title: string }) => v.title === 'Legacy v1');

    // Erase the snapshot's theme, as any version from before the column did.
    await db.update(templateVersions).set({ theme: null }).where(eq(templateVersions.id, older.id));

    await post(app, `/api/v1/templates/${template.id}/versions/${older.id}/restore`, {}, OWNER);
    const { template: restored } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(restored.title).toBe('Legacy v1');
    expect(restored.theme).toBe(red);
  });

  it('404s when restoring a version owned by another user', async () => {
    const { template, versions } = await publishedTwice('Version one', 'Version two');

    const res = await post(app, `/api/v1/templates/${template.id}/versions/${versions[0].id}/restore`, {}, OTHER);
    expect(res.status).toBe(404);
  });
});
