import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { D1Database } from '@cloudflare/workers-types'

/**
 * Get Prisma client configured with D1 adapter
 * Works in both local development (via opennextjs-cloudflare preview) and production (Cloudflare Workers)
 * The DB binding is automatically provided by Wrangler/Cloudflare
 * 
 * In OpenNext.js Cloudflare, bindings are injected into process.env after build.
 * For local preview, ensure you're using `opennextjs-cloudflare preview` which uses Wrangler.
 * 
 * @param d1Database - Optional D1 database instance (defaults to process.env.DB)
 * @returns Prisma client instance
 */
export function getPrisma(d1Database?: D1Database): PrismaClient {
  let db: D1Database | undefined = d1Database

  // Try to get DB from various sources (in order of preference)
  if (!db) {
    // Method 1: process.env.DB (OpenNext.js Cloudflare injects bindings here)
    if (typeof process !== 'undefined' && process.env.DB) {
      db = process.env.DB as unknown as D1Database
    }
    
    // Method 2: Try globalThis (some Cloudflare Workers contexts)
    if (!db && typeof globalThis !== 'undefined' && (globalThis as any).DB) {
      db = (globalThis as any).DB as D1Database
    }
    
    // Method 3: Try (globalThis as any).env (alternative Workers pattern)
    if (!db && typeof globalThis !== 'undefined' && (globalThis as any).env?.DB) {
      db = (globalThis as any).env.DB as D1Database
    }
  }
  
  if (!db) {
    throw new Error(
      'D1 database binding not found. Make sure:\n' +
      '1. DB is configured in wrangler.toml with binding = "DB"\n' +
      '2. You are using "opennextjs-cloudflare preview" for local development\n' +
      '3. Local D1 database exists (run: wrangler d1 create DB --local)\n' +
      '4. Schema is applied (run: wrangler d1 execute DB --local --file=./prisma/d1-schema.sql)'
    )
  }
  
  const adapter = new PrismaD1(db)
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
