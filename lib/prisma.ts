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
  // Check if we're in Cloudflare Workers (Edge Runtime)
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && process.env.DB) {
    const adapter = new PrismaD1(process.env.DB as unknown as D1Database)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  
  // For local development and build time, create a dummy adapter
  // This won't actually be used during build, only at runtime
  if (typeof window === 'undefined') {
    // Server-side: create a minimal D1-like object for build compatibility
    const dummyD1 = {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          all: async () => ({ results: [], success: true }),
          run: async () => ({ success: true, meta: {} }),
          first: async () => null,
          // stmt.raw() is called by Prisma adapter with { columnNames: true }
          raw: async (options?: { columnNames?: boolean }) => {
            // Return format: [columnNames, ...rows]
            return [[], []];
          },
        }),
      }),
      dump: async () => new ArrayBuffer(0),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as D1Database
    
    const adapter = new PrismaD1(dummyD1)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  
  // Fallback - should never reach here
  throw new Error('Cannot create Prisma client: no valid adapter configuration')
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
  
  // For Node.js runtime, use global instance
  return prisma
}
