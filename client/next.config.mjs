/** @type {import('next').NextConfig} */
const nextConfig = {
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
