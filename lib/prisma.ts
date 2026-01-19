/**
 * Prisma Client Instance
 * Automatically selects the correct database adapter based on environment
 * 
 * Supports:
 * - Cloudflare D1 (production with edge runtime)
 * - Local SQLite (development with Node.js runtime)
 * 
 * Configuration via environment variables:
 * - DB_ADAPTER: Explicit adapter selection ('d1', 'local-sqlite')
 * - DATABASE_URL: Database connection string (required for local-sqlite)
 */

import { PrismaClient } from '@prisma/client'
import { createPrismaClient } from './database/client'

// Singleton instance with lazy initialization
let cachedPrisma: PrismaClient | null = null

/**
 * Get or create the Prisma client instance
 * Uses a singleton pattern to avoid multiple client instances
 */
export function getPrisma(): PrismaClient {
  if (!cachedPrisma) {
    cachedPrisma = createPrismaClient()
  }
  return cachedPrisma
}

/**
 * Prisma client proxy for convenient direct access
 * Example: import { prisma } from '@/lib/prisma'
 * 
 * This proxy allows using prisma.user.findMany() directly
 * while maintaining the singleton pattern
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = client[prop as keyof PrismaClient]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
