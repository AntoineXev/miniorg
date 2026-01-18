import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { D1Database } from '@cloudflare/workers-types'
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Get Prisma client configured with D1 adapter
 * Works in both local development (via opennextjs-cloudflare preview) and production (Cloudflare Workers)
 * The DB binding is automatically provided by Wrangler/Cloudflare
 * 
 * In OpenNext.js Cloudflare, bindings are available via getCloudflareContext().env.DB
 * For local preview, ensure you're using `opennextjs-cloudflare preview` which uses Wrangler.
 * 
 * @param d1Database - Optional D1 database instance (defaults to getting from Cloudflare context)
 * @returns Prisma client instance
 */
export function getPrisma(d1Database?: D1Database): PrismaClient {
  let db: D1Database | undefined = d1Database

  // Try to get DB from various sources (in order of preference)
  if (!db) {
    // Method 1: Try getCloudflareContext() - the proper way for OpenNext.js Cloudflare
    // Use a try-catch with dynamic access to avoid import issues
    const context = getCloudflareContext();

    if (getCloudflareContext()) {
      //@ts-ignore
      db = context.env.DB as D1Database

    } 
  }
  
  if (!db) {
    // Check if we're in Next.js dev mode (which doesn't support D1 bindings)
    const isNextDev = typeof process !== 'undefined' && 
                      process.env.NODE_ENV === 'development' &&
                      !process.env.WRANGLER_SESSION_METADATA
    
    if (isNextDev) {
      throw new Error(
        '❌ D1 database binding not found.\n\n' +
        '⚠️  You are using "next dev" which does not support Cloudflare D1 bindings.\n\n' +
        '✅ Solution: Use the Cloudflare preview mode instead:\n' +
        '   npm run dev\n\n' +
        '   This will use "opennextjs-cloudflare preview" which provides D1 bindings.\n\n' +
        '📝 If you haven\'t set up the local D1 database yet, run:\n' +
        '   ./scripts/setup-d1-local.sh\n' +
        '   or manually:\n' +
        '   wrangler d1 create DB --local\n' +
        '   wrangler d1 execute DB --local --file=./prisma/d1-schema.sql'
      )
    }
    
    // Try to provide more diagnostic info
    const contextSymbol = Symbol.for('__cloudflare-context__')
    const hasContext = !!(globalThis as any)[contextSymbol]
    
    throw new Error(
      '❌ D1 database binding not found.\n\n' +
      'The binding should be available via Cloudflare context (env.DB), but it was not found.\n\n' +
      'Diagnostics:\n' +
      `  - Cloudflare context available: ${hasContext ? '✅' : '❌'}\n` +
      `  - process.env.DB: ${typeof process !== 'undefined' && process.env.DB ? '✅' : '❌'}\n\n` +
      'Make sure:\n' +
      '1. ✅ DB is configured in wrangler.toml with binding = "DB"\n' +
      '2. ✅ You are using "npm run dev" (not "npm run dev:fast")\n' +
      '3. ✅ Local D1 database exists (run: wrangler d1 create DB --local)\n' +
      '4. ✅ Schema is applied (run: wrangler d1 execute DB --local --file=./prisma/d1-schema.sql)\n\n' +
      '💡 Quick setup:\n' +
      '   ./scripts/setup-d1-local.sh'
    )
  }
  
  const adapter = new PrismaD1(db)
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
