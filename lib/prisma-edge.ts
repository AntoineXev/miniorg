import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { D1Database } from '@cloudflare/workers-types'

// Cache for Prisma client instances per request
const prismaClientCache = new WeakMap<D1Database, PrismaClient>()

/**
 * Get Prisma client configured with D1 adapter for Edge Runtime
 * @param d1Database - D1 database instance from Cloudflare binding
 * @returns Prisma client instance
 */
export function getPrismaClient(d1Database: D1Database): PrismaClient {
  // Check cache to avoid creating multiple instances
  let cached = prismaClientCache.get(d1Database)
  
  if (!cached) {
    const adapter = new PrismaD1(d1Database)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached = new PrismaClient({ adapter } as any)
    prismaClientCache.set(d1Database, cached)
  }
  
  return cached
}

/**
 * Helper to get D1 database from environment
 * Works in both Edge Runtime and local development
 */
export function getDB(): D1Database {
  // In production (Cloudflare Pages), use the binding
  if (typeof process !== 'undefined' && process.env.DB) {
    return process.env.DB as unknown as D1Database
  }
  
  // Fallback error for missing DB
  throw new Error('D1 database binding not found. Make sure DB is configured in wrangler.toml')
}
