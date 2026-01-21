/** @type {import('next').NextConfig} */
const isTauri = process.env.BUILD_TARGET === 'tauri'
const isCloudflare = process.env.BUILD_TARGET === 'cloudflare'

const nextConfig = {
  // Static export for Tauri builds
  output: isTauri ? 'export' : undefined,
  distDir: isTauri ? 'out' : '.next',
  // Ignore .ts route files during Tauri export so API routes are not included
  pageExtensions: isTauri
    ? ['tsx', 'jsx', 'mdx']
    : ['ts', 'tsx', 'js', 'jsx', 'mdx'],
  
  // Skip API routes for static export (Tauri builds)
  ...(isTauri && {
    trailingSlash: true,
  }),
  
  images: {
    // Disable image optimization for static export (Tauri)
    unoptimized: isTauri,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Seulement externaliser pour les builds non-Cloudflare
    serverComponentsExternalPackages: isCloudflare ? [] : [
      '@prisma/adapter-libsql',
      '@libsql/client',
      'libsql',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isCloudflare) {
      // Build Cloudflare: remplacer complètement les modules par false
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/adapter-libsql': false,
        '@libsql/client': false,
        'libsql': false,
      };
      
      // Fallbacks pour les modules Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'child_process': false,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
      };
    } else if (isTauri) {
      // Build Tauri: skip API routes and server-side dependencies
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'fs': false,
        'net': false,
        'tls': false,
      };
    } else {
      // Build dev/local: externaliser normalement
      if (isServer) {
        config.externals.push({
          '@libsql/client': 'commonjs @libsql/client',
          '@prisma/adapter-libsql': 'commonjs @prisma/adapter-libsql',
          'libsql': 'commonjs libsql',
        });
      }
    }
    
    // Ignorer les fichiers non-JS dans node_modules
    config.module.rules.push({
      test: /\.(md|txt)$/,
      type: 'asset/source',
    });
    
    return config;
  },
}

module.exports = nextConfig
