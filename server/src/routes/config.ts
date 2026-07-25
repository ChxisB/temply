import { Elysia, t } from 'elysia';
import { json, serializeZodError } from '../lib/errors';

export const configRoutes = new Elysia()
  .get('/api/v1/config', async ({ request }) => {
    const cookieHeader = request.headers.get('cookie') || '';
    const configCookie = cookieHeader.split(';').find((c: string) => c.trim().startsWith('__temply_config__='))?.split('=')[1];
    const cookie = configCookie ? JSON.parse(decodeURIComponent(configCookie)) : {};
    return json({ provider: cookie.provider || 'resend', apiKey: cookie.apiKey || '' });
  })

  .post('/api/v1/config', async ({ body, request }: any) => {
    const { provider, apiKey } = body;
    const cookieHeader = request.headers.get('cookie') || '';
    const configCookie = cookieHeader.split(';').find((c: string) => c.trim().startsWith('__temply_config__='))?.split('=')[1];
    const cookie = configCookie ? JSON.parse(decodeURIComponent(configCookie)) : {};
    cookie.provider = provider;
    cookie.apiKey = apiKey;

    const isDev = process.env.NODE_ENV !== 'production';
    const response = new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
    response.headers.set('Set-Cookie', `__temply_config__=${encodeURIComponent(JSON.stringify(cookie))}; Max-Age=${60 * 60 * 24 * 30}; Path=/; HttpOnly=${!isDev}; Secure=${!isDev}; SameSite=Lax`);
    return response;
  }, { body: t.Object({ provider: t.Literal('resend'), apiKey: t.String() }) });
