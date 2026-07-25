import { verifyToken, createClerkClient } from '@clerk/backend';
import { Elysia } from 'elysia';

export const authPlugin = new Elysia({ name: 'auth' })
  .derive(async ({ request }) => {
    // Trust x-user-id header when proxied through Next.js
    const forwardedUserId = request.headers.get('x-user-id');
    if (forwardedUserId) {
      console.log('[auth] trusted x-user-id:', forwardedUserId.substring(0, 20));
      return { userId: forwardedUserId };
    }

    const cookieHeader = request.headers.get('cookie') || '';

    // Try direct JWT verification on the __session cookie
    const sessionCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('__session='))
      ?.split('=')[1];

    if (sessionCookie && sessionCookie.includes('.')) {
      try {
        const payload = await verifyToken(sessionCookie, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        console.log('[auth] verified via __session token:', payload.sub);
        return { userId: payload.sub };
      } catch (e) {
        console.log('[auth] __session verifyToken failed:', (e as Error)?.message);
      }
    }

    // Fallback: try authenticateRequest (handles dev mode, __clerk_db_jwt, etc.)
    if (cookieHeader.includes('__session=') || cookieHeader.includes('__clerk_db_jwt=')) {
      try {
        const clerk = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        });
        const authState = await clerk.authenticateRequest(request);
        if (authState.status === 'signed-in' && authState.isSignedIn) {
          const authObj = authState.toAuth();
          const userId = (authObj as any)?.userId;
          if (userId) {
            console.log('[auth] verified via authenticateRequest:', userId);
            return { userId };
          }
        }
        console.log('[auth] authenticateRequest status:', authState.status, 'reason:', (authState as any).reason);
      } catch (e) {
        console.error('[auth] authenticateRequest error:', (e as Error)?.message);
      }
    }

    return { userId: null };
  });
