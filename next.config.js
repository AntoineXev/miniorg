/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Cloudflare Workers configuration with OpenNext
  images: {
    unoptimized: true, // Cloudflare has its own image optimization
  },
}

module.exports = nextConfig
