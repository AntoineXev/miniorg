import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { D1Database } from '@cloudflare/workers-types'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creates a Prisma client with D1 adapter
 * For Prisma 7, an adapter is always required
 */
function createPrismaClient() {
  // Check if we're in Cloudflare Workers (Edge Runtime) with real D1 binding
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && process.env.DB) {
    const adapter = new PrismaD1(process.env.DB as unknown as D1Database)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  
  // For local development, use libSQL/SQLite
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    // Import dynamically to avoid bundling issues
    const { createDevPrismaClient } = require('./prisma-dev')
    return createDevPrismaClient()
  }
  
  // Fallback - should never reach here in normal operation
  throw new Error('Cannot create Prisma client: no valid adapter configuration. Make sure DB binding is available in production.')
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Helper function to get the appropriate Prisma client
 * Use this in API routes to automatically detect environment
 */
export function getPrisma(): PrismaClient {
  // For Edge Runtime with D1 (Cloudflare Workers)
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && process.env.DB) {
    const adapter = new PrismaD1(process.env.DB as unknown as D1Database)
    return new PrismaClient({ adapter })
  }
  
  // For local dev, use the global instance which uses libSQL
  return prisma
}
