import { Elysia } from 'elysia';
import { authPlugin } from './plugins/auth';
import { dbPlugin } from './plugins/db';
import { templatesRoutes } from './routes/templates';
import { apiKeysRoutes } from './routes/api-keys';
import { billingRoutes } from './routes/billing';
import { emailsRoutes } from './routes/emails';
import { configRoutes } from './routes/config';
import { sendingRoutes } from './routes/sending';
import { publicRoutes } from './routes/public';
import { webhookRoutes } from './routes/webhooks/stripe';
import { authRoutes } from './routes/auth/logout';

const app = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .use(templatesRoutes)
  .use(apiKeysRoutes)
  .use(billingRoutes)
  .use(emailsRoutes)
  .use(configRoutes)
  .use(sendingRoutes)
  .use(publicRoutes)
  .use(webhookRoutes)
  .use(authRoutes)
  .onError(({ error, code }) => {
    console.error(`Error [${code}]:`, error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ status: 500, message, errors: [message] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  })
  // Bind to loopback only: this service trusts a proxy-forwarded user id and
  // must never be reachable directly from the network.
  .listen({ port: 3001, hostname: '127.0.0.1' });

console.log('🦊 Elysia server running on http://127.0.0.1:3001');
export type App = typeof app;
