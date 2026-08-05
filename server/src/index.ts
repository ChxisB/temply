import { Elysia } from 'elysia';
import { authPlugin } from './plugins/auth';
import { dbPlugin } from './plugins/db';
import { templatesRoutes } from './routes/templates';
import { apiKeysRoutes } from './routes/api-keys';
import { brandsRoutes } from './routes/brands';
import { billingRoutes } from './routes/billing';
import { quotaRoutes } from './routes/quota';
import { imagekitRoutes } from './routes/imagekit';
import { emailsRoutes } from './routes/emails';
import { publicRoutes } from './routes/public';
import { contactRoutes } from './routes/contact';
import { webhookRoutes } from './routes/webhooks/stripe';
import { authRoutes } from './routes/auth/logout';

const app = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .use(templatesRoutes)
  .use(apiKeysRoutes)
  .use(brandsRoutes)
  .use(billingRoutes)
  .use(quotaRoutes)
  .use(imagekitRoutes)
  .use(emailsRoutes)
  .use(publicRoutes)
  .use(contactRoutes)
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
