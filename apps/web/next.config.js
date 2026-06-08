/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 's3.amazonaws.com', 'cdn.lcfms.io'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:4000',
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
  },
};

module.exports = nextConfig;
