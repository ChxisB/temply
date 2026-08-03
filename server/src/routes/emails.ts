import { Elysia, t } from 'elysia';
import { Resend } from 'resend';
import { render } from '../render/render';
import { json, paymentRequired, unauthorized } from '../lib/errors';
import { checkEmailQuota, recordEmailSend } from '../lib/quota';

const FROM_ADDRESS = process.env.SENDING_FROM_ADDRESS || 'send@temply.app';
const FROM_LABEL = process.env.SENDING_FROM_LABEL || 'Temply';

function buildFrom(name?: string): string {
  const trimmed = name?.replace(/[<>"\r\n]/g, '').trim();
  const display = trimmed ? `${trimmed} via ${FROM_LABEL}` : FROM_LABEL;
  return `${display} <${FROM_ADDRESS}>`;
}

export const emailsRoutes = new Elysia()
  .post(
    '/api/v1/emails/preview',
    async ({ body }: any) => {
      const { content, theme, previewText } = body;
      const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
      const html = await render(contentJson, { theme: theme || undefined, preview: previewText });
      return json({ html });
    },
    { body: t.Object({ previewText: t.Optional(t.String()), content: t.Any(), theme: t.Optional(t.Any()) }) },
  )

  .post(
    '/api/v1/emails/send',
    async (ctx: any) => {
      const { body, userId, db } = ctx;
      if (!userId) return unauthorized();

      const recipients = body.to
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        return json({ status: 400, message: 'Add at least one recipient', errors: ['No recipients'] }, 400);
      }

      // Charge per recipient, and refuse the whole send rather than sending part.
      const quota = await checkEmailQuota(db, userId, recipients.length);
      if (!quota.allowed) return paymentRequired(quota.message!);

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return json({ status: 500, message: 'Sending is not configured', errors: ['RESEND_API_KEY missing'] }, 500);
      }

      const { previewText, subject, fromName, replyTo, content, theme } = body;
      const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
      const html = await render(contentJson, { theme: theme || undefined, preview: previewText });

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: buildFrom(fromName),
        to: recipients,
        replyTo: replyTo || undefined,
        subject,
        html,
      });
      if (error) return json({ status: 500, message: error.message, errors: [error.message] }, 500);

      await recordEmailSend(db, userId, recipients.length);
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
