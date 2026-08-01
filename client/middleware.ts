import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/templates(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Without an explicit destination `auth.protect()` answers signed-out
    // requests with a bare 404, which reads as a broken link rather than a
    // prompt to sign in.
    await auth.protect({
      unauthenticatedUrl: new URL('/login', req.url).toString(),
    });
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
