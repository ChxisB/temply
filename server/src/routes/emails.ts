import { Elysia, t } from 'elysia';
import { Resend } from 'resend';
import { render } from '../render/render';
import { json, unauthorized } from '../lib/errors';

const FROM_ADDRESS = process.env.SENDING_FROM_ADDRESS || 'send@temply.app';
const FROM_LABEL = process.env.SENDING_FROM_LABEL || 'Temply';

function buildFrom(name?: string): string {
  const trimmed = name?.replace(/[<>"\r\n]/g, '').trim();
  const display = trimmed ? `${trimmed} via ${FROM_LABEL}` : FROM_LABEL;
  return `${display} <${FROM_ADDRESS}>`;
}

// In-process abuse guard for the shared debug sender: 20 test sends / hour /
// user. Resets on restart — acceptable for a debug aid.
const TEST_SENDS_PER_HOUR = 20;
const sendCounts = new Map<string, { hour: string; count: number }>();

function overRateLimit(userId: string): boolean {
  const hour = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH" (UTC)
  const entry = sendCounts.get(userId);
  if (!entry || entry.hour !== hour) {
    sendCounts.set(userId, { hour, count: 1 });
    return false;
  }
  if (entry.count >= TEST_SENDS_PER_HOUR) return true;
  entry.count += 1;
  return false;
}

export const emailsRoutes = new Elysia()
  .post(
    '/api/v1/emails/preview',
    async ({ body }: any) => {
      const { content, theme, previewText, payload, pretty, plainText } = body;
      const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
      const html = await render(contentJson, {
        // The text alternative is the same render with the markup stripped, so
        // it stays in step with the email rather than being written twice.
        plainText: plainText === true,
        theme: theme || undefined,
        preview: previewText,
        // Absent means "composing": variables stay as placeholders and every
        // conditional block shows.
        payload: payload || undefined,
        // Indented output for the source view. The email itself stays as
        // rendered — whitespace between table cells is not always harmless.
        pretty: pretty === true,
      });
      return json({ html });
    },
    {
      body: t.Object({
        previewText: t.Optional(t.String()),
        content: t.Any(),
        theme: t.Optional(t.Any()),
        payload: t.Optional(t.Any()),
        pretty: t.Optional(t.Boolean()),
        plainText: t.Optional(t.Boolean()),
      }),
    },
  )

  .post(
    '/api/v1/emails/send',
    async (ctx: any) => {
      const { body, userId } = ctx;
      if (!userId) return unauthorized();

      const recipients = body.to
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        return json({ status: 400, message: 'Add at least one recipient', errors: ['No recipients'] }, 400);
      }

      if (overRateLimit(userId)) {
        return json({ status: 429, message: 'Too many test sends — try again later.', errors: ['Rate limited'] }, 429);
      }

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return json({ status: 500, message: 'Sending is not configured', errors: ['RESEND_API_KEY missing'] }, 500);
      }

      const { previewText, subject, fromName, replyTo, content, theme } = body;
      const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
      const renderOptions = { theme: theme || undefined, preview: previewText };
      const html = await render(contentJson, renderOptions);
      // A test send should be the email people actually receive, and a real one
      // carries a text alternative: filters score HTML-only mail worse, and
      // some clients show nothing else.
      const text = await render(contentJson, { ...renderOptions, plainText: true });

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: buildFrom(fromName),
        to: recipients,
        replyTo: replyTo || undefined,
        subject,
        html,
        text,
      });
      if (error) return json({ status: 500, message: error.message, errors: [error.message] }, 500);

      return json({ status: 'ok' });
    },
    {
      body: t.Object({
        previewText: t.Optional(t.String()),
        subject: t.String({ minLength: 1 }),
        fromName: t.Optional(t.String()),
        replyTo: t.Optional(t.String()),
        to: t.String({ minLength: 1 }),
        content: t.String({ minLength: 1 }),
        theme: t.Optional(t.Any()),
      }),
    },
  );
