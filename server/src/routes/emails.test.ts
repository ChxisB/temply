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

  it('sends from the Temply address with the display name', async () => {
    const res = await post(app, '/api/v1/emails/send', body({ fromName: 'Acme', replyTo: 'me@acme.com' }), USER);
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].from).toBe('Acme via Temply <send@temply.app>');
    expect(sent[0].replyTo).toBe('me@acme.com');
    expect(sent[0].to).toEqual(['a@example.com']);
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

  it('rate-limits after 20 sends in the hour', async () => {
    // Use a dedicated user so this test's exact 20/21 counts aren't skewed by
    // the sends the other tests above already made for USER in this file's
    // shared, module-level rate limiter.
    const rateLimitUser = 'user_ratelimit';
    for (let i = 0; i < 20; i++) {
      expect((await post(app, '/api/v1/emails/send', body(), rateLimitUser)).status).toBe(200);
    }
    expect((await post(app, '/api/v1/emails/send', body(), rateLimitUser)).status).toBe(429);
  });
});
