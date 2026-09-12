/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@seeds/ui', '@seeds/types'],
};

module.exports = nextConfig;
