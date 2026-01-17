import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For local development with SQLite
// In Prisma 7, connection configuration is in prisma.config.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Note: datasourceUrl is now passed here instead of schema.prisma
  datasourceUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to get the appropriate Prisma client
// Use this in API routes to automatically detect environment
export function getPrisma(): PrismaClient {
  // For Edge Runtime with D1, use the edge client
  // EdgeRuntime is a global variable only available in Cloudflare Workers
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && process.env.DB) {
    // Dynamic import to avoid bundling issues
    const { getPrismaClient, getDB } = require('./prisma-edge')
    return getPrismaClient(getDB())
  }
  
  // For Node.js runtime (local dev), use standard client
  return prisma
}
