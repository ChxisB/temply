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

export default nextConfig;
