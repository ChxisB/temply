import { Elysia, t } from 'elysia';
import { Resend } from 'resend';
import { render } from '../render/render';
import { DEFAULT_EDITOR_THEME_SCHEMA } from '../lib/email-theme-schema';
import { json, unauthorized } from '../lib/errors';

export const emailsRoutes = new Elysia()
  .post('/api/v1/emails/preview', async ({ body }: any) => {
    const { content, theme, previewText } = body;
    const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
    // previewText was accepted but never forwarded, so the preheader never
    // appeared in a preview even though it does in the sent mail.
    const html = await render(contentJson, { theme: theme || undefined, preview: previewText });
    return json({ html });
  }, { body: t.Object({ previewText: t.Optional(t.String()), content: t.Any(), theme: t.Optional(t.Any()) }) })

  .post('/api/v1/emails/send', async ({ body, request }: any) => {
    const cookieHeader = request.headers.get('cookie') || '';
    const configCookie = cookieHeader.split(';').find((c: string) => c.trim().startsWith('__temply_config__='))?.split('=')[1];
    if (!configCookie) return unauthorized('Missing configuration');
    const config = JSON.parse(decodeURIComponent(configCookie));
    if (!config.apiKey) return unauthorized('Missing API key');

    const { previewText, subject, from, replyTo, to, content, theme } = body;
    const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
    // Send has to apply the same theme the author previewed, or what lands in
    // the inbox is not what they approved.
    const html = await render(contentJson, { theme: theme || undefined, preview: previewText });

    const resend = new Resend(config.apiKey);
    const recipients = to.split(',').map((s: string) => s.trim());
    const { error } = await resend.emails.send({ to: recipients, from, replyTo: replyTo || undefined, subject, html });

    if (error) return json({ status: 500, message: error.message, errors: [error.message] }, 500);
    return json({ status: 'ok' });
  }, { body: t.Object({ previewText: t.Optional(t.String()), subject: t.String({ minLength: 1 }), from: t.String({ minLength: 1 }), replyTo: t.Optional(t.String()), to: t.String({ minLength: 1 }), content: t.String({ minLength: 1 }), theme: t.Optional(t.Any()) }) });
