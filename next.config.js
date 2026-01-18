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
  webpack: (config, { isServer }) => {
    // Exclude non-JS files that might be accidentally imported
    config.module.rules.push({
      test: /\.(md|txt)$/,
      type: 'asset/source',
    })
    
    // Support for WebAssembly modules (required for Prisma 7 with Cloudflare)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }
    
    // Configure WebAssembly loader
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })
    
    // Ignore problematic imports from node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent issues with dynamic requires in libsql packages
      '@libsql/client': false,
      '@libsql/isomorphic-fetch': false,
      '@libsql/isomorphic-ws': false,
    }
    
    return config
  },
}

module.exports = nextConfig
