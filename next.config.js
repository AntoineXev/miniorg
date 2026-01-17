/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Cloudflare Pages configuration
  images: {
    unoptimized: true, // Cloudflare has its own image optimization
  },
}

module.exports = nextConfig
