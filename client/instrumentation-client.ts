import * as Sentry from '@sentry/nextjs';

/**
 * Browser-side error monitoring. Off unless a DSN is set, so a checkout of
 * the repo reports nothing anywhere by accident. No session replay and no
 * tracing: what we want to know is that a page broke and where — the
 * editor's every keystroke is not ours to record.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
