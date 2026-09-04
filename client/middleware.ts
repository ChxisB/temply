import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/templates(.*)', '/onboarding(.*)']);
const isOnboarding = createRouteMatcher(['/onboarding(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Without an explicit destination `auth.protect()` answers signed-out
    // requests with a bare 404, which reads as a broken link rather than a
    // prompt to sign in.
    const { orgId } = await auth.protect({
      unauthenticatedUrl: new URL('/login', req.url).toString(),
    });
    // Every account lives in an organization. A signed-in user without an
    // active one — fresh from sign-up, or switched to none — has nowhere to
    // go but onboarding, which makes one.
    if (!orgId && !isOnboarding(req)) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
