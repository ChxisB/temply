import { Elysia, t } from 'elysia';
import { Resend } from 'resend';
import { json, unauthorized } from '../lib/errors';
import {
  buildConfigCookieHeader,
  readConfigCookie,
  readSetup,
} from '../lib/config-cookie';

// Resend's shared onboarding sender works before a domain is verified, but only
// delivers to the account owner's own address. That is exactly the Stage 1
// promise: send yourself a first email in minutes, verify your domain later.
const ONBOARDING_FROM = 'Temply <onboarding@resend.dev>';

const TEST_EMAIL_HTML = `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;">
          <tr><td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#18181b;">Your sending works 🎉</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">This is the test email from Temply. If it reached your inbox, your Resend key is connected and you can send your first real email. Verify your own domain next to send from your own address.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const sendingRoutes = new Elysia()
  // The wizard's single source of truth. Key presence and domain status are
  // read live; only the self-reported bits come from the cookie.
  .get('/api/v1/sending/status', async ({ request }) => {
    const cookie = readConfigCookie(request);
    const setup = readSetup(cookie);
    const keyPresent = Boolean(cookie.apiKey);

    let domain: { name: string; status: string; verified: boolean } | null = null;
    let domainError: string | null = null;

    if (keyPresent) {
      try {
        const resend = new Resend(cookie.apiKey);
        const { data, error } = await resend.domains.list();
        if (error) {
          domainError = error.message;
        } else {
          const domains = data?.data ?? [];
          // Prefer a verified domain to report; otherwise show the first one so
          // the user sees it is pending rather than nothing.
          const chosen = domains.find((d) => d.status === 'verified') ?? domains[0];
          domain = chosen
            ? { name: chosen.name, status: chosen.status, verified: chosen.status === 'verified' }
            : null;
        }
      } catch (err: any) {
        domainError = err?.message || 'Could not reach the sending service';
      }
    }

    return json({
      keyPresent,
      testSentAt: setup.testSentAt,
      manual: { account: setup.accountConfirmed, key: setup.keyConfirmed },
      domainSkipped: setup.domainSkipped,
      dismissed: setup.wizardDismissed,
      domain,
      domainError,
    });
  })

  // Records the self-confirmed steps, the skip, and reset. It never touches the
  // key or the real domain status — a reset clears only what the user reported.
  .post(
    '/api/v1/sending/setup',
    async ({ body, request }: any) => {
      const cookie = readConfigCookie(request);
      const setup = readSetup(cookie);

      if (body.reset) {
        // Reset clears progress only. wizardDismissed is a display preference,
        // toggled on its own so a reset never quietly brings the reminders back.
        setup.accountConfirmed = false;
        setup.keyConfirmed = false;
        setup.testSentAt = null;
        setup.domainSkipped = false;
      } else {
        if (typeof body.account === 'boolean') setup.accountConfirmed = body.account;
        if (typeof body.key === 'boolean') setup.keyConfirmed = body.key;
        if (typeof body.domainSkipped === 'boolean') setup.domainSkipped = body.domainSkipped;
        if (typeof body.dismissed === 'boolean') setup.wizardDismissed = body.dismissed;
      }

      cookie.setup = setup;
      const response = new Response(JSON.stringify({ status: 'ok', setup }), {
        headers: { 'Content-Type': 'application/json' },
      });
      response.headers.set('Set-Cookie', buildConfigCookieHeader(cookie));
      return response;
    },
    {
      body: t.Object({
        account: t.Optional(t.Boolean()),
        key: t.Optional(t.Boolean()),
        domainSkipped: t.Optional(t.Boolean()),
        dismissed: t.Optional(t.Boolean()),
        reset: t.Optional(t.Boolean()),
      }),
    }
  )

  // Sends the Stage 1 proof-of-life email from the onboarding sender to the
  // user's own address. On success we stamp testSentAt so step 4 ticks itself.
  .post(
    '/api/v1/emails/send-test',
    async ({ body, request }: any) => {
      const cookie = readConfigCookie(request);
      if (!cookie.apiKey) return unauthorized('Connect your Resend key first');

      const resend = new Resend(cookie.apiKey);
      const { error } = await resend.emails.send({
        from: ONBOARDING_FROM,
        to: [body.to],
        subject: 'Your Temply test email',
        html: TEST_EMAIL_HTML,
      });
      if (error) return json({ status: 500, message: error.message, errors: [error.message] }, 500);

      const setup = readSetup(cookie);
      setup.testSentAt = new Date().toISOString();
      cookie.setup = setup;
      const response = new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
      response.headers.set('Set-Cookie', buildConfigCookieHeader(cookie));
      return response;
    },
    { body: t.Object({ to: t.String({ minLength: 3 }) }) }
  );
