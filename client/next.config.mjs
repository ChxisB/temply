import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A phone on the same Wi-Fi reaches the dev server at the machine's LAN
  // address; without this Next refuses its requests for /_next assets as
  // cross-origin. Ignored outside development.
  allowedDevOrigins: ['192.168.1.192'],
  webpack: (config) => {
    config.resolve.alias['~'] = process.cwd();
    config.resolve.alias['@'] = process.cwd() + '/core';
    return config;
  },
  // The headers every response carries. No Content-Security-Policy yet:
  // Clerk, ImageKit and the editor's inline styles each need an allow-list
  // that has to be written against the real hosts, and a wrong one takes
  // sign-in down; the rest costs nothing and closes the common holes.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Only meaningful over HTTPS, and browsers ignore it otherwise, so
          // the LAN dev origin is unaffected.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Nothing here is meant to be framed; the review page is a link,
          // not an embed.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ];
  },
  // Billing and API keys moved under Settings. These catch bookmarks and Stripe
  // checkout sessions already in flight, whose return URLs were baked at
  // creation.
  async redirects() {
    return [
      { source: '/dashboard/billing', destination: '/dashboard/settings/plan', permanent: false },
      {
        source: '/dashboard/api-keys',
        destination: '/dashboard/settings/api-keys',
        permanent: false,
      },
    ];
  },
};

// Sentry wraps the build to upload source maps when SENTRY_AUTH_TOKEN is
// present (CI and the deploy), and otherwise stays out of the way: a local
// build must not need a Sentry account. Errors are reported by the runtime
// configs regardless of whether maps were uploaded.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
  webpack: { treeshake: { removeDebugLogging: true } },
});
