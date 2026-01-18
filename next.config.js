/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
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
    // Activer le support WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Configurer les fichiers .wasm pour qu'ils soient traités comme des modules WebAssembly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
}

module.exports = nextConfig
