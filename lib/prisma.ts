import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For local development with SQLite
// In Prisma 7, adapters are required for all database connections
function createPrismaClient() {
  // Create LibSQL client (works with SQLite files)
  const libsql = createClient({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  })
  
  // Create adapter with the config (url)
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  })
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

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
