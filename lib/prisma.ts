import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { D1Database } from '@cloudflare/workers-types'

/**
 * Get Prisma client configured with D1 adapter
 * Works in both local development (via opennextjs-cloudflare preview) and production (Cloudflare Workers)
 * The DB binding is automatically provided by Wrangler/Cloudflare
 * 
 * @param d1Database - Optional D1 database instance (defaults to process.env.DB)
 * @returns Prisma client instance
 */
export function getPrisma(d1Database?: D1Database): PrismaClient {
  // Utilise le binding D1 passé en paramètre ou depuis l'environnement
  const db = d1Database || (process.env.DB as unknown as D1Database)
  
  if (!db) {
    throw new Error('D1 database binding not found. Make sure DB is configured in wrangler.toml and you are using opennextjs-cloudflare preview for local development.')
  }
  
  const adapter = new PrismaD1(db)
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
