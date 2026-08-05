import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { contactMessages } from '@temply/shared/schema';
import { createTestApp, createTestDb, post, type TestDb } from '../test/helpers';

// Stop the real Resend SDK from making a network call; capture the payload.
const sent: any[] = [];
mock.module('resend', () => ({
  Resend: class {
    emails = {
      send: async (payload: any) => {
        sent.push(payload);
        return { error: null };
      },
    };
  },
}));

import { contactRoutes } from './contact';

let db: TestDb;
let app: any;

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db, contactRoutes);
  sent.length = 0;
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.CONTACT_EMAIL = 'team@example.com';
  delete process.env.CONTACT_FROM_EMAIL;
});

const submit = (body: unknown) => post(app, '/api/v1/contact', body, null);

describe('POST /api/v1/contact', () => {
  it('422s on a missing name and an oversized message', async () => {
    expect((await submit({ email: 'a@b.co', message: 'hi' })).status).toBe(422);
    expect(
      (await submit({ name: 'A', email: 'a@b.co', message: 'x'.repeat(5001) })).status,
    ).toBe(422);
  });

  it('stores the message and delivers it with replyTo the submitter', async () => {
    const res = await submit({ name: 'Sam', email: 'sam@acme.co', message: 'Hello there' });
    expect(res.status).toBe(200);

    const rows = await db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('sam@acme.co');

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('team@example.com');
    expect(sent[0].replyTo).toBe('sam@acme.co');
    expect(sent[0].from).toBe('onboarding@resend.dev');
  });

  it('still succeeds and stores when sending is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    const res = await submit({ name: 'Sam', email: 'sam@acme.co', message: 'Hello' });
    expect(res.status).toBe(200);
    expect(await db.select().from(contactMessages)).toHaveLength(1);
    expect(sent).toHaveLength(0);
  });

  it('accepts but discards a honeypot submission', async () => {
    const res = await submit({ name: 'Bot', email: 'b@b.co', message: 'spam', company: 'Bots Inc' });
    expect(res.status).toBe(200);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });
});
