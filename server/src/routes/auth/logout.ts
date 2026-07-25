import { createClerkClient } from '@clerk/backend';
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
import { Elysia } from 'elysia';

export const authRoutes = new Elysia()
  .post('/auth/logout', async (ctx: any) => {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const cookieHeader = ctx.request.headers.get('cookie') || '';
    const sessionId = cookieHeader.split(';').find((c: string) => c.trim().startsWith('__session='))?.split('=')[1];
    if (sessionId) {
      try { await clerk.sessions.revokeSession(sessionId); }
      catch {}
    }
    return new Response(null, { status: 302, headers: { Location: '/login' } });
  });
