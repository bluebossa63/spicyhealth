/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA support via next-pwa (add when ready)
  images: {
    domains: ['your-storage-account.blob.core.windows.net'],
  },
};

module.exports = nextConfig;
