/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['~'] = process.cwd();
    config.resolve.alias['@'] = process.cwd() + '/core';
    return config;
  },
};

export default nextConfig;
