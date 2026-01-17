import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For local development with SQLite
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to get the appropriate Prisma client
// Use this in API routes to automatically detect environment
export function getPrisma(): PrismaClient {
  // For Edge Runtime with D1, use the edge client
  if (typeof EdgeRuntime !== 'undefined' && process.env.DB) {
    // Dynamic import to avoid bundling issues
    const { getPrismaClient, getDB } = require('./prisma-edge')
    return getPrismaClient(getDB())
  }
  
  // For Node.js runtime (local dev), use standard client
  return prisma
}

