import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { TestDb } from '../test/helpers';

process.env.RESEND_API_KEY = 're_test_key';

// Stop the real Resend SDK from making a network call; capture the payload.
const sent: any[] = [];
mock.module('resend', () => ({
  Resend: class {
    emails = {
      send: async (payload: any) => {
        sent.push(payload);
        return { data: { id: 'email_1' }, error: null };
      },
    };
  },
}));

const { emailsRoutes } = await import('./emails');
const { createTestApp, createTestDb, givePlan, post } = await import('../test/helpers');
const { getEmailUsage } = await import('../lib/quota');

let db: TestDb;
let app: any;
const USER = 'user_send';

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db, emailsRoutes);
  sent.length = 0;
});

const body = (over: Record<string, unknown> = {}) => ({
  subject: 'Hi',
  to: 'a@example.com',
  content: '{"type":"doc","content":[]}',
  ...over,
});

describe('POST /api/v1/emails/send', () => {
  it('rejects a request with no user', async () => {
    const res = await post(app, '/api/v1/emails/send', body());
    expect(res.status).toBe(401);
  });

  it('sends from the Temply address with the display name and records usage', async () => {
    const res = await post(app, '/api/v1/emails/send', body({ fromName: 'Acme', replyTo: 'me@acme.com' }), USER);
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].from).toBe('Acme via Temply <send@temply.app>');
    expect(sent[0].replyTo).toBe('me@acme.com');
    expect(sent[0].to).toEqual(['a@example.com']);
    expect(await getEmailUsage(db, USER)).toBe(1);
  });

  it('sanitizes a hostile display name before it reaches the From header', async () => {
    const res = await post(
      app,
      '/api/v1/emails/send',
      body({ fromName: 'Acme <evil@x.com>\r\nBcc: victim@x.com' }),
      USER,
    );
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].from).toBe('Acme evil@x.comBcc: victim@x.com via Temply <send@temply.app>');
    expect(sent[0].from).not.toContain('\r');
    expect(sent[0].from).not.toContain('\n');
    expect(sent[0].from.split(' via Temply <')[0]).not.toContain('<');
  });

  it('charges one quota per recipient', async () => {
    await post(app, '/api/v1/emails/send', body({ to: 'a@x.com, b@x.com, c@x.com' }), USER);
    expect(await getEmailUsage(db, USER)).toBe(3);
  });

  it('blocks the whole send when it would exceed the free limit and does not call Resend', async () => {
    // Free limit is 30. Pre-load 29, then try to send to 2.
    const { recordEmailSend } = await import('../lib/quota');
    await recordEmailSend(db, USER, 29);
    const res = await post(app, '/api/v1/emails/send', body({ to: 'a@x.com, b@x.com' }), USER);
    expect(res.status).toBe(402);
    expect(sent).toHaveLength(0);
    expect(await getEmailUsage(db, USER)).toBe(29);
  });
});
