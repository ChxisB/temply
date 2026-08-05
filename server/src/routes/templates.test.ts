import { beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
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

  it('rejects a title shorter than 3 characters', async () => {
    const res = await post(app, '/api/v1/templates', { title: 'ab', content: '{}' }, OWNER);
    expect(res.status).toBe(422);
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

describe('POST /api/v1/templates/:id', () => {
  it('updates the template in place', async () => {
    const template = await createTemplate(OWNER, 'Before');

    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{"v":2}' }, OWNER);

    const { template: updated } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(updated.title).toBe('After');
    expect(updated.content).toBe('{"v":2}');
  });

  it('does not snapshot a version for a free user', async () => {
    const template = await createTemplate(OWNER, 'Before');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{}' }, OWNER);

    const versions = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(versions).toHaveLength(0);
  });

  it('snapshots the pre-edit content for a paid user', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Before');

    await post(app, `/api/v1/templates/${template.id}`, { title: 'After', content: '{"v":2}' }, OWNER);

    const versions = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(versions).toHaveLength(1);
    expect(versions[0].title).toBe('Before');
    expect(versions[0].version_number).toBe(1);
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

describe('version history', () => {
  it('restores an earlier version and snapshots the version it replaced', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Version one');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Version two', content: '{"v":2}' }, OWNER);

    const { versions } = await (await get(app, `/api/v1/templates/${template.id}/versions`, OWNER)).json();
    expect(versions).toHaveLength(1);

    await post(app, `/api/v1/templates/${template.id}/versions/${versions[0].id}/restore`, {}, OWNER);

    const { template: restored } = await (await get(app, `/api/v1/templates/${template.id}`, OWNER)).json();
    expect(restored.title).toBe('Version one');

    const all = await db.select().from(templateVersions).where(eq(templateVersions.template_id, template.id));
    expect(all).toHaveLength(2);
  });

  it('404s when restoring a version owned by another user', async () => {
    await givePlan(db, OWNER, 'pro');
    const template = await createTemplate(OWNER, 'Version one');
    await post(app, `/api/v1/templates/${template.id}`, { title: 'Version two', content: '{}' }, OWNER);
    const { versions } = await (await get(app, `/api/v1/templates/${template.id}/versions`, OWNER)).json();

    const res = await post(app, `/api/v1/templates/${template.id}/versions/${versions[0].id}/restore`, {}, OTHER);
    expect(res.status).toBe(404);
  });
});
