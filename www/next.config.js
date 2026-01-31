/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pas de output: 'export' → SSR activé
  images: {
    remotePatterns: [], // Ajouter les domaines d'images si besoin
  },
}
module.exports = nextConfig
