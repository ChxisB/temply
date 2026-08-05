import { Elysia, t } from 'elysia';
import { Resend } from 'resend';
import { contactMessages } from '@temply/shared/schema';
import { json } from '../lib/errors';

/**
 * The landing page's contact form. Public — a visitor has no account.
 *
 * Order matters: the message is stored before any delivery attempt, so a mail
 * outage (or simply an unconfigured RESEND_API_KEY in dev) never loses it.
 * Delivery is best-effort on top.
 */
export const contactRoutes = new Elysia().post(
  '/api/v1/contact',
  async (ctx: any) => {
    const { name, email, message, company } = ctx.body;

    // Honeypot: humans never see this field. Pretend success so the bot moves on.
    if (company) return json({ status: 'ok' });

    await ctx.db
      .insert(contactMessages)
      .values({ id: crypto.randomUUID(), name, email, message });

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_EMAIL;
    if (apiKey && to) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
          to,
          replyTo: email,
          subject: `Contact form: ${name}`,
          text: `${message}\n\n— ${name} <${email}>`,
        });
      } catch (error) {
        console.error('contact form delivery failed', error);
      }
    }

    return json({ status: 'ok' });
  },
  {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      email: t.String({ format: 'email', maxLength: 254 }),
      message: t.String({ minLength: 1, maxLength: 5000 }),
      company: t.Optional(t.String()),
    }),
  },
);
