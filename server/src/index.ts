import { Elysia } from 'elysia';
import { errorResponse } from './lib/errors';
import { authPlugin } from './plugins/auth';
import { dbPlugin } from './plugins/db';
import { templatesRoutes } from './routes/templates';
import { apiKeysRoutes } from './routes/api-keys';
import { brandsRoutes } from './routes/brands';
import { assetsRoutes } from './routes/assets';
import { billingRoutes } from './routes/billing';
import { quotaRoutes } from './routes/quota';
import { emailsRoutes } from './routes/emails';
import { publicRoutes } from './routes/public';
import { contactRoutes } from './routes/contact';
import { webhookRoutes } from './routes/webhooks/stripe';
import { authRoutes } from './routes/auth/logout';

const app = new Elysia()
  // Registered before the route modules and scoped global: a local onError
  // added after .use() never sees errors raised inside the mounted modules,
  // so validation failures would fall back to Elysia's own 422.
  .onError({ as: 'global' }, ({ error, code }) => {
    console.error(`Error [${code}]:`, error);
    return errorResponse(code, error);
  })
  .use(authPlugin)
  .use(dbPlugin)
  .use(templatesRoutes)
  .use(apiKeysRoutes)
  .use(brandsRoutes)
  .use(assetsRoutes)
  .use(billingRoutes)
  .use(quotaRoutes)
  .use(emailsRoutes)
  .use(publicRoutes)
  .use(contactRoutes)
  .use(webhookRoutes)
  .use(authRoutes)
  // Bind to loopback only: this service trusts a proxy-forwarded user id and
  // must never be reachable directly from the network.
  .listen({ port: 3001, hostname: '127.0.0.1' });

console.log('🦊 Elysia server running on http://127.0.0.1:3001');
export type App = typeof app;
