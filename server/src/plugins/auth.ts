import { verifyToken, createClerkClient } from '@clerk/backend';
import { Elysia } from 'elysia';
import { timingSafeEqual } from 'node:crypto';

/**
 * Shared secret proving a request really came from our own Next.js proxy.
 * Without it an `x-user-id` header is just an unauthenticated string, so it is
 * ignored and the request falls through to real Clerk verification.
 */
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? '';

function proxyTokenIsValid(presented: string | null): boolean {
  if (!INTERNAL_API_SECRET || !presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(INTERNAL_API_SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const authPlugin = new Elysia({ name: 'auth' })
  // `as: 'global'` is required. Elysia's default `local` scope keeps the derive
  // on this instance, so every route module mounted alongside it in index.ts
  // would receive `userId: undefined` and reject every request.
  .derive({ as: 'global' }, async ({ request }) => {
    // Accept a forwarded user id ONLY from our own proxy, proven by the shared
    // secret. An x-user-id header on its own is attacker-controlled input.
    const forwardedUserId = request.headers.get('x-user-id');
    if (forwardedUserId) {
      if (proxyTokenIsValid(request.headers.get('x-internal-token'))) {
        return { userId: forwardedUserId };
      }
      console.warn('[auth] rejected x-user-id without a valid proxy token');
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
