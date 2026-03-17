/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // required for static export
    domains: ['spicyhealthmediaprod.blob.core.windows.net'],
  },
};

module.exports = nextConfig;
